const WebSocket = require('ws');
const redis = require('redis');

const redisClient = redis.createClient();
const sub = redis.createClient();
const wss = new WebSocket.Server({port: 8080});

// TODO keying subs based on symbol will create some bugs because there are duplicate coins with the same symbol
const cryptoSubscriptions = {};
const stockSubscriptions = {};

wss.on('connection', function connection(ws) {
  ws.on('message', function (message) {
    message = JSON.parse(message);

    const payload = message[1];
    switch (message[0]) { // switch on the event name
      case 'crypto-sub':
        handleCryptoSub(payload);
        break;
      case 'stock-sub':
        handleStockSub(payload);
        break;
    }

  });

  function handleCryptoSub({symbol, requireLatest}) {
    if (cryptoSubscriptions[symbol]) {
      cryptoSubscriptions[symbol].push(ws)
    } else {
      cryptoSubscriptions[symbol] = [ws]
    }

    redisClient.get(`latest:crypto:${symbol}`, function (err, response) {
      if (err) throw err;

      if (response === null) {
        ws.send(JSON.stringify(['crypto-unsub', symbol]));
        return
      }

      if (requireLatest) {
        ws.send(JSON.stringify(['crypto-update', response]));
      }
    });
  }

  function handleStockSub({symbol, requireLatest}) {
    // TODO - Check if symbol exists in redis zset 'followed'. If so, proceed. If not, make coinmarketcap call here.
    if (stockSubscriptions[symbol]) {
      stockSubscriptions[symbol].push(ws)
    } else {
      stockSubscriptions[symbol] = [ws]
    }

    // TODO - update redis zset 'followed' with ticker and current timestamp so the worker can track only a handful of most recently subscribed stocks

    redisClient.get(`latest:stock:${symbol}`, function (err, response) {
      if (err) throw err;

      if (response === null) {
        ws.send(JSON.stringify(['stock-unsub', symbol]));
        return;
      }

      if (requireLatest) {
        ws.send(JSON.stringify(['stock-update', response]));
      }
    });
  }

  redisClient.get('top:crypto', function (err, response) {
    if (err) throw err;
    ws.send(JSON.stringify(['crypto-top', response]));
  });

  redisClient.hgetall('top:stock', function (err, response) {
    if (err) throw err;
    ws.send(JSON.stringify(['stock-top', response]));
  });

  // TODO for timeseries data / charts
  // const args = [ `historical:BTC`, '+inf', '-inf', 'LIMIT', 1];
  // client.zrevrangebyscore(args, function (err, response) {
  //   if (err) throw err;
  // });

  function close() {
    for (const symbol in cryptoSubscriptions) {
      const index = cryptoSubscriptions[symbol].indexOf(ws);

      if (index === -1) {
        return;
      }

      cryptoSubscriptions[symbol].splice(index, 1);

      if (cryptoSubscriptions[symbol].length === 0) {
        delete cryptoSubscriptions[symbol];
      }
    }

    for (const symbol in stockSubscriptions) {
      const index = stockSubscriptions[symbol].indexOf(ws);

      if (index === -1) {
        return;
      }

      stockSubscriptions[symbol].splice(index, 1);

      if (stockSubscriptions[symbol].length === 0) {
        delete stockSubscriptions[symbol];
      }
    }
  }

  // handle graceful and ungraceful disconnects
  ws.on('close', close);
  ws.on('error', close);
});

sub.subscribe(['crypto-updates', 'stock-updates']);
sub.on("message", function (channel, message) {
  switch (channel) {
    case 'crypto-updates':
      broadcastCryptoUpdates(message);
      break;
    case 'stock-updates':
      broadcastStockUpdates(message);
      break;
  }
});

function broadcastCryptoUpdates(data) {
  const coins = JSON.parse(data);
  let broadcastCount = 0;
  coins.forEach(coin => {
    const msg = JSON.stringify(['crypto-update', JSON.stringify(coin)]);
    const clientList = cryptoSubscriptions[coin.symbol];
    clientList && clientList.forEach(ws => {
      broadcastCount++;
      ws.send(msg);
    });
  });
  console.log(`Received crypto update with ${coins.length} coins. Broadcasted ${broadcastCount} messages.`)
}

function broadcastStockUpdates(data) {
  console.log('stock update', data);
  const stock = JSON.parse(data);
  let broadcastCount = 0;

  stock.price = 11.11;
  data = JSON.stringify(stock);

  const msg = JSON.stringify(['stock-update', data]);
  const clientList = stockSubscriptions[stock.symbol];
  clientList && clientList.forEach(ws => {
    broadcastCount++;
    ws.send(msg);
  });
  console.log(`Received stock update for ${stock.symbol}. Broadcasted ${broadcastCount} messages.`)
}

// TODO for debugging -- remove
// setInterval(function () {
//   console.log(subscriptions.LOLCOIN && subscriptions.LOLCOIN.length)
// }, 1000)
