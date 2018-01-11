import React, {Component} from 'react';
import logos from './images/coinLogos';
import defaultLogo from './images/defaultCoinLogo.svg';
import Cleave from 'cleave.js/react';
import './Coin.css'

class Coin extends Component {
  render() {
    let {symbol, name, price, quantityHeld, updateHeld, change} = this.props;

    price = parseFloat(price);

    return <div className="Coin">
      <img className="Coin-meta Coin-logo" src={logos[symbol] ? logos[symbol] : defaultLogo} alt="coin logo"/>
      <div className="Coin-meta Coin-label">
        <div className={"Coin-symbol"}>{symbol}</div>
        <div className={"Coin-name"}>{name}</div>
      </div>
      <div className="Coin-meta Coin-price">{price.toLocaleString({}, {
        style: 'currency',
        currency: 'USD'
      })}</div>
      <div className="Coin-meta symbol">×</div>
      <div className="Coin-meta Coin-quantity">
        <Cleave placeholder="-" value={quantityHeld} options={{
          numeral: true,
          numeralThousandsGroupStyle: 'thousand',
          numeralDecimalScale: 50
        }} onChange={event => {
          const value = event.target.rawValue === '.' ? '0.' : event.target.rawValue;
          updateHeld(value)
        }}/>
      </div>
      <div className="Coin-meta symbol">=</div>
      <div className="Coin-meta Coin-value">
        {quantityHeld ? `${(quantityHeld * price).toLocaleString({}, {style: 'currency', currency: 'USD'})}` :
          <span className="Coin-quantity-null">-</span>}
      </div>
      <div className={`Coin-meta Coin-change ${change > 0 ? 'positive' : ''} ${change < 0 ? 'negative' : ''}`}>
        <div className="Coin-change-percent">{change}<span>%</span></div>
        <div className="Coin-change-price">{!quantityHeld ? null : (change/100 * quantityHeld * price).toLocaleString({}, {style: 'currency', currency: 'USD'})}</div>
      </div>
    </div>
  }
}

export default Coin