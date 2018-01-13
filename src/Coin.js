import React, {Component} from 'react';
import coinLogos from './images/coinLogos';
import stockLogos from './images/stockLogos';
import defaultLogo from './images/defaultCoinLogo.svg';
import Cleave from 'cleave.js/react';
import './Coin.css'

const localeOpts = {
  style: 'currency',
  currency: 'USD'
};

class Coin extends Component {
  render() {
    let {symbol, name, price, quantityHeld, updateHeld, change, tab, rank, marketCap, isStock} = this.props;

    const logos = isStock ? stockLogos : coinLogos;

    price = parseFloat(price);

    return <div className="Coin">
      {tab === 'marketcap' ? <div className="Coin-meta Coin-rank">{rank}</div> : null}
      <img className="Coin-meta Coin-logo" src={logos[symbol] ? logos[symbol] : defaultLogo} alt="coin logo"/>
      <div className="Coin-meta Coin-label">
        <div className={"Coin-symbol"}>{symbol}</div>
        <div className={"Coin-name"}>{name}</div>
      </div>
      <div className="Coin-meta Coin-price">{price.toLocaleString({}, localeOpts)}</div>
      {tab === 'portfolio' ? <div className="Coin-meta symbol">×</div> : null}
      {tab === 'portfolio' ? <div className="Coin-meta Coin-quantity">
        <Cleave placeholder="-" value={quantityHeld} options={{
          numeral: true,
          numeralThousandsGroupStyle: 'thousand',
          numeralDecimalScale: 50
        }} onChange={event => {
          const value = event.target.rawValue === '.' ? '0.' : event.target.rawValue;
          updateHeld(value)
        }}/>
      </div> : null}
      {tab === 'portfolio' ? <div className="Coin-meta symbol">=</div> : null}
      {tab === 'portfolio' ? <div className="Coin-meta Coin-value">
        {quantityHeld ? `${(quantityHeld * price).toLocaleString({}, localeOpts)}` :
          <span className="Coin-quantity-null">-</span>}
      </div> : null}
      {tab === 'marketcap' ? <div className="Coin-meta Coin-marketcap">${parseInt(marketCap, 10).toLocaleString()}</div> : null}
      <div className={`Coin-meta Coin-change ${change > 0 ? 'positive' : ''} ${change < 0 ? 'negative' : ''}`}>
        <div className="Coin-change-percent">{change ? parseFloat(change).toFixed(2) : '-'}<span>%</span></div>
        {tab === 'portfolio' ?
          <div className="Coin-change-price">{!quantityHeld ? null : (change / 100 * quantityHeld * price).toLocaleString({}, localeOpts)}</div> : null}
      </div>
    </div>
  }
}

export default Coin