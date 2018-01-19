module.exports = {
  apps: [
    {
      name: 'API',
      script: 'api/api.js',
      watch: true,
    }, {
      name: 'Stock Worker',
      script: 'api/stock-worker.js',
      watch: true,
    }, {
      name: 'Crypto Worker',
      script: 'api/crypto-worker.js',
      watch: true,
    }
  ],
}
