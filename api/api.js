const WebSocket = require('ws')
const redis = require('redis')
const {defaultStocks, getAlphaVantageURL, getIEXURL} = require('./shared')

const redisClient = redis.createClient()
const redisSubscriber = redis.createClient()
const port = process.env.PORT || 8080
const wss = new WebSocket.Server({port})
const request = require('request')

// TODO keying subs based on symbol will create some bugs because there are duplicate coins with the same symbol
const cryptoSubscriptions = {}
const subscribers = {
  crypto: {},
  stock: {},
}

wss.on('connection', function connection (ws) {
  ws.on('message', function (message) {
    message = JSON.parse(message)

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
    redisClient.get(`latest:crypto`, function (err, data) {
      if (err) throw err

      data = JSON.parse(data)
      const res = data.slice(offset, offset + 10)
      ws.send(JSON.stringify(['crypto-top', JSON.stringify(res)]))
    })
  }

  function handleCryptoSub ({symbol, requireLatest}) {
    if (cryptoSubscriptions[symbol]) {
      cryptoSubscriptions[symbol].push(ws)
    } else {
      cryptoSubscriptions[symbol] = [ws]
    }

    redisClient.get(`latest:crypto:${symbol}`, function (err, response) {
      if (err) throw err

      if (response === null) {
        ws.send(JSON.stringify(['crypto-unsub', symbol]))
        return
      }

      if (requireLatest) {
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
        return
      }

      console.log(`IEX response for ${symbol}`, data)

      if (!data || Object.keys(data[0]).length === 0) {
        console.log(`Invalid IEX response or untracked symbol: ${symbol}`)
        ws.send(JSON.stringify(['stock-unsub', symbol]))
        return
      }

      const {lastSalePrice} = data[0]

      const latestData = {
        symbol: symbol,
        price: lastSalePrice,
      }

      // add this symbol's followed timestamp to redis
      redisClient.hset('latest:stock', symbol, latestData)
      redisClient.zadd(['followed:stock:iex', Math.floor(new Date().getTime()), symbol])
      registerSubscriber('stock', symbol)
      redisClient.publish('stock-iex-subscriptions', symbol)

      broadcastStockUpdates(JSON.stringify(latestData))
    })

    //TODO get historical data from AlphaVantage
  }

  redisClient.get('top:crypto', function (err, response) {
    if (err) throw err
    ws.send(JSON.stringify(['crypto-top', response]))
  })

  redisClient.zrevrange(['marketcap:stock', 0, 19], function(err, symbols) {
    redisClient.hmget('latest:stock', symbols, function (err, response) {
      if (err) throw err
      ws.send(JSON.stringify(['stock-top', response]))
    })
  })

  // TODO for timeseries data / charts
  // const args = [ `historical:BTC`, '+inf', '-inf', 'LIMIT', 1];
  // client.zrevrangebyscore(args, function (err, response) {
  //   if (err) throw err;
  // });

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

redisSubscriber.subscribe(['crypto-updates', 'stock-updates'])
redisSubscriber.on('message', function (channel, message) {
  switch (channel) {
    case 'crypto-updates':
      broadcastCryptoUpdates(message)
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
    const msg = JSON.stringify(['crypto-update', JSON.stringify(coin)])
    const clientList = cryptoSubscriptions[coin.symbol]
    clientList && clientList.forEach(ws => {
      if (ws.readyState !== WebSocket.OPEN) {
        return
      }

      broadcastCount++
      ws.send(msg)
    })
  })
}

function broadcastStockUpdates (data) {
  const stock = JSON.parse(data)
  let broadcastCount = 0

  const msg = JSON.stringify(['stock-update', data])
  const clientList = subscribers['stock'][stock.symbol]
  clientList && clientList.forEach(ws => {
    if (ws.readyState !== WebSocket.OPEN) {
      return
    }

    broadcastCount++
    ws.send(msg)
  })
}
