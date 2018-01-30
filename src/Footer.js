import React, { Component } from 'react'
import './Footer.css'

const donationData = {
  BTC: {
    name: 'Bitcoin',
    address: '133NzbWr7hJwUyW3LGEqyv9bJEyekbP5uy',
  },
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
            <a onClick={() => this.setState({shownDonationCoin: 'BTC'})}>
              <svg viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="16"/>
                <path fill="#FFF" d="M23.1889526,14.0201846 C23.5025526,11.9239385 21.9064911,10.7970462 19.7240911,10.0452923 L20.4320295,7.20566154 L18.7035372,6.77489231 L18.0143065,9.53969231 C17.5599065,9.42646154 17.0931988,9.31963077 16.6294449,9.21378462 L17.3235988,6.43076923 L15.5960911,6 L14.8876603,8.83864615 C14.5115372,8.75298462 14.1423065,8.66830769 13.7839065,8.5792 L13.7858757,8.57033846 L11.4021218,7.97513846 L10.9423065,9.82129231 C10.9423065,9.82129231 12.224768,10.1152 12.1976911,10.1334154 C12.8977526,10.3081846 13.0242757,10.7714462 13.0031065,11.1387077 L12.1967065,14.3736615 C12.2449526,14.3859692 12.3074757,14.4036923 12.3763988,14.4312615 C12.3187988,14.4169846 12.2572603,14.4012308 12.1937526,14.3859692 L11.0634142,18.9176615 C10.9777526,19.1303385 10.7606449,19.4493538 10.2712911,19.3282462 C10.2885218,19.3533538 9.01492185,19.0146462 9.01492185,19.0146462 L8.15682954,20.9932308 L10.4061834,21.5539692 C10.8246449,21.6588308 11.2347372,21.7686154 11.6384295,21.872 L10.9231065,24.7441231 L12.6496295,25.1748923 L13.3580603,22.3332923 C13.8296911,22.4612923 14.2875372,22.5794462 14.7355372,22.6907077 L14.029568,25.5190154 L15.7580603,25.9497846 L16.4733834,23.0830769 C19.4208295,23.6408615 21.6371988,23.4158769 22.5701218,20.7500308 C23.3218757,18.6035692 22.5327065,17.3654154 20.9819372,16.5580308 C22.1112911,16.2976 22.9619988,15.5547077 23.1889526,14.0201846 L23.1889526,14.0201846 Z M19.2396603,19.5581538 C18.7055065,21.7046154 15.0914757,20.5442462 13.9197834,20.2532923 L14.8689526,16.4482462 C16.0406449,16.7406769 19.7979372,17.3196308 19.2396603,19.5581538 Z M19.7743065,13.9891692 C19.2869218,15.9416615 16.2789218,14.9496615 15.303168,14.7064615 L16.1637218,11.2553846 C17.1394757,11.4985846 20.2818757,11.9524923 19.7743065,13.9891692 Z"/>
              </svg>
            </a>
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