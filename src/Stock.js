import React, {Component} from 'react';
import logos from './images/stockLogos';
import defaultLogo from './images/defaultCoinLogo.svg';
import Cleave from 'cleave.js/react';
import './Stock.css'

class Stock extends Component {
  render() {
    let {symbol, name, price, quantityHeld, updateHeld, change} = this.props;

    price = parseFloat(price);

    return <div className="Stock">
      <img className="Stock-meta Stock-logo" src={logos[symbol] ? logos[symbol] : defaultLogo} alt="coin logo"/>
      <div className="Stock-meta Stock-label">
        <div className={"Stock-symbol"}>{symbol}</div>
        <div className={"Stock-name"}>{name}</div>
      </div>
      <div className="Stock-meta Stock-price">{price.toLocaleString({}, {
        style: 'currency',
        currency: 'USD'
      })}</div>
      <div className="Stock-meta symbol">×</div>
      <div className="Stock-meta Stock-quantity">
        <Cleave placeholder="-" value={quantityHeld} options={{
          numeral: true,
          numeralThousandsGroupStyle: 'thousand',
          numeralDecimalScale: 50
        }} onChange={event => {
          const value = event.target.rawValue === '.' ? '0.' : event.target.rawValue;
          updateHeld(value)
        }}/>
      </div>
      <div className="Stock-meta symbol">=</div>
      <div className="Stock-meta Stock-value">
        {quantityHeld ? `${(quantityHeld * price).toLocaleString({}, {style: 'currency', currency: 'USD'})}` :
          <span className="Stock-quantity-null">-</span>}
      </div>
      <div className={`Stock-meta Stock-change ${change > 0 ? 'positive' : ''} ${change < 0 ? 'negative' : ''}`}>
        <div className="Stock-change-percent">{change.toFixed(2)}<span>%</span></div>
        <div className="Stock-change-price">{!quantityHeld ? null : (change/100 * quantityHeld * price).toLocaleString({}, {style: 'currency', currency: 'USD'})}</div>
      </div>
    </div>
  }
}

export default Stock