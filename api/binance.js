const redis = require('redis')
const request = require('request')
const async = require('async')
const now = require('performance-now')
const _ = require('lodash')
const WebSocket = require('ws')

const redisClient = redis.createClient()

let BTCValue = 0

const streamNames = ['nano', 'eth', 'xrp', 'bch', 'ada', 'neo', 'ltc', 'xlm', 'eos', 'xem', 'miota', 'dash', 'xmr'].map(coin => `${coin}btc@aggTrade.b10`).join('/')
const conString = `wss://stream2.binance.com:9443/streams?streams=btcusdt@aggTrade.b10/${streamNames}`
const ws = new WebSocket(conString)

ws.on('message', message => {
  message = JSON.parse(message).data
  const price = parseFloat(message.p)
  const tradePair = message.s

  const symbol = tradePair.replace(/(BTC|USDT)$/, '')

  let USDPrice
  if (tradePair === 'BTCUSDT') {
    BTCValue = price
    USDPrice = parseFloat(price.toFixed(2))
  } else {
    USDPrice = parseFloat((price * BTCValue).toFixed(2))
  }

  broadcast(symbol)(USDPrice)
})

const broadcast = _.memoize(function (symbol) {
  return _.throttle(function (price) {
    console.log('broadcasting', symbol, now())
    redisClient.publish('crypto-price-update', JSON.stringify({
      'symbol': symbol,
      'price_usd': price,
    }))
  }, 3000)
})

ws.on('connect', () => {
  console.log('Binance feed connected')
})

ws.on('disconnect', () => {
  console.log('Binance feed Disconnected.')
})