const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const API_ID = 'APP20260614112550LIDZXM';
const requestId = 'IA20260808193206941574';

async function run() {
  const url = `https://uatapi.cleanverse.com/api/cooperate/atoken/query_apply_status/${requestId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api-id': API_ID,
        'X-Request-ID': crypto.randomUUID()
      }
    });

    const json = await response.json();
    console.log('Query Apply Status Response:', JSON.stringify(json, null, 2));
  } catch (error) {
    console.error('Query failed:', error);
  }
}

run();
