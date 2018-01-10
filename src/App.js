import React, {Component} from 'react';
import './App.css';
import Header from './Header';
import chart from './images/chart.png';
import Coin from './Coin';
import BigNumber from './BigNumber';
import Footer from './Footer';
import ReconnectingWebSocket from 'reconnecting-websocket';

const COINS_HELD_KEY = 'coinsHeld';

function Stock({symbol, name}) {
  return <div className="App-stock"></div>
}

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
      coinsHeld: {
        'BTC': '1'
      },
      addCryptoSymbol: '',
      addStockTicker: '',
      lastUpdate: new Date(),
      socketConnected: true,
    };
  }

  componentDidMount() {
    const coinsHeld = getLocalStorage(COINS_HELD_KEY, {'BTC': '1'});
    this.setState({
      coinsHeld
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
        case 'top':
          this.handleTop(payload);
          break;
        case 'crypto-update':
          this.handleCryptoUpdate(payload);
          break;
        case 'crypto-unsub':
          this.updateHeld(payload, '');
          break;
      }
    });

    window.onbeforeunload = () => {
      this.socket.close()
    };
  }

  handleTop(coins) {
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

  updateHeld(symbol, quantity) {
    const coinsHeld = this.state.coinsHeld;
    console.log(quantity);
    if (quantity === '') {
      delete coinsHeld[symbol]
    } else {
      coinsHeld[symbol] = quantity;
    }
    this.setState({coinsHeld});
    setLocalStorage(COINS_HELD_KEY, coinsHeld);
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

    const {coins, stocks, coinsHeld} = this.state;

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
        <div className="App-why" style={{display: 'none'}}>
          <h1>Welcome!</h1>
          <div>This app helps you keep track of the value of your stocks and cryptocurrencies.</div>
          <ul>
            <li>Stay logged out of your wallets. No login is required here, and your data is never sent to our
              servers.
            </li>
            <li>Track just your portfolio or the entire market.</li>
            <li>Get started by clicking on the <span>portfolio</span> tab below.</li>
          </ul>
        </div>
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
              {stocks.map(stock => <Stock symbol={stock.symbol} name={stock.name}/>)}
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
