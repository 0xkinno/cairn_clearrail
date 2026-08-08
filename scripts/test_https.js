const https = require('https');
const dns = require('dns');

// Force IPv4 lookup for dns resolution in Node.js
dns.setDefaultResultOrder('ipv4first');

const API_ID = 'APP20260614112550LIDZXM';

async function postRequest(path, payload) {
  const url = `https://uatapi.cleanverse.com${path}`;
  const data = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-id': API_ID,
        'X-Request-ID': 'test-' + Date.now()
      },
      timeout: 10000
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Connection timed out'));
    });

    req.write(data);
    req.end();
  });
}

async function run() {
  try {
    console.log('Sending query_deposit_atoken_list...');
    const res = await postRequest('/api/cooperate/query_deposit_atoken_list', { chain: 'arbitrum' });
    console.log('Status:', res.status);
    console.log('Body:', res.body);
  } catch (error) {
    console.error('Request failed:', error);
  }
}

run();
