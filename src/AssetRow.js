import React, {Component} from 'react';
import coinLogos from './images/coinLogos';
import stockLogos from './images/stockLogos';
import defaultLogo from './images/defaultCoinLogo.svg';
import Cleave from 'cleave.js/react';
import './AssetRow.css'

const localeOpts = {
  style: 'currency',
  currency: 'USD'
};

class Coin extends Component {
  render() {
    let {symbol, name, price, quantityHeld, updateHeld, change, tab, rank, marketCap, isStock} = this.props;

    const logos = isStock ? stockLogos : coinLogos;

    price = parseFloat(price);

    return <div className="AssetRow">
      {tab === 'marketcap' ? <div className="AssetRow-meta AssetRow-rank">{rank}</div> : null}
      <img className="AssetRow-meta AssetRow-logo" src={logos[symbol] ? logos[symbol] : defaultLogo} alt="coin logo"/>
      <div className="AssetRow-meta AssetRow-label">
        <div className={"AssetRow-symbol"}>{symbol}</div>
        <div className={"AssetRow-name"}>{name}</div>
      </div>
      <div className="AssetRow-calculation">
        <div className="AssetRow-factors">
          <div className="AssetRow-meta AssetRow-price">{price.toLocaleString({}, localeOpts)}</div>
          {tab === 'portfolio' ? <div className="AssetRow-meta symbol">×</div> : null}
          {tab === 'portfolio' ? <div className="AssetRow-meta AssetRow-quantity">
            <Cleave placeholder="-" value={quantityHeld} options={{
              numeral: true,
              numeralThousandsGroupStyle: 'thousand',
              numeralDecimalScale: 50
            }} onChange={event => {
              const value = event.target.rawValue === '.' ? '0.' : event.target.rawValue;
              updateHeld(value)
            }}/>
          </div> : null}
          {tab === 'portfolio' ? <div className="AssetRow-meta symbol">=</div> : null}
        </div>
        {quantityHeld ? <div className="AssetRow-product">
          {tab === 'portfolio' ? <div className="AssetRow-meta AssetRow-value">
            {quantityHeld ? `${(quantityHeld * price).toLocaleString({}, localeOpts)}` :
              <span className="AssetRow-quantity-null">-</span>}
          </div> : null}
        </div> : null}
      </div>
      {tab === 'marketcap' ?
        <div className="AssetRow-meta AssetRow-marketcap">${parseInt(marketCap, 10).toLocaleString()}</div> : null}
      <div className={`AssetRow-meta AssetRow-change ${change > 0 ? 'positive' : ''} ${change < 0 ? 'negative' : ''}`}>
        <div className="AssetRow-change-percent">{change ? parseFloat(change).toFixed(2) : '-'}<span>%</span></div>
        {tab === 'portfolio' ?
          <div className="AssetRow-change-price">{!quantityHeld ? null : (change / 100 * quantityHeld * price).toLocaleString({}, localeOpts)}</div> : null}
      </div>
    </div>
  }
}

export default Coin