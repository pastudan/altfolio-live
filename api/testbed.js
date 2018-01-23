const redis = require('redis')
const redisClient = redis.createClient()

const currentPrice = 176.89
const delta = .11
let up = false;

setInterval(() => {
  const price = up ? currentPrice + delta : currentPrice - delta;
  redisClient.publish('stock-updates', JSON.stringify({
    symbol: 'AAPL',
    price,
    market_cap: 5183590000 * price,
    percent_change_1h: up ? 1.23 : 1.08
  }))
  up = !up;
}, 3000)


setInterval(() => {
  const price = up ? currentPrice + delta : currentPrice - delta;
  redisClient.publish('stock-updates', JSON.stringify({
    symbol: 'MSFT',
    price,
    market_cap: 5183590000 * price,
    percent_change_1h: up ? 1.23 : 1.08
  }))
  up = !up;
}, 1235)


setInterval(() => {
  const price = up ? currentPrice + delta : currentPrice - delta;
  redisClient.publish('stock-updates', JSON.stringify({
    symbol: 'AMZN',
    price,
    market_cap: 5183590000 * price,
    percent_change_1h: up ? 1.23 : 1.08
  }))
  up = !up;
}, 2315)