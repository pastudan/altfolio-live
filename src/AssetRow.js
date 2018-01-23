import React, { Component } from 'react'
import coinLogos from './images/coinLogos'
import stockLogos from './images/stockLogos'
import defaultLogo from './images/defaultCoinLogo.svg'
import Cleave from 'cleave.js/react'
import './AssetRow.css'

import Odometer from 'react-odometerjs'
import 'odometer/themes/odometer-theme-minimal.css'
import './AssetRow-odometer-hack.css'

const localeOpts = {
  style: 'currency',
  currency: 'USD'
}

const marketCapLocaleOpts = Object.assign({
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}, localeOpts)

// Mobile detection for using input[type=number] only on mobile browsers since it breaks Cleave
// From https://stackoverflow.com/a/14301832
const isMobile = typeof window.orientation !== 'undefined'

class AssetRow extends Component {
  state = {
    movement: 'neutral'
  }

  componentWillReceiveProps = (newProps) => {
    const priceDelta = parseFloat(newProps.price) - parseFloat(this.props.price)
    let movement = this.state.movement
    if (priceDelta > 0) {
      movement = 'up'
    } else if (priceDelta < 0) {
      movement = 'down'
    }

    this.setState({movement})
    setTimeout(() => {
      this.setState({movement: 'neutral'})
    }, 1500)
  }

  quantityUpdate = event => {
    let value = event.target.rawValue || event.target.value
    if (value === '.') {
      value = '0.'
    }

    this.props.updateHeld(value)
    setTimeout(() => {
      const headerHeight = 50

      // don't scroll to element if it's within bounds
      const rect = this.assetRow.getBoundingClientRect()
      if (rect.top > headerHeight && rect.bottom <= window.innerHeight) {
        return
      }

      window.scrollTo(0, rect.top + window.scrollY + headerHeight - window.innerHeight / 2)
    }, 0)
  }

  render () {
    let {symbol, name, price, quantityHeld, change, tab, rank, marketCap, isStock} = this.props

    const logos = isStock ? stockLogos : coinLogos

    price = parseFloat(price)

    return <div ref={ref => this.assetRow = ref} className={`AssetRow ${tab === 'portfolio' ? 'AssetRow-tab-portfolio' : 'AssetRow-tab-marketcap'} ${this.state.movement === 'up' ? 'price-move-up' : ''} ${this.state.movement === 'down' ? 'price-move-down' : ''}`}>
      {tab === 'marketcap' ? <div className="AssetRow-meta AssetRow-rank">
        {rank}
      </div> : null}
      <img className="AssetRow-meta AssetRow-logo" src={logos[symbol] ? logos[symbol] : defaultLogo} alt="logo"/>
      <div className="AssetRow-meta AssetRow-label">
        <div className={'AssetRow-symbol'}>{symbol}</div>
        <div className={'AssetRow-name'}>{name}</div>
      </div>
      <div className="AssetRow-meta AssetRow-change AssetRow-xs-optional">
        <div className={`AssetRow-change-percent ${change > 0 ? 'positive' : ''} ${change < 0 ? 'negative' : ''}`}>
          {change !== null && typeof change !== 'undefined' ? <span>{parseFloat(change).toFixed(2)}%</span> : '-'}
        </div>
        {tab === 'portfolio' ? <div className="AssetRow-change-price">
          {!quantityHeld || change === null || typeof change === 'undefined' ? null : (change / 100 * quantityHeld * price).toLocaleString({}, localeOpts)}
        </div> : null}
      </div>
      <div className={`AssetRow-meta AssetRow-calculation AssetRow-price `}>
        {isMobile ? price.toLocaleString({}, localeOpts) : <span>
          {/* We add 0.001 here as an hack to the Odometer library in order to render insignificant digits. The last digit is hidden in CSS*/}
          $<Odometer value={price + 0.001} duration={400} theme="minimal" format="(,ddd).ddd"/>
          </span>
        }
      </div>
      {tab === 'portfolio' ? <div className="AssetRow-meta AssetRow-calculation symbol">×</div> : null}
      {tab === 'portfolio' ? <div className="AssetRow-meta AssetRow-calculation AssetRow-quantity">
        {isMobile ? <input type="number" step="0.01" value={quantityHeld} onChange={this.quantityUpdate}/> :
          <Cleave placeholder="-" value={quantityHeld} options={{
            numeral: true,
            numeralThousandsGroupStyle: 'thousand',
            numeralDecimalScale: 50
          }} onChange={this.quantityUpdate}/>}
      </div> : null}
      {tab === 'portfolio' ? <div className="AssetRow-meta AssetRow-calculation symbol AssetRow-equals">=</div> : null}
      {tab === 'portfolio' ? <div className="AssetRow-meta AssetRow-calculation AssetRow-value">
        {quantityHeld ? `${(quantityHeld * price).toLocaleString({}, localeOpts)}` :
          <span className="AssetRow-quantity-null">-</span>}
      </div> : null}
      {tab === 'marketcap' ? <div className="AssetRow-meta AssetRow-calculation AssetRow-marketcap">
        {marketCap ? <span>{(parseInt(marketCap, 10) / 1000 / 1000).toLocaleString({}, marketCapLocaleOpts)}M</span> :
          '-'}
      </div> : null}
    </div>
  }
}

export default AssetRow