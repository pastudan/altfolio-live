const redis = require('redis')
const request = require('request')
const now = require('performance-now')
const _ = require('lodash')
const {defaultStocks, getAlphaVantageDailyURL} = require('./shared')

const redisClient = redis.createClient(6379, process.env.REDIS_HOST || '127.0.0.1')

defaultStocks.forEach(symbol => {
  const start = now()

  request(getAlphaVantageDailyURL(symbol), function (error, response, body) {
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
        console.log('STOCK: API body error for ', symbol, body)
        return
      }

      console.log(`STOCK: Fetched updated data for ${symbol} in ${now() - start}ms`)

      // Check validity of response... sometimes we get bad data (like an HTML body) as a response
      if (!body['Time Series (Daily)']) {
        console.log(`STOCK: API response format invalid for ${symbol} in ${now() - start}ms`)
        return
      }

      const timestamps = Object.keys(body['Time Series (Daily)'])
      const data = body['Time Series (Daily)']

      // Add and update historical data
      const dailyData = timestamps.map(time => {
        // use the stock market closing time since we are recording the close price
        const marketTime = `${time}T16:00:00-05:00`

        const unixTimestamp = Math.round(new Date(marketTime).getTime() / 1000)
        return {
          price: data[time]['4. close'],
          timestamp: unixTimestamp
        }
      })
      const unixTimestamps = dailyData.map(({timestamp}) => timestamp)
      const zippedMinuteData = _.flatten(_.zip(unixTimestamps, dailyData.map(data => JSON.stringify(data))))
      const zaddData = [`historical:stocks:${symbol}`].concat(zippedMinuteData)
      redisClient.zadd(zaddData, function (err) {
        if (err) throw err
      })
    })
  })
})
