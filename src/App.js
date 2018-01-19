import React, {Component} from 'react'
import './App.css'
import moment from 'moment'
import Header from './Header'
import Coin from './AssetRow'
import BigNumber from './BigNumber'
import Footer from './Footer'
import ReconnectingWebSocket from 'reconnecting-websocket'
import quantityPointer from './images/quantityPointer.svg'
import _ from 'lodash'

const STORAGE_KEY_COINS_HELD = 'coinsHeld'
const STORAGE_KEY_STOCKS_HELD = 'stocksHeld'
const STORAGE_KEY_LAST_VISIT = 'lastVisit'
const STORAGE_KEY_CHANGE_WINDOW = 'changeWindow'
const STORAGE_KEY_CRYPTO_TAB = 'cryptoTab'

function getLocalStorage(key, defaultValue) {
  let value
  try {
    value = localStorage.getItem(key)
  } catch (e) {
    //no-op for safari private browsing mode
  }

  if (value === null) {
    return defaultValue
  } else {
    return JSON.parse(value)
  }
}

function setLocalStorage(key, object) {
  try {
    localStorage.setItem(key, JSON.stringify(object))
  } catch (e) {
    //no-op for safari private browsing mode
  }
}

const lastVisit = getLocalStorage(STORAGE_KEY_LAST_VISIT)
let lastRank = 0

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      coins: [],
      stocks: [],
      coinsHeld: {},
      stocksHeld: {},
      addCryptoSymbol: '',
      addStockTicker: '',
      lastUpdate: new Date(),
      socketConnected: true,
      changeWindow: 'percent_change_1h',
      cryptoTab: 'marketcap',
      stockTab: 'marketcap',
      fixedOverview: false
    }
  }

  componentDidMount() {
    const cryptoTab = getLocalStorage(STORAGE_KEY_CRYPTO_TAB)

    this.setState({
      coinsHeld: getLocalStorage(STORAGE_KEY_COINS_HELD, {}),
      stocksHeld: getLocalStorage(STORAGE_KEY_STOCKS_HELD, {}),
      changeWindow: getLocalStorage(STORAGE_KEY_CHANGE_WINDOW, 'percent_change_1h'),
      cryptoTab: cryptoTab || 'marketcap',
      showHelper: !cryptoTab
    })

    this.socket = new ReconnectingWebSocket(process.env.REACT_APP_SOCKET_URL);
    this.socket.addEventListener('open', () => this.setState({socketConnected: true}))
    this.socket.addEventListener('close', () => this.setState({socketConnected: false}))

    // Listen for messages
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data)
      const eventName = message[0]
      const payload = message[1]
      switch (eventName) {
        case 'crypto-top':
          this.handleTopCrypto(payload)
          break
        case 'crypto-update':
          this.handleCryptoUpdate(payload)
          break
        case 'crypto-unsub':
          this.updateHeld(payload, '')
          break
        case 'stock-top':
          this.handleTopStocks(payload)
          break
        case 'stock-update':
          this.handleStockUpdate(payload)
          break
        case 'stock-unsub':
          this.updateHeld(payload, '', true)
          break
        default:
          break
      }

      setLocalStorage(STORAGE_KEY_LAST_VISIT, (new Date()).toISOString())
    })

    window.onbeforeunload = () => {
      this.socket.close()
    }

    const scrollThreshold = 200
    window.addEventListener('scroll', _.throttle(() => {
      if (window.scrollY > scrollThreshold && this.state.fixedOverview === false) {
        this.setState({fixedOverview: true})
      } else if (window.scrollY < scrollThreshold && this.state.fixedOverview === true) {
        this.setState({fixedOverview: false})
      }
    }, 100))
  }

  handleTopCrypto(coins) {
    coins = JSON.parse(coins)
    const additionalSubscribedSymbols = Object.keys(this.state.coinsHeld)

    // First, subscribe to updates for all the top X coins by market cap
    coins.forEach(({symbol, price_usd, rank}) => {
      this.socket.send(JSON.stringify(['crypto-sub', {
        symbol: symbol,
      }]))

      setLocalStorage(`latest:crypto:${symbol}`, price_usd)
      lastRank = rank

      const index = additionalSubscribedSymbols.indexOf(symbol)
      if (index === -1) {
        return
      }

      additionalSubscribedSymbols.splice(index, 1)
    })

    // Then, subscribe to all the other coins that this user is holding
    additionalSubscribedSymbols.forEach(symbol => {
      this.socket.send(JSON.stringify(['crypto-sub', {
        symbol: symbol,
        requireLatest: true,
      }]))
    })

    const existingSymbols = this.state.coins.map(({symbol}) => symbol)
    coins = coins.filter(({symbol}) => !existingSymbols.includes(symbol))

    this.setState({
      coins: this.state.coins.concat(coins),
      lastUpdate: new Date()
    })
  }

  handleTopStocks(stocks) {
    const additionalSubscribedSymbols = Object.keys(this.state.stocksHeld)
    const symbols = Object.keys(stocks)
    // First, subscribe to updates for all the top X coins by market cap
    symbols.forEach(symbol => {
      this.socket.send(JSON.stringify(['stock-sub', {
        symbol: symbol,
      }]))

      const index = additionalSubscribedSymbols.indexOf(symbol)
      if (index === -1) {
        return
      }

      additionalSubscribedSymbols.splice(index, 1)
    })

    // Then, subscribe to all the other coins that this user is holding
    additionalSubscribedSymbols.forEach(symbol => {
      this.socket.send(JSON.stringify(['stock-sub', {
        symbol: symbol,
        requireLatest: true,
      }]))
    })

    const parsedStocks = symbols.map(symbol => {
      const stock = JSON.parse(stocks[symbol])
      setLocalStorage(`latest:stock:${symbol}`, stock.price)
      return stock
    })

    this.setState({
      stocks: parsedStocks,
      lastUpdate: new Date()
    })
  }

  handleStockUpdate(stock) {
    stock = JSON.parse(stock)
    const stocks = this.state.stocks
    const index = stocks.map(({symbol}) => symbol).indexOf(stock.symbol)
    if (index === -1) {
      stocks.push(stock)
    } else {
      stocks[index] = stock
    }

    setLocalStorage(`latest:stock:${stock.symbol}`, stock.price)

    this.setState({
      stocks,
      lastUpdate: new Date()
    })
  }

  handleCryptoUpdate(coin) {
    coin = JSON.parse(coin)
    const coins = this.state.coins
    const index = coins.map(({symbol}) => symbol).indexOf(coin.symbol)
    if (index === -1) {
      coins.push(coin)
    } else {
      coins[index] = coin
    }

    setLocalStorage(`latest:crypto:${coin.symbol}`, coin.price_usd)

    this.setState({
      coins,
      lastUpdate: new Date()
    })
  }

  updateHeld(symbol, quantity, isStock) {
    const assetsHeld = isStock ? this.state.stocksHeld : this.state.coinsHeld
    if (quantity === '') {
      delete assetsHeld[symbol]
    } else {
      assetsHeld[symbol] = quantity
    }
    this.setState({[isStock ? 'stocksHeld' : 'coinsHeld']: assetsHeld})
    setLocalStorage(isStock ? STORAGE_KEY_STOCKS_HELD : STORAGE_KEY_COINS_HELD, assetsHeld)
  }

  getHoldingQuantity(symbol, isStock) {
    const held = this.state[isStock ? 'stocksHeld' : 'coinsHeld'][symbol]
    return held && parseFloat(held.replace(/[^0-9.]/g, ''))
  }

  handleCryptoAddSubmit = e => {
    e.preventDefault()
    const symbol = this.state.addCryptoSymbol.toUpperCase()

    this.socket.send(JSON.stringify(['crypto-sub', {
      symbol,
      requireLatest: true,
    }]))

    this.updateHeld(symbol, 0)
    this.setState({addCryptoSymbol: ''})
  }

  nextTop10 = () => {
    this.socket.send(JSON.stringify(['crypto-top', lastRank]))
  }

  render() {
    let total = 0
    let totalChange = 0

    let {coins, stocks, coinsHeld, stocksHeld, changeWindow} = this.state

    coins = coins.sort((a, b) => a.rank - b.rank)

    coins = coins.map(coin => {
      // update percent change based on currently selected window
      if (this.state.changeWindow === 'percent_change_last_visit') {
        const latest = getLocalStorage(`latest:crypto:${coin.symbol}`)
        coin.change = (coin.price_usd - latest) / latest * 100
      } else {
        coin.change = coin[this.state.changeWindow]
      }

      // add this coin's value to total
      const quantity = this.getHoldingQuantity(coin.symbol) || 0
      total += quantity * coin.price_usd

      // add this coin's value change to the total change
      totalChange += quantity * coin.price_usd * (coin.change / 100)

      return coin
    })

    stocks = stocks.map(stock => {
      // update percent change based on currently selected window
      if (this.state.changeWindow === 'percent_change_last_visit') {
        const latest = getLocalStorage(`latest:stock:${stock.symbol}`)
        stock.change = (stock.price - latest) / latest * 100
      } else {
        stock.change = stock[this.state.changeWindow]
      }

      // add this stock's value to total
      const quantity = this.getHoldingQuantity(stock.symbol, true) || 0
      total += quantity * stock.price

      // add this stock's value change to the total change
      totalChange += quantity * stock.price * (stock.change / 100)

      return stock
    })

    if (total !== 0) {
      document.title = `${total.toLocaleString({}, {style: 'currency', currency: 'USD'})} | Altfolio`
    }

    const sortedCoinsHeld = coins.filter(coin => this.getHoldingQuantity(coin.symbol)).sort((coinA, coinB) => {
      const valueA = this.getHoldingQuantity(coinA.symbol) * coinA.price_usd
      const valueB = this.getHoldingQuantity(coinB.symbol) * coinB.price_usd
      return valueB - valueA
    })

    const sortedStocksHeld = stocks.filter(stock => this.getHoldingQuantity(stock.symbol, true)).sort((stockA, stockB) => {
      const valueA = this.getHoldingQuantity(stockA.symbol, true) * stockA.price
      const valueB = this.getHoldingQuantity(stockB.symbol, true) * stockB.price
      return valueB - valueA
    })

    const nonHeldCoins = coins.filter(coin => !this.getHoldingQuantity(coin.symbol))
    const nonHeldStocks = stocks.filter(stock => !this.getHoldingQuantity(stock.symbol, true))

    const combinedCoins = sortedCoinsHeld.concat(nonHeldCoins)
    const combinedStocks = sortedStocksHeld.concat(nonHeldStocks)

    const windowLabel = {
      percent_change_last_visit: `Since ${moment(lastVisit).fromNow()}`,
      percent_change_1h: 'Past Hour',
      percent_change_24h: 'Since Yesterday',
      percent_change_7d: 'Since Last Week',
    }[changeWindow]

    const renderedCoins = this.state.cryptoTab === 'marketcap' ? coins : combinedCoins

    return <div className="App" ref={ref => this.appNode = ref}>
      {this.state.socketConnected ? null : <div className="App-notification">Connecting...</div>}
      <Header lastUpdate={this.state.lastUpdate} changeWindow={this.state.changeWindow} updateChangeWindow={changeWindow => {
        setLocalStorage(STORAGE_KEY_CHANGE_WINDOW, changeWindow)
        this.setState({changeWindow})
      }}/>
      {this.state.showHelper ? <div className="App-why">
        <div>This app helps you keep track of the value of your stocks and cryptocurrencies.</div>
        <div>Just tap on the <span>portfolio</span> tab below.</div>
      </div> : null}
      <div className="App-container">
        <div className={`App-sticky ${this.state.fixedOverview ? 'show' : ''}`}>
          <div className="App-sticky-label">TOTAL</div> {total.toLocaleString({}, {
          style: 'currency',
          currency: 'USD'
        })}
        </div>
        <div className="App-panel App-overview">
          <div className="App-flex">
            <BigNumber amount={total} label={'total value'} isSticky={true}/>
            <BigNumber amount={totalChange} label={windowLabel} isChange={true}/>
            <BigNumber amount={(totalChange / total) * 100 || 0} label={windowLabel} isPercent={true} isChange={true}/>
          </div>
        </div>
        <div className="App-listings">
          <div className="App-panel App-cryptocurrencies">
            <div className="App-cryptocurrencies-header">
              <div className="App-cryptocurrencies-label">
                <span className="App-optional">Crypto Currencies</span>
                <span className="App-alt-short-text">Coins</span>
                <a className="App-cryptocurrencies-label-buy" href="https://www.coinbase.com/join/516a7c8425687c4b93000050">buy</a>
              </div>
              <div className="radio-group">
                <div className={`radio-group-option ${this.state.cryptoTab === 'portfolio' ? 'selected' : ''}`} onClick={() => {
                  this.setState({
                    cryptoTab: 'portfolio',
                    showHelper: false,
                  })
                  setLocalStorage(STORAGE_KEY_CRYPTO_TAB, 'portfolio')
                }}>
                  portfolio
                </div>
                <div className={`radio-group-option ${this.state.cryptoTab === 'marketcap' ? 'selected' : ''}`} onClick={() => {
                  this.setState({cryptoTab: 'marketcap'})
                  setLocalStorage(STORAGE_KEY_CRYPTO_TAB, 'marketcap')
                }}>
                  market cap
                </div>
              </div>
            </div>
            {this.state.cryptoTab === 'portfolio' && Object.keys(coinsHeld).length === 0 ?
              <div className="App-show-instructions" alt="instructions">
                Now add some coins you own...
                <img src={quantityPointer} alt=""/>
              </div> : null}
            {renderedCoins.map(({symbol, name, price_usd, change, market_cap_usd, rank}) =>
              <Coin key={symbol} symbol={symbol} name={name} price={price_usd} rank={rank} marketCap={market_cap_usd} tab={this.state.cryptoTab} quantityHeld={coinsHeld[symbol]} change={change} updateHeld={this.updateHeld.bind(this, symbol)}/>)}
            <form className="App-cryptocurrencies-add" onSubmit={this.handleCryptoAddSubmit}>
              Follow
              <input type="text" value={this.state.addCryptoSymbol} ref={input => this.addCryptoSymbol = input} onChange={() => {
                this.setState({addCryptoSymbol: this.addCryptoSymbol.value})
              }} className="App-cryptocurrencies-add-ticker" placeholder="symbol"/>
              <span>or <a onClick={this.nextTop10}>show 10 more coins</a></span>
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
                <div className={`radio-group-option ${this.state.cryptoTab === 'portfolio' ? 'selected' : ''}`} onClick={() => {
                  this.setState({
                    cryptoTab: 'portfolio',
                    showHelper: false,
                  })
                  setLocalStorage(STORAGE_KEY_CRYPTO_TAB, 'portfolio')
                }}>portfolio
                </div>
                <div className={`radio-group-option ${this.state.cryptoTab === 'marketcap' ? 'selected' : ''}`} onClick={() => {
                  this.setState({cryptoTab: 'marketcap'})
                  setLocalStorage(STORAGE_KEY_CRYPTO_TAB, 'marketcap')
                }}>market cap
                </div>
              </div>
            </div>
            {combinedStocks.map(({symbol, price, change}) =>
              <Coin key={symbol} symbol={symbol} price={price} tab={this.state.cryptoTab} quantityHeld={stocksHeld[symbol]} change={change} isStock={true} updateHeld={quantity => this.updateHeld(symbol, quantity, true)}/>)}
            <form className="App-stocks-add" onSubmit={this.handleCryptoAddSubmit}>
              More stock tools coming soon!
            </form>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  }
}

export default App
