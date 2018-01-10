const redis = require('redis');
const request = require('request');
const async = require('async');
const now = require("performance-now");

const redisClient = redis.createClient();
const API_URL = 'https://api.coinmarketcap.com/v1/ticker/?limit=10000';

// Respect the CoinMarketCap API limit of 10 requests per minute
const refreshIntervalMs = 1000 * 60 / 10;

let req;

function fetchMarketData() {
  // kill the existing request if its still pending
  req && req.abort();

  req = request(API_URL, function (error, response, body) {
    if (error) console.log('API fetch error: ', error);

    redisClient.get('latest', function (err, lastData) {
      if (lastData === body) {
        return;
      }

      const coins = JSON.parse(body);
      const lastCoins = lastData ? JSON.parse(lastData) : [];
      const top = coins.slice(0, 20);

      redisClient.set('top', JSON.stringify(top));
      redisClient.set('latest', body);

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

      console.log('Broadcasting updates. Updated coin count: ', updatedCoins.length);
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
          `historical:${coin.symbol}`,
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
        console.log(`updated historical data in ${now() - start}ms`);
      });

      async.eachLimit(coins, 10, function (coin, callback) {
        redisClient.set(`latest:${coin.symbol}`, JSON.stringify(coin), function (err) {
          if (err) throw err;
          callback();
        });
      }, function () {
        console.log(`added all individual latest coins in ${now() - start}ms`);
      });

      const time = new Date().getTime() / 1000;
      console.log(`New data. BTC Age: ${time - coins[0].last_updated}`);
    });
  });
}

setInterval(fetchMarketData, refreshIntervalMs);