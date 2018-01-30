import React, { Component } from 'react'
import './Footer.css'

const donationData = {
  ETH: {
    name: 'Ethereum',
    address: '0x49452d76e969183693219c20fe026Fbc3747E003',
  },
  XRB: {
    name: 'RaiBlocks',
    address: 'xrb_3n9zhn4disxceixnsr4q74sio5b9qdgzq6oddb9og6cn6x876qmhy8t9i51m',
  },
}

class Footer extends Component {
  state = {
    shownDonationCoin: null
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.shownDonationCoin === this.state.shownDonationCoin) {
      return;
    }

    window.scrollTo(0, document.body.scrollHeight);
  }

  render () {
    return <div>
      {this.state.shownDonationCoin !== null ? <div className="Footer-donate-address">
        <h1>Thank you!</h1>
        <h2>{donationData[this.state.shownDonationCoin].name} ({this.state.shownDonationCoin}) Donation Address:</h2>
        <p>{donationData[this.state.shownDonationCoin].address}</p>
      </div> : null}
      <div className="Footer">
        <div className="Footer-left">
          <div className="Footer-top-line Footer-optional">Made with ❤ in San Francisco</div>
          <div className="Footer-attribution">
            <span>Designed by </span>
            <a href="https://github.com/pastudan">Dan Pastusek</a>
          </div>
        </div>
        <div className="Footer-center">
          <div className="Footer-donate">Donate</div>
          <div className="Footer-donate-icons">
            <a onClick={() => this.setState({shownDonationCoin: 'ETH'})}>
              <svg width="32" height="32" viewBox="0 0 32 32">
                <g fill="none" fill-rule="evenodd">
                  <circle cx="16" cy="16" r="16" fill="#627EEA"/>
                  <g fill="#FFF" fill-rule="nonzero" transform="translate(9 4)">
                    <polygon fill-opacity=".602" points="7.498 0 7.498 8.87 14.995 12.22"/>
                    <polygon points="7.498 0 0 12.22 7.498 8.87"/>
                    <polygon fill-opacity=".602" points="7.498 17.968 7.498 23.995 15 13.616"/>
                    <polygon points="7.498 23.995 7.498 17.967 0 13.616"/>
                    <polygon fill-opacity=".2" points="7.498 16.573 14.995 12.22 7.498 8.872"/>
                    <polygon fill-opacity=".602" points="0 12.22 7.498 16.573 7.498 8.872"/>
                  </g>
                </g>
              </svg>
            </a>
            <a onClick={() => this.setState({shownDonationCoin: 'XRB'})}>
              <svg width="32" height="32" viewBox="0 0 32 32">
                <g fill="none" fill-rule="evenodd">
                  <circle cx="16" cy="16" r="16" fill="#49B749" fill-rule="nonzero"/>
                  <path fill="#FFF" d="M7.5,11.0724638 L16,6 L24.5,11.0724638 L24.5,20.9275362 L16,26 L7.5,20.9275362 L7.5,11.0724638 Z M13.154661,14.3333333 L13.154661,17.6304348 L16,19.2246377 L18.845339,17.6304348 L18.845339,14.3333333 L16,12.7391304 L13.154661,14.3333333 Z"/>
                </g>
              </svg>
            </a>
            <a href="https://github.com/pastudan/altfolio-live" title="Contribute on Github">
              <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path d="M512 0C229.25 0 0 229.25 0 512c0 226.25 146.688 418.125 350.156 485.812 25.594 4.688 34.938-11.125 34.938-24.625 0-12.188-0.469-52.562-0.719-95.312C242 908.812 211.906 817.5 211.906 817.5c-23.312-59.125-56.844-74.875-56.844-74.875-46.531-31.75 3.53-31.125 3.53-31.125 51.406 3.562 78.47 52.75 78.47 52.75 45.688 78.25 119.875 55.625 149 42.5 4.654-33 17.904-55.625 32.5-68.375C304.906 725.438 185.344 681.5 185.344 485.312c0-55.938 19.969-101.562 52.656-137.406-5.219-13-22.844-65.094 5.062-135.562 0 0 42.938-13.75 140.812 52.5 40.812-11.406 84.594-17.031 128.125-17.219 43.5 0.188 87.312 5.875 128.188 17.281 97.688-66.312 140.688-52.5 140.688-52.5 28 70.531 10.375 122.562 5.125 135.5 32.812 35.844 52.625 81.469 52.625 137.406 0 196.688-119.75 240-233.812 252.688 18.438 15.875 34.75 47 34.75 94.75 0 68.438-0.688 123.625-0.688 140.5 0 13.625 9.312 29.562 35.25 24.562C877.438 930 1024 738.125 1024 512 1024 229.25 794.75 0 512 0z"/>
              </svg>
            </a>
          </div>
        </div>
        <div className="Footer-right">
          <div className="Footer-top-line Footer-attribution">
            <span>Icons by </span>
            <a href="https://github.com/cjdowner/cryptocurrency-icons">Christopher Downer</a>
          </div>
          <div className="Footer-optional">
            <span>Data from </span>
            <a href="https://coinmarketcap.com">CoinMarketCap</a>
            <span>, </span>
            <a href="https://www.alphavantage.co">AlphaVantage</a>
            <span>, </span>
            <a href="https://iextrading.com/">IEX</a>
          </div>
        </div>
      </div>
    </div>
  }
}

export default Footer