const WebSocket = require('ws')
const redis = require('redis')
const request = require('request')
const StatsD = require('hot-shots')
const {defaultStocks, getIEXURL} = require('./shared')

const redisClient = redis.createClient(6379, process.env.REDIS_HOST || '127.0.0.1')
const redisSubscriber = redis.createClient()
const port = process.env.PORT || 8080
const wss = new WebSocket.Server({port})
const stats = new StatsD()

// TODO keying subs based on symbol will create some bugs because there are duplicate coins with the same symbol
const cryptoSubscriptions = {}
const subscribers = {
  crypto: {},
  stock: {},
}

wss.on('error', function error (err) {
  console.log('Websocket Server Error: ' + err)
})

wss.on('connection', function connection (ws) {
  stats.increment('connect', 1)

  ws.on('message', function (message) {
    try {
      message = JSON.parse(message)
    } catch (e) {
      console.log('JSON parse error for websocket message', message)
    }

    const payload = message[1]
    switch (message[0]) { // switch on the event name
      case 'crypto-top':
        handleCryptoTop(payload)
        break
      case 'crypto-sub':
        handleCryptoSub(payload)
        break
      case 'stock-sub':
        handleStockSub(payload)
        break
      case 'session-start':
        stats.increment('session.start', 1, [`count:${parseInt(payload, 10)}`])
        break
      case 'add-first':
        if (payload !== 'stock' && payload !== 'crypto') {
          break
        }
        stats.increment('add_first_asset', 1, [`type:${payload}`])
        break
      case 'portfolio-click':
        stats.increment('portfolio_click', 1)
        break
      default:
        break
    }

  })

  function registerSubscriber (type, symbol) {
    if (subscribers[type][symbol]) {
      subscribers[type][symbol].push(ws)
    } else {
      subscribers[type][symbol] = [ws]
    }
  }

  function handleCryptoTop (offset) {
    offset = parseInt(offset, 10)
    stats.increment('latest.crypto', 1, [`offset:${offset}`])
    redisClient.get('latest:crypto', function (err, data) {
      if (err) throw err

      data = JSON.parse(data)
      const res = data.slice(offset, offset + 10)
      ws.send(JSON.stringify(['crypto-top', JSON.stringify(res)]))
    })
  }

  function handleCryptoSub ({symbol, requireLatest}) {
    redisClient.get(`latest:crypto:${symbol}`, function (err, response) {
      if (err) throw err

      if (response === null) {
        stats.increment('sub.crypto.invalid', 1)
        ws.send(JSON.stringify(['crypto-unsub', symbol]))
        return
      }

      response = JSON.parse(response)

      registerSubscriber('crypto', symbol)
      if (requireLatest) {
        stats.increment('sub.crypto', 1, [`symbol:${symbol}`])
        ws.send(JSON.stringify(['crypto-update', response]))
      }
    })
  }

  function handleStockSub ({symbol, requireLatest}) {
    if (defaultStocks.includes(symbol)) {
      registerSubscriber('stock', symbol)
      return
    }

    // TODO - update redis zset 'followed' with ticker and current timestamp so the worker can track only a handful of most recently subscribed stocks
    redisClient.get(`latest:stock:${symbol}`, function (err, response) {
      if (err) throw err

      if (response === null) {
        handleNewStock(symbol)
        return
      }

      // refresh this symbol's followed timestamp in redis
      redisClient.zadd(['followed:stock:iex', 'XX', Math.floor(new Date().getTime()), symbol])

      stats.increment('sub.stock', 1, [`symbol:${symbol}`])

      registerSubscriber('stock', symbol)

      if (requireLatest) {
        ws.send(JSON.stringify(['stock-update', response]))
      }
    })
  }

  function handleNewStock (symbol) {
    // Get historical data from AlphaVantage
    request(getIEXURL(symbol), {json: true}, function (err, res, data) {
      if (err) {
        console.log(`IEX fetch error for symbol ${symbol}`)
        stats.increment('sub.stock.http_error', 1)
        return
      }

      if (!data || Object.keys(data[0]).length === 0) {
        console.log(`Invalid IEX response or untracked symbol: ${symbol}`)
        stats.increment('sub.stock.invalid_or_untracked', 1)
        ws.send(JSON.stringify(['stock-unsub', symbol]))
        return
      }

      stats.increment('sub.stock', 1, [`symbol:${symbol}`])

      const {lastSalePrice} = data[0]

      const latestData = {
        symbol: symbol,
        price: lastSalePrice,
      }

      // add this symbol's followed timestamp to redis
      redisClient.hset('latest:stock', symbol, JSON.stringify(latestData))
      redisClient.zadd(['followed:stock:iex', Math.floor(new Date().getTime()), symbol])
      registerSubscriber('stock', symbol)
      redisClient.publish('stock-iex-subscriptions', symbol)

      broadcastStockUpdates(JSON.stringify(latestData))
    })
  }

  // push the top crypto currency data to the new client
  redisClient.get('top:crypto', function (err, response) {
    if (err) throw err
    ws.send(JSON.stringify(['crypto-top', response]))
  })

  // push the top crypto currency data to the new client
  redisClient.zrevrange(['marketcap:stock', 0, 19], function (err, symbols) {
    redisClient.hmget('latest:stock', symbols, function (err, response) {
      if (err) throw err
      ws.send(JSON.stringify(['stock-top', response]))
    })
  })

  function close () {
    for (const type in subscribers) {
      for (const symbol in subscribers[type]) {
        const index = subscribers[type][symbol].indexOf(ws)

        if (index === -1) {
          return
        }

        // remove this socket from list of subscribers
        subscribers[type][symbol].splice(index, 1)

        if (subscribers[type][symbol].length === 0) {
          delete subscribers[type][symbol]
        }
      }

    }
  }

  // handle graceful and ungraceful disconnects
  ws.on('close', close)
  ws.on('error', close)
})

redisSubscriber.subscribe(['crypto-updates','crypto-price-update', 'stock-updates'])
redisSubscriber.on('message', function (channel, message) {
  switch (channel) {
    case 'crypto-updates':
      broadcastCryptoUpdates(message)
      break
    case 'crypto-price-update':
      broadcastCryptoPriceUpdate(message)
      break
    case 'stock-updates':
      broadcastStockUpdates(message)
      break
  }
})

function broadcastCryptoUpdates (data) {
  const coins = JSON.parse(data)
  let broadcastCount = 0
  coins.forEach(coin => {
    const msg = JSON.stringify(['crypto-update', coin])
    const clientList = subscribers.crypto[coin.symbol]
    clientList && clientList.forEach(ws => {
      if (ws.readyState !== WebSocket.OPEN) {
        return
      }

      broadcastCount++
      ws.send(msg)
    })
  })
}

function broadcastCryptoPriceUpdate (data) {
  data = JSON.parse(data)
  let broadcastCount = 0
  const msg = JSON.stringify(['crypto-price-update', data])
  const clientList = subscribers.crypto[data.symbol]
  clientList && clientList.forEach(ws => {
    if (ws.readyState !== WebSocket.OPEN) {
      return
    }

    broadcastCount++
    ws.send(msg)
  })

}

function broadcastStockUpdates (data) {
  const stock = JSON.parse(data)
  let broadcastCount = 0

  const msg = JSON.stringify(['stock-update', data])
  const clientList = subscribers.stock[stock.symbol]
  clientList && clientList.forEach(ws => {
    if (ws.readyState !== WebSocket.OPEN) {
      return
    }

    broadcastCount++
    ws.send(msg)
  })
}
