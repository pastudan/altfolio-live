const redis = require('redis');
const request = require('request');
const async = require('async');
const now = require("performance-now");
const _ = require('lodash');

const StockAPIKey = process.env.STOCK_API_KEY || 'demo';
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
  'JPM',
  'BAC',
  'WMT',
  'WFC',
  'RDS-A',
  'V',
  'PG',
  'BUD',
  'T',
  'CVX',
  'UNH',
];
const getStockAPIURL = function (symbol) {
  return `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=1min&apikey=${StockAPIKey}`;
};

// AlphaVantage asks for no more than 1 per second, but we only track 10 stocks and they update every minute.
// Their responses take ~5-20 sec anyway
const stockRefreshIntervalMs = 1000 * 60;

const requests = {};

function fetchStockData() {
  trackedStocks.forEach(symbol => {
    // kill the existing request if its still pending
    requests[symbol] && requests[symbol].abort();

    const start = now();

    requests[symbol] = request(getStockAPIURL(symbol), function (error, response, body) {
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

fetchStockData();
setInterval(fetchStockData, stockRefreshIntervalMs);