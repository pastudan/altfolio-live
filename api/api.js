const WebSocket = require('ws');
const redis = require('redis');

const redisClient = redis.createClient();
const wss = new WebSocket.Server({port: 8080});

const subscriptions = {};

wss.on('connection', function connection(ws) {
  ws.on('message', function (message) {
    message = JSON.parse(message);

    const payload = message[1];
    switch (message[0]) { // switch on the event name
      case 'crypto-sub':
        handleCryptoSub(payload);
        break;
    }

  });

  function handleCryptoSub({symbol, requireLatest}) {
    // TODO for stocks - Check if symbol exists in redis zset 'followed'. If so, proceed. If not, make coinmarketcap call here.
    if (subscriptions[symbol]) {
      subscriptions[symbol].push(ws)
    } else {
      subscriptions[symbol] = [ws]
      // TODO for stocks - SUB to redis stock channel
    }

    // TODO for stocks - update redis zset 'followed' with ticker and current timestamp

    redisClient.get(`latest:${symbol}`, function (err, response) {
      if (err) throw err;

      console.log(symbol, response);
      if (response === null) {
        ws.send(JSON.stringify(['crypto-unsub', symbol]));
      } else if (requireLatest) {
        ws.send(JSON.stringify(['crypto-update', response]));
      }
    });
  }

  redisClient.get('top', function (err, response) {
    if (err) throw err;
    ws.send(JSON.stringify(['top', response]));
  });

  // TODO for timeseries data
  // const args = [CACHE_COIN_PREFIX + 'BTC', '+inf', '-inf', 'LIMIT', 1];
  // client.zrevrangebyscore(args, function (err, response) {
  //   if (err) throw err;
  // });

  function close() {
    for (const symbol in subscriptions) {
      const index = subscriptions[symbol].indexOf(ws);

      if (index === -1) {
        return;
      }

      subscriptions[symbol].splice(index, 1);

      if (subscriptions[symbol].length === 0) {
        delete subscriptions[symbol];

        //TODO unsubscribe this API server from redis
      }
    }
  }

  // handle graceful and ungraceful disconnects
  ws.on('close', close);
  ws.on('error', close);
});

// TODO for debugging -- remove
// setInterval(function () {
//   console.log(subscriptions.LOLCOIN && subscriptions.LOLCOIN.length)
// }, 1000)
