import React, {Component} from 'react';
import './App.css';
import Header from './Header';
import chart from './images/chart.png';
import Coin from './Coin';
import BigNumber from './BigNumber'

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
      }
    };
  }

  componentDidMount() {
    const coinsHeld = getLocalStorage(COINS_HELD_KEY, {'BTC': '1'});
    this.setState({
      coinsHeld
    });

    window.fetch('https://api.coinmarketcap.com/v1/ticker/?limit=30')
      .then(res => res.json())
      .then(coins => this.setState({coins}))
  }

  updateHeld(symbol, quantity) {
    const coinsHeld = this.state.coinsHeld;
    coinsHeld[symbol] = quantity;
    this.setState({
      coinsHeld: coinsHeld
    });

    setLocalStorage(COINS_HELD_KEY, coinsHeld);
  }

  getHoldingQuantity(symbol) {
    const held = this.state.coinsHeld[symbol];
    return held && parseFloat(held.replace(/[^0-9.]/g, ''));
  }

  render() {
    let total = 0;

    const {coins, stocks, coinsHeld} = this.state;

    coins.forEach(({symbol, price_usd}) => {
      const quantity = this.getHoldingQuantity(symbol) || 0;
      total += quantity * price_usd;
    });

    if (total !== 0) {
      document.title = `${total.toLocaleString({}, {style: 'currency', currency: 'USD'})} | AltFolio Rodeo`
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
        <Header/>
        <div className="App-container">
          <div className="App-panel App-panel-padding">
            <div className="App-flex">
              <BigNumber amount={total}/>
              <BigNumber amount={45.6934}/>
              <BigNumber amount={5.3534} isPercent={true}/>
            </div>
            {/*<img src={chart} className="App-chart" alt="chart"/>*/}
          </div>
          <div className="App-listings">
            <div className="App-panel App-cryptocurrencies">
              <div className="App-cryptocurrencies-header">
                <div className="App-cryptocurrencies-label">Crypto Currencies</div>
                <div className="radio-group">
                  <div className="radio-group-option selected">portfolio</div>
                  <div className="radio-group-option">market cap</div>
                  <div className="radio-group-option">chart</div>
                </div>
              </div>
              {allCoins.map(({symbol, name, price_usd, percent_change_1h}) =>
                <Coin key={symbol} symbol={symbol} name={name} price={price_usd} quantityHeld={coinsHeld[symbol]} change={percent_change_1h} updateHeld={this.updateHeld.bind(this, symbol)}/>)}
            </div>
            <div className="App-panel App-stocks">
              <div className="App-cryptocurrencies-header">
                <div className="App-cryptocurrencies-label">Stocks</div>
                <div className="radio-group">
                  <div className="radio-group-option selected">portfolio</div>
                  <div className="radio-group-option">market cap</div>
                  <div className="radio-group-option">chart</div>
                </div>
              </div>
              {stocks.map(stock => <Stock symbol={stock.symbol} name={stock.name}/>)}
            </div>
          </div>
        </div>
      </div>
    )
      ;
  }
}

export default App;
