import React, {Component} from 'react';
import './App.css';
import Header from './Header';
import Coin from './Coin';
import Stock from './Stock';
import BigNumber from './BigNumber';
import Footer from './Footer';
import ReconnectingWebSocket from 'reconnecting-websocket';

const COINS_HELD_STORAGE_KEY = 'coinsHeld';
const STOCKS_HELD_STORAGE_KEY = 'stocksHeld';

function getLocalStorage(key, defaultValue) {
  let value;
  try {
    value = localStorage.getItem(key);
  } catch (e) {
    //no-op for safari private browsing mode
  }

  if (value === null) {
    return defaultValue
  } else {
    return JSON.parse(value);
  }
}

function setLocalStorage(key, object) {
  try {
    localStorage.setItem(key, JSON.stringify(object));
  } catch (e) {
    //no-op for safari private browsing mode
  }
}

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      coins: [],
      stocks: [],
      coinsHeld: {},
      stocksHeld: {},
      addCryptoSymbol: '',
      addStockTicker: '',
      lastUpdate: new Date(),
      socketConnected: true,
    };
  }

  componentDidMount() {
    this.setState({
      coinsHeld: getLocalStorage(COINS_HELD_STORAGE_KEY, {'BTC': '1'}),
      stocksHeld: getLocalStorage(STOCKS_HELD_STORAGE_KEY, {'AAPL': '1'})
    });

    this.socket = new ReconnectingWebSocket('ws://localhost:8080');
    this.socket.addEventListener('open', () => this.setState({socketConnected: true}));
    this.socket.addEventListener('close', () => this.setState({socketConnected: false}));

    // Listen for messages
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      const eventName = message[0];
      const payload = message[1];
      switch (eventName) {
        case 'crypto-top':
          this.handleTopCrypto(payload);
          break;
        case 'crypto-update':
          this.handleCryptoUpdate(payload);
          break;
        case 'crypto-unsub':
          this.updateHeld(payload, '');
          break;
        case 'stock-top':
          this.handleTopStocks(payload);
          break;
        case 'stock-update':
          this.handleStockUpdate(payload);
          break;
        case 'stock-unsub':
          this.updateHeld(payload, '', true);
          break;
      }
    });

    window.onbeforeunload = () => {
      this.socket.close()
    };
  }

  handleTopCrypto(coins) {
    coins = JSON.parse(coins);
    const additionalSubscribedSymbols = Object.keys(this.state.coinsHeld);

    // First, subscribe to updates for all the top X coins by market cap
    coins.forEach(({symbol}) => {
      this.socket.send(JSON.stringify(['crypto-sub', {
        symbol: symbol,
      }]));

      const index = additionalSubscribedSymbols.indexOf(symbol);
      if (index === -1) {
        return;
      }

      additionalSubscribedSymbols.splice(index, 1)
    });

    // Then, subscribe to all the other coins that this user is holding
    additionalSubscribedSymbols.forEach(symbol => {
      this.socket.send(JSON.stringify(['crypto-sub', {
        symbol: symbol,
        requireLatest: true,
      }]));
    });

    this.setState({
      coins,
      lastUpdate: new Date()
    });
  }

  handleTopStocks(stocks) {
    const additionalSubscribedSymbols = Object.keys(this.state.stocksHeld);
    const symbols = Object.keys(stocks);
    // First, subscribe to updates for all the top X coins by market cap
    symbols.forEach(symbol => {
      this.socket.send(JSON.stringify(['stock-sub', {
        symbol: symbol,
      }]));

      const index = additionalSubscribedSymbols.indexOf(symbol);
      if (index === -1) {
        return;
      }

      additionalSubscribedSymbols.splice(index, 1)
    });

    // Then, subscribe to all the other coins that this user is holding
    additionalSubscribedSymbols.forEach(symbol => {
      this.socket.send(JSON.stringify(['stock-sub', {
        symbol: symbol,
        requireLatest: true,
      }]));
    });

    this.setState({
      stocks: symbols.map(key => JSON.parse(stocks[key])),
      lastUpdate: new Date()
    });
  }

  handleStockUpdate(stock) {
    stock = JSON.parse(stock);
    const stocks = this.state.stocks;
    const index = stocks.map(({symbol}) => symbol).indexOf(stock.symbol);
    if (index === -1) {
      stocks.push(stock)
    } else {
      stocks[index] = stock;
    }

    this.setState({
      stocks,
      lastUpdate: new Date()
    })
  }

  handleCryptoUpdate(coin) {
    coin = JSON.parse(coin);
    const coins = this.state.coins;
    const index = coins.map(({symbol}) => symbol).indexOf(coin.symbol);
    if (index === -1) {
      coins.push(coin)
    } else {
      coins[index] = coin;
    }

    this.setState({
      coins,
      lastUpdate: new Date()
    })
  }

  updateHeld(symbol, quantity, isStock) {
    const assetsHeld = isStock ? this.state.stocksHeld : this.state.coinsHeld;
    if (quantity === '') {
      delete assetsHeld[symbol]
    } else {
      assetsHeld[symbol] = quantity;
    }
    this.setState({[isStock ? 'stocksHeld' : 'coinsHeld']: assetsHeld});
    setLocalStorage(isStock ? STOCKS_HELD_STORAGE_KEY : COINS_HELD_STORAGE_KEY, assetsHeld);
  }

  getHoldingQuantity(symbol) {
    const held = this.state.coinsHeld[symbol];
    return held && parseFloat(held.replace(/[^0-9.]/g, ''));
  }

  handleCryptoAddSubmit = e => {
    e.preventDefault();
    const symbol = this.state.addCryptoSymbol.toUpperCase();

    this.socket.send(JSON.stringify(['crypto-sub', {
      symbol,
      requireLatest: true,
    }]));

    this.updateHeld(symbol, 0);
    this.setState({addCryptoSymbol: ''});
  };

  render() {
    let total = 0;

    const {coins, stocks, coinsHeld, stocksHeld} = this.state;

    coins.forEach(({symbol, price_usd}) => {
      const quantity = this.getHoldingQuantity(symbol) || 0;
      total += quantity * price_usd;
    });

    if (total !== 0) {
      document.title = `${total.toLocaleString({}, {style: 'currency', currency: 'USD'})} | Altfolio`
    }

    const sortedCoinsHeld = coins.filter(coin => this.getHoldingQuantity(coin.symbol)).sort((coinA, coinB) => {
      const valueA = this.getHoldingQuantity(coinA.symbol) * coinA.price_usd;
      const valueB = this.getHoldingQuantity(coinB.symbol) * coinB.price_usd;
      return valueB - valueA;
    });

    const nonHeldCoins = coins.filter(coin => !this.getHoldingQuantity(coin.symbol));

    const allCoins = sortedCoinsHeld.concat(nonHeldCoins);

    return (
      <div className="App">
        {this.state.socketConnected ? null : <div className="App-notification">Connecting...</div>}
        <Header lastUpdate={this.state.lastUpdate}/>
        <div className="App-why">
          <div>This app helps you keep track of the value of your stocks and cryptocurrencies.</div>
          <div>Get started by clicking on the <span>portfolio</span> tab below.</div>
        </div>
        <div className="App-container">
          <div className="App-panel App-panel-padding">
            <div className="App-flex">
              <BigNumber amount={total}/>
              <BigNumber amount={45.6934}/>
              <BigNumber amount={5.3534} isPercent={true}/>
            </div>
          </div>
          <div className="App-listings">
            <div className="App-panel App-cryptocurrencies">
              <div className="App-cryptocurrencies-header">
                <div className="App-cryptocurrencies-label">
                  <span>Crypto Currencies</span>
                  <a className="App-cryptocurrencies-label-buy" href="https://www.coinbase.com/join/516a7c8425687c4b93000050">buy</a>
                </div>
                <div className="radio-group">
                  <div className="radio-group-option selected">portfolio</div>
                  <div className="radio-group-option">market cap</div>
                </div>
              </div>
              {allCoins.map(({symbol, name, price_usd, percent_change_1h}) =>
                <Coin key={symbol} symbol={symbol} name={name} price={price_usd} quantityHeld={coinsHeld[symbol]} change={percent_change_1h} updateHeld={this.updateHeld.bind(this, symbol)}/>)}
              <form className="App-cryptocurrencies-add" onSubmit={this.handleCryptoAddSubmit}>
                Add
                <input value={this.state.addCryptoSymbol} ref={input => this.addCryptoSymbol = input} onChange={() => {
                  this.setState({addCryptoSymbol: this.addCryptoSymbol.value})
                }} className="App-cryptocurrencies-add-ticker" placeholder="symbol"/>
                to my portfolio
                {this.state.addCryptoSymbol !== '' ?
                  <input type="submit" className="App-cryptocurrencies-add-go" value="add"/> : null}
              </form>
            </div>
            <div className="App-panel App-stocks">
              <div className="App-cryptocurrencies-header">
                <div className="App-cryptocurrencies-label">
                  <span>Stocks</span>
                  <a className="App-cryptocurrencies-label-buy" href="https://share.robinhood.com/danielp78">buy</a>
                </div>
                <div className="radio-group">
                  <div className="radio-group-option selected">portfolio</div>
                  <div className="radio-group-option">market cap</div>
                </div>
              </div>
              {stocks.map(({symbol, price}) =>
                <Stock key={symbol} symbol={symbol} price={price} quantityHeld={stocksHeld[symbol]} change={0} updateHeld={(quantity) => this.updateHeld(symbol, quantity, true)}/>)}
            </div>
          </div>
        </div>
        <Footer/>
      </div>
    )
      ;
  }
}

export default App;
