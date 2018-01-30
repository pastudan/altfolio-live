import React from 'react'

function RadioGroup ({tab, portfolioClick, marketCapClick}) {
  return <div className="radio-group">
    <div className={`radio-group-option ${tab === 'portfolio' ? 'selected' : ''}`} onClick={portfolioClick}>
      portfolio
    </div>
    <div className={`radio-group-option ${tab === 'marketcap' ? 'selected' : ''}`} onClick={marketCapClick}>
      market cap
    </div>
  </div>
}

export default RadioGroup
