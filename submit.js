const https = require('https');
const options = {
  hostname: 'api.github.com',
  port: 443,
  path: '/repos/test/test/pulls',
  method: 'POST',
  headers: {
    'User-Agent': 'node.js'
  }
};
// Use actual submit tool from environment
