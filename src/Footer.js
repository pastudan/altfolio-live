import React, { Component } from 'react'
import './Footer.css'

const donationData = {
  ETH: {
    name: 'Ethereum',
    address: '0x49452d76e969183693219c20fe026Fbc3747E003',
  },
  NANO: {
    name: 'Nano',
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
            <a onClick={() => this.setState({shownDonationCoin: 'NANO'})}>
              <svg width="32px" height="32px" viewBox="0 0 32 32" version="1.1">
                <g id="Page-1" stroke="none" strokeWidth="1" fill="none">
                  <g id="color">
                    <g id="nano">
                      <circle id="Oval" fill="#4A90E2" cx="16" cy="16" r="16" />
                      <path d="M24.9497751,11 C24.0922039,11 23.3665667,11.6926537 23.3665667,12.5832084 C23.3665667,13.8365817 23.1686657,14.1664168 21.7833583,14.1664168 L21.6514243,14.1664168 C20.8598201,14.2323838 20.2331334,14.892054 20.2331334,15.7166417 L20.2331334,15.7496252 C20.2331334,16.970015 20.0022489,17.2668666 18.649925,17.2668666 C18.583958,17.2668666 18.517991,17.2668666 18.4850075,17.2998501 C17.6934033,17.3988006 17.0667166,18.0584708 17.0667166,18.850075 C17.0667166,19.7076462 17.7593703,20.4332834 18.649925,20.4332834 C19.4745127,20.4332834 20.1671664,19.7736132 20.2001499,18.982009 L20.2001499,18.850075 C20.2001499,17.7286357 20.5629685,17.2998501 21.7503748,17.2668666 L21.7833583,17.2668666 C22.607946,17.2668666 23.3005997,16.6071964 23.3335832,15.7826087 L23.3335832,15.6836582 C23.3335832,14.5292354 23.6964018,14.1004498 24.9167916,14.1004498 C25.7743628,14.1004498 26.5,13.4077961 26.5,12.5172414 C26.5,11.6926537 25.8073463,11 24.9497751,11 L24.9497751,11 Z M15.6484258,14.1664168 L15.6484258,14.1664168 C16.44003,14.2323838 17.0667166,14.892054 17.0997001,15.6836582 C17.0997001,16.5742129 16.4070465,17.2668666 15.5164918,17.2668666 C14.625937,17.2668666 13.9332834,16.5412294 13.9332834,15.6836582 C13.9332834,14.5622189 13.5704648,14.1334333 12.350075,14.1334333 C11.1296852,14.1334333 10.7668666,14.5622189 10.7668666,15.7166417 L10.7668666,15.8155922 C10.7338831,16.6071964 10.0412294,17.2668666 9.21664168,17.2668666 C8.32608696,17.2668666 7.63343328,16.5412294 7.63343328,15.6836582 C7.63343328,14.8590705 8.26011994,14.1994003 9.05172414,14.1334333 L9.18365817,14.1334333 C10.5689655,14.1334333 10.7668666,13.8365817 10.7668666,12.5832084 C10.7668666,11.6926537 11.4925037,11 12.350075,11 C13.2406297,11 13.9332834,11.7256372 13.9332834,12.5832084 C13.9332834,13.8365817 14.1311844,14.1664168 15.5164918,14.1664168 L15.6484258,14.1664168 Z M6.0832084,20.4332834 C5.20882654,20.4332834 4.5,19.7244568 4.5,18.850075 C4.5,17.9756931 5.20882654,17.2668666 6.0832084,17.2668666 C6.95759025,17.2668666 7.66641679,17.9756931 7.66641679,18.850075 C7.66641679,19.7244568 6.95759025,20.4332834 6.0832084,20.4332834 Z" id="Shape" fill="#FFFFFF" />
                    </g>
                  </g>
                </g>
              </svg>
            </a>
            <a onClick={() => this.setState({shownDonationCoin: 'ETH'})}>
              <svg width="32" height="32" viewBox="0 0 32 32">
                <g fill="none">
                  <circle cx="16" cy="16" r="16" fill="#627EEA"/>
                  <g fill="#FFF" transform="translate(9 4)">
                    <polygon fillOpacity=".602" points="7.498 0 7.498 8.87 14.995 12.22"/>
                    <polygon points="7.498 0 0 12.22 7.498 8.87"/>
                    <polygon fillOpacity=".602" points="7.498 17.968 7.498 23.995 15 13.616"/>
                    <polygon points="7.498 23.995 7.498 17.967 0 13.616"/>
                    <polygon fillOpacity=".2" points="7.498 16.573 14.995 12.22 7.498 8.872"/>
                    <polygon fillOpacity=".602" points="0 12.22 7.498 16.573 7.498 8.872"/>
                  </g>
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