const StockAPIKey = process.env.STOCK_API_KEY

module.exports = {
  getAlphaVantageURL: function (symbol) {
    symbol = encodeURIComponent(symbol)
    return `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=1min&apikey=${StockAPIKey}`
  },
  getAlphaVantageDailyURL: function (symbol) {
    symbol = encodeURIComponent(symbol)
    return `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&interval=1min&apikey=${StockAPIKey}`
  },
  getIEXURL: function (symbol) {
    symbol = encodeURIComponent(symbol)
    return `https://api.iextrading.com/1.0/tops?symbols=${symbol}`
  },
  defaultStocks: [
    'AAPL',
    'GOOG',
    'MSFT',
    'AMZN',
    'BRK.A',
    'BABA',
    'TCEHY',
    'FB',
    'XOM',
    'JNJ',
    'JPM',
    'BAC',
    'WMT',
    'WFC',
    'RDS.A',
    'V',
    'PG',
    'BUD',
    'T',
    'CVX',
  ],
  //TODO retrieve this metadata from an API. Currently, however, there doesn't seem to be a free API with this info.
  defaultStockMetadata: {
    AAPL: {
      shares: 5183590000,
      name: 'Apple'
    },
    GOOG: {
      shares: 349480000,
      name: 'Google'
    },
    MSFT: {
      shares: 7710000000,
      name: 'Microsoft'
    },
    AMZN: {
      shares: 481870000,
      name: 'Amazon'
    },
    'BRK.A': {
      shares: 753528,
      name: 'Berkshire Hathaway'
    },
    BABA: {
      shares: 2530000000,
      name: 'Alibaba'
    },
    TCEHY: {
      shares: 9500000000,
      name: 'Tencent'
    },
    FB: {
      shares: 2380000000,
      name: 'Facebook'
    },
    XOM: {
      shares: 4240000000,
      name: 'ExxonMobil'
    },
    JNJ: {
      shares: 2690000000,
      name: 'Johnson & Johnson'
    },
    JPM: {
      shares: 3430000000,
      name: 'JPMorgan Chase'
    },
    BAC: {
      shares: 10200000000,
      name: 'Bank of America'
    },
    WMT: {
      shares: 2960000000,
      name: 'Walmart'
    },
    WFC: {
      shares: 4890000000,
      name: 'Wells Fargo'
    },
    'RDS.A': {
      shares: 4520000000,
      name: 'Shell'
    },
    V: {
      shares: 1820000000,
      name: 'Visa'
    },
    PG: {
      shares: 2550000000,
      name: 'Procter & Gamble'
    },
    BUD: {
      shares: 1610000000,
      name: 'AB InBev'
    },
    T: {
      shares: 6140000000,
      name: 'AT&T'
    },
    CVX: {
      shares: 1900000000,
      name: 'Chevron'
    },
  }
}