module.exports = {
  apps: [
    {
      name: 'API',
      script: 'api/api.js',
      max_restarts: 10,
      min_uptime: 5000,
      log_date_format: 'YYYY-MM-DD HH:mm Z'

    }, {
      name: 'Stock Worker',
      script: 'api/stock-worker.js',
      max_restarts: 10,
      min_uptime: 5000,
      log_date_format: 'YYYY-MM-DD HH:mm Z'

    }, {
      name: 'Crypto Worker',
      script: 'api/crypto-worker.js',
      max_restarts: 10,
      min_uptime: 5000,
      log_date_format: 'YYYY-MM-DD HH:mm Z'

    }
  ],
}
