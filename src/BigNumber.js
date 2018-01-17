import React from 'react'
import './BigNumber.css'

const BigNumber = function ({amount, label, isPercent = false, isChange = false}) {
  let extraClass = ''
  if (isChange && amount > 0) {
    extraClass = 'positive'
  } else if (isChange && amount < 0) {
    extraClass = 'negative'
  }

  return <div className={`BigNumber ${extraClass}`}>
    <span className="BigNumber-super">
      {amount < 0 ? '-' : null}
      {isPercent ? null : '$'}
    </span>
    <span>{Math.floor(Math.abs(amount)).toLocaleString()}</span>
    <span className="BigNumber-super">
      .{amount.toFixed(2).split('.')[1]}{isPercent ? "%" : null}
    </span>
    <div className="BigNumber-label">
      {label}
    </div>
  </div>
}

export default BigNumber