import React from 'react';
import './Footer.css';

export default function Footer() {
  return <div className="Footer">
    <div className="Footer-left">
      <div className="Footer-top-line">Made with ❤ in San Francisco</div>
      <div>Designed by <a href="https://github.com/pastudan">Dan Pastusek</a></div>
    </div>
    <div className="Footer-right">
      <div className="Footer-top-line">Icons by <a href="https://github.com/cjdowner/cryptocurrency-icons">Christopher
        Downer</a></div>
      <div>Data from <a href="https://coinmarketcap.com">CoinMarketCap</a> &amp; <a href="https://www.alphavantage.co">Alpha
        Vantage</a></div>
    </div>
  </div>
}