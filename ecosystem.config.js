module.exports = {
  apps: [
    {
      name: 'API',
      script: 'api/api.js',
      max_restarts: 10,
      min_uptime: 5000,
    }, {
      name: 'Stock Worker',
      script: 'api/stock-worker.js',
      max_restarts: 10,
      min_uptime: 5000,
    }, {
      name: 'Crypto Worker',
      script: 'api/crypto-worker.js',
      max_restarts: 10,
      min_uptime: 5000,
    }
  ],
}
