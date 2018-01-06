import React from 'react';
import './BigNumber.css'

const BigNumber = function ({amount, isPercent = false}) {
  return <div className="App-BigNumber">
    <span className="App-BigNumber-super">
      {isPercent ? null : '$'}
    </span>
    <span>{Math.floor(amount).toLocaleString()}</span>
    <span className="App-BigNumber-super">
      .{amount.toFixed(2).split('.')[1]}{isPercent ? "%" : null}
    </span>
  </div>
};

export default BigNumber;