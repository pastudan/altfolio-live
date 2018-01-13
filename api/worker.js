const redis = require('redis');
const request = require('request');
const async = require('async');
const now = require("performance-now");
const _ = require('lodash');

const redisClient = redis.createClient();
const trackedStocks = [
  'AAPL',
  'GOOG',
  'MSFT',
  'AMZN',
  'BRK.A',
  'BABA',
  'TCEHY',
  'FB',
  'XOM',
  'JNJ',
];
const CRYPTO_API_URL = 'https://api.coinmarketcap.com/v1/ticker/?limit=10000';
const getStockAPIURL = function (symbol) {
  return `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=1min&apikey=${process.env.STOCK_API_KEY}`;
};

// Respect the CoinMarketCap API limit of 10 requests per minute
const cryptoRefreshIntervalMs = 1000 * 60 / 10;
// AlphaVantage asks for no more than 1 per second, but we only track 10 stocks and they update every minute.
// Their responses take ~5-20 sec anyway
const stockRefreshIntervalMs = 1000 * 60;

let cryptoReq;
const stockReqs = {};

function fetchCryptoData() {
  // kill the existing request if its still pending
  cryptoReq && cryptoReq.abort();

  cryptoReq = request(CRYPTO_API_URL, function (error, response, body) {
    if (error) console.log('Crypto API fetch error: ', error);

    redisClient.get('latest:crypto', function (err, lastBody) {
      // If response is identical to the last stored response in redis then don't proceed.
      // Useful since CoinMarketCap only updates every ~5min.
      if (lastBody === body) {
        return;
      }

      const coins = JSON.parse(body);
      const lastCoins = lastBody ? JSON.parse(lastBody) : [];
      const top = coins.slice(0, 10);

      redisClient.set('top:crypto', JSON.stringify(top));
      redisClient.set('latest:crypto', body);

      //check each coin, see if the attributes we care about are different, and dedupe the broadcast
      const lastCoinSymbolMap = lastCoins.map(({id}) => id);
      const updatedCoins = coins.filter(coin => {
        const lastCoin = lastCoins[lastCoinSymbolMap.indexOf(coin.id)];

        // include this coin in the broadcast if it didn't exist before
        // or any of the attributes that we display are different
        return !lastCoin || ['rank', 'price_usd', 'price_btc'].every(attr => {
          return coin[attr] !== lastCoin[attr]
        });
      });

      console.log(`CRYPTO: Broadcasting updates. Updated coin count: ${updatedCoins.length} / ${coins.length}`);
      redisClient.publish('crypto-updates', JSON.stringify(updatedCoins));

      const start = now();
      async.eachLimit(coins, 10, function (coin, callback) {
        // Sometimes CoinMarketCap doesn't have data for specific coins,
        // so don't throw invalid historical data into redis.
        if (coin.last_updated === null) {
          callback();
          return;
        }

        // store historical data for USD, BTC, and Volume
        redisClient.zadd([
          `historical:crypto:${coin.symbol}`,
          coin.last_updated,
          JSON.stringify({
            usd: coin['price_usd'],
            btc: coin['price_btc'],
            vol: coin['24h_volume_usd'],
            time: coin['last_updated']
          })
        ], function (err) {
          if (err) throw err;
          callback();
        });
      }, function () {
        console.log(`CRYPTO: Updated historical data in ${now() - start}ms`);
      });

      async.eachLimit(coins, 10, function (coin, callback) {
        redisClient.set(`latest:crypto:${coin.symbol}`, JSON.stringify(coin), function (err) {
          if (err) throw err;
          callback();
        });
      }, function () {
        console.log(`CRYPTO: Added all individual latest coins in ${now() - start}ms`);
      });

      const time = new Date().getTime() / 1000;
      console.log(`CRYPTO: New data. BTC Age: ${time - coins[0].last_updated}`);
    });
  });
}

function fetchStockData() {
  trackedStocks.forEach(symbol => {
    // kill the existing request if its still pending
    stockReqs[symbol] && stockReqs[symbol].abort();

    const start = now();

    stockReqs[symbol] = request(getStockAPIURL(symbol), function (error, response, body) {
      if (error) console.log('Stock API fetch error: ', error);

      redisClient.get(`latest:stock:http-res:${symbol}`, function (err, lastBody) {
        // If response is identical to the last stored response in redis then don't proceed.
        // Useful for when the market is closed.
        if (lastBody === body) {
          return;
        }

        redisClient.set(`latest:stock:http-res:${symbol}`, body);

        body = JSON.parse(body);

        console.log(`STOCK: Fetched updated data for ${symbol} in ${now() - start}ms`);

        // Check validity of response... sometimes we get bad data (like an HTML body) as a response
        if (!body['Time Series (1min)']) {
          return;
        }

        const timestamps = Object.keys(body['Time Series (1min)']);
        const data = body['Time Series (1min)'];

        const latestData = {
          symbol,
          price: data[timestamps[0]]['4. close'],
          volume: data[timestamps[0]]['5. volume'],
        };

        // look at historical data to calculate % change
        async.each([{
          time: new Date() - 3600 * 1000,
          key: 'percent_change_1h'
        }, {
          time: new Date() - 24 * 3600 * 1000,
          key: 'percent_change_24h'
        }, {
          time: new Date() - 7 * 24 * 3600 * 1000,
          key: 'percent_change_7d'
        }], function ({time, key}, callback) {
          const unixTimestamp = Math.round(new Date(time).getTime() / 1000);
          redisClient.zrevrangebyscore([`historical:stocks:${symbol}`, unixTimestamp, '-inf', 'LIMIT', 0, 1], function (err, historicalData) {
            if (err) throw err;

            if (historicalData.length === 0) {
              latestData[key] = 0;
            } else {
              const latestPrice = parseFloat(latestData.price);
              const historicalPrice = parseFloat(JSON.parse(historicalData[0]).price);
              latestData[key] = (latestPrice - historicalPrice) / historicalPrice * 100;
            }
            callback();
          });
        }, function () {
          redisClient.hset("top:stock", symbol, JSON.stringify(latestData));
          redisClient.set(`latest:stock:${symbol}`, JSON.stringify(latestData));
          redisClient.publish('stock-updates', JSON.stringify(latestData));
        });

        // Add and update historical data
        const minuteData = timestamps.map(time => {
          const unixTimestamp = Math.round(new Date(time).getTime() / 1000);
          return {
            price: data[time]['4. close'],
            volume: data[time]['5. volume'],
            timestamp: unixTimestamp
          }
        });
        const unixTimestamps = minuteData.map(({timestamp}) => timestamp);
        const zippedMinuteData = _.flatten(_.zip(unixTimestamps, minuteData.map(data => JSON.stringify(data))));
        const zaddData = [`historical:stocks:${symbol}`].concat(zippedMinuteData);
        redisClient.zadd(zaddData, function (err) {
          if (err) throw err;
        });
      });
    });
  });
}

fetchCryptoData();
setInterval(fetchCryptoData, cryptoRefreshIntervalMs);

fetchStockData();
setInterval(fetchStockData, stockRefreshIntervalMs);