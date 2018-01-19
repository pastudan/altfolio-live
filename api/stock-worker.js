const redis = require('redis');
const request = require('request');
const async = require('async');
const now = require("performance-now");
const _ = require('lodash');
const socket = require('socket.io-client')('https://ws-api.iextrading.com/1.0/tops')
const defaultStocks = require('./default-stocks');

const StockAPIKey = process.env.STOCK_API_KEY;
const redisClient = redis.createClient();


const getStockAPIURL = function (symbol) {
  return `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=1min&apikey=${StockAPIKey}`;
};

// AlphaVantage asks for no more than 1 per second, but we only track a few stocks anyway and they update every minute.
const stockRefreshIntervalMs = 1000 * 60;

const requests = {};

function fetchStockData() {
  defaultStocks.forEach(symbol => {
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

const latestStockData = {};
// Listen to the channel's messages
socket.on('message', message => {
  const {symbol, lastSalePrice} = JSON.parse(message);
  if (latestStockData[symbol] === lastSalePrice) {
    return
  }

  const latestData = {
    symbol,
    price: lastSalePrice,
    volume: 0,
  };

  redisClient.publish('stock-updates', JSON.stringify(latestData));

  latestStockData[symbol] = lastSalePrice;
  console.log(symbol, lastSalePrice)
})

socket.on('connect', () => {

  //TODO look at redis IEX and find all the unsub'd stocks, and sub
  socket.emit('subscribe', defaultStocks.join(','))

  // TODO for performance - frequrntly (once / hr) look at redis IEX and find all the stocks that haven't been subscribed to in a while and unsubscribe from them
})

socket.on('disconnect', () => console.log('IEX feed Disconnected.'))


fetchStockData();
setInterval(fetchStockData, stockRefreshIntervalMs);