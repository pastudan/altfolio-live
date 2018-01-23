const redis = require('redis')
const request = require('request')
const async = require('async')
const now = require('performance-now')
const _ = require('lodash')
const socket = require('socket.io-client')('https://ws-api.iextrading.com/1.0/tops')
const {defaultStocks, getAlphaVantageURL, defaultStockMetadata} = require('./shared')

const redisClient = redis.createClient()
const redisSubscriber = redis.createClient()

// TODO adjust frequency based on number of followed stocks. AlphaVantages asks for no more than 1 req per second
const stockRefreshIntervalMs = 1000 * 60 * 15

const requests = {}

function fetchStockData () {
  defaultStocks.forEach(symbol => {
    // kill the existing request if its still pending
    requests[symbol] && requests[symbol].abort()

    const start = now()

    requests[symbol] = request(getAlphaVantageURL(symbol), function (error, response, body) {
      if (error) console.log('Stock API fetch error: ', error)

      redisClient.get(`latest:stock:http-res:${symbol}`, function (err, lastBody) {
        // If response is identical to the last stored response in redis then don't proceed.
        // Useful for when the market is closed.
        if (lastBody === body) {
          //return
        }

        redisClient.set(`latest:stock:http-res:${symbol}`, body)

        try {
          body = JSON.parse(body)
        } catch (e) {
          console.log('STOCK: JSON parse error for ', symbol)
        }

        // API is giving us an error
        if (body['Information']) {
          console.log('STOCK: API body error for ', symbol)
          return
        }

        console.log(`STOCK: Fetched updated data for ${symbol} in ${now() - start}ms`)

        // Check validity of response... sometimes we get bad data (like an HTML body) as a response
        if (!body['Time Series (1min)']) {
          console.log(`STOCK: API response format invalid for ${symbol} in ${now() - start}ms`)
          return
        }

        const timestamps = Object.keys(body['Time Series (1min)'])
        const data = body['Time Series (1min)']

        const price = data[timestamps[0]]['4. close']

        const latestData = {
          symbol,
          price,
          volume: data[timestamps[0]]['5. volume'],
        }

        publishLatestData(latestData)

        // Add and update historical data
        const minuteData = timestamps.map(time => {
          const unixTimestamp = Math.round(new Date(time).getTime() / 1000)
          return {
            price: data[time]['4. close'],
            volume: data[time]['5. volume'],
            timestamp: unixTimestamp
          }
        })
        const unixTimestamps = minuteData.map(({timestamp}) => timestamp)
        const zippedMinuteData = _.flatten(_.zip(unixTimestamps, minuteData.map(data => JSON.stringify(data))))
        const zaddData = [`historical:stocks:${symbol}`].concat(zippedMinuteData)
        redisClient.zadd(zaddData, function (err) {
          if (err) throw err
        })
      })
    })
  })
}

function publishLatestData (latestData) {
  const {symbol} = latestData
  if (defaultStockMetadata[symbol]) {
    const {shares, name} = defaultStockMetadata[symbol]
    latestData.market_cap = latestData.price * shares
    latestData.name = name
  }

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
    const unixTimestamp = Math.round(new Date(time).getTime() / 1000)
    redisClient.zrevrangebyscore([`historical:stocks:${latestData.symbol}`, unixTimestamp, '-inf', 'LIMIT', 0, 1], function (err, historicalData) {
      if (err) throw err

      if (historicalData.length === 0) {
        latestData[key] = 0
      } else {
        const latestPrice = parseFloat(latestData.price)
        const historicalPrice = parseFloat(JSON.parse(historicalData[0]).price)
        latestData[key] = (latestPrice - historicalPrice) / historicalPrice * 100
      }
      callback()
    })
  }, function () {
    redisClient.hset('latest:stock', latestData.symbol, JSON.stringify(latestData))
    redisClient.publish('stock-updates', JSON.stringify(latestData))
    if (latestData.market_cap) {
      redisClient.zadd(['marketcap:stock', latestData.market_cap, symbol])
    }
  })
}

// For truly live stock updates, we're using IEX's websocket feed
const latestIEXPrices = {}
// Listen to the channel's messages
socket.on('message', message => {
  const {symbol, lastSalePrice} = JSON.parse(message)
  if (latestIEXPrices[symbol] === lastSalePrice) {
    return
  }

  const latestData = {
    symbol,
    price: lastSalePrice,
  }

  publishLatestData(latestData)

  redisClient.set(`latest:stock:${symbol}`, JSON.stringify(latestData))
  redisClient.publish('stock-updates', JSON.stringify(latestData))
  latestIEXPrices[symbol] = lastSalePrice
})

socket.on('connect', () => {

  socket.emit('subscribe', defaultStocks.join(','))
  // TODO for performance zrange by score above threshold, to prevent subscribing to old stocks
  redisClient.zrangebyscore(['followed:stock:iex', '-inf', 'inf'], (err, stocks) => {
    if (err) {
      console.log('Error fetching IEX symbols to subscribe to:', err)
    }

    console.log('Subscribing to ', stocks.join(','))
    socket.emit('subscribe', stocks.join(','))
  })

  redisSubscriber.subscribe(['stock-iex-subscriptions'])
  redisSubscriber.on('message', function (channel, symbol) {
    if (channel !== 'stock-iex-subscriptions') {
      return
    }

    console.log('new subscriber for ', symbol)
    socket.emit('subscribe', symbol)
  })

  // TODO for performance - frequently (once / hr) look at redis 'followed:stock:iex' and find all the stocks that haven't been subscribed to in a while and unsubscribe from them
})

socket.on('disconnect', () => {
  redisSubscriber.unsubscribe()
  console.log('IEX feed Disconnected.')
})

fetchStockData()
setInterval(fetchStockData, stockRefreshIntervalMs)