# Altfolio.Live


A react + websocket app to help track of a mixed portfolio of stocks and cryptocurrencies in realtime

![image](https://user-images.githubusercontent.com/1296162/35300381-13b0dfb2-003d-11e8-9498-eec57f29355f.png)

## Starting a Local Development Environment

First, install dependencies with `yarn`

#### UI (React + Webpack) Instructions

This app is built on top of [create react app](https://github.com/facebook/create-react-app), so starting the front-end is as simple as running

```bash
yarn start
```

#### API Instructions

This app uses redis as it's sole data store, so you will need to have a local redis server running on port 6379

```bash
brew install redis
```

Once that's installed, you can run individual pieces of the API as needed.

Since the UI automatically tries to reconnect to the to the websocket API upon disconnection, I like running the pieces with a watcher like [nodemon](https://github.com/remy/nodemon) when developing.

**API Pieces**

* `node api/api.js` will start the main API backend which hosts the websocket server for the UI clients. It listens for redis pub events and rebroadcasts them to all its connected end clients. This is **required** for seeing any stock / crypto data.

* `node api/crypto-worker.js` will start the script that polls for updates from CoinMakretCap and pushes them to redis upon receiving new data.

* `node api/stock-worker.js` will start the script that polls for updates from AlphaVantage and pushes them to redis upon receiving new data. It also starts a socket.io connection to IEX, which pushes live updates for most US based stocks. 

* `node api/binance.js` will open a websocket connection to [Binance](https://github.com/binance-exchange/binance-official-api-docs/blob/master/web-socket-streams.md) and receive price updates for a handful of cryptocurrencies. 

* `node api/stock-historical-backfill.js` will start a script that loads historical data (1-day and 7-day) for the default stocks. You'll only need to run this once upon initialization of data, or any time you haven't had the stock worker running for a while. Otherwise, the stock worker will log historical data as it runs. 

_NOTE:_ Running any of the stock scripts requires an [API key from AlphaVantage](https://www.alphavantage.co/support/#api-key). Once you register and receive your key, you should set it as the value to your environment variable `STOCK_API_KEY` for the scripts to function properly. 

**Starting All API Pieces**

If you have [PM2](http://pm2.keymetrics.io/) installed, you can start all these scripts with `pm2 start ecosystem.config.js`.  

## Contributing
Feel free to open a pull request to add functionality

## License
Altfolio is [MIT licensed](LICENSE).
















