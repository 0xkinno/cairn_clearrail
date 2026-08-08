const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const API_ID = 'APP20260614112550LIDZXM';

async function checkChain(chain) {
  const url = 'https://uatapi.cleanverse.com/api/cooperate/query_deposit_atoken_list';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-id': API_ID,
        'X-Request-ID': 'test-' + Date.now()
      },
      body: JSON.stringify({ chain })
    });
    const json = await response.json();
    console.log(`Chain: ${chain} -> Code: ${json.code}, Message: ${json.message}, Data:`, json.data);
  } catch (e) {
    console.error(`Error for ${chain}:`, e.message);
  }
}

async function run() {
  const slugs = ['arbitrum-sepolia', 'arbitrum_sepolia', 'arbitrumsepolia', 'sepolia', 'arbitrum', 'base'];
  for (const slug of slugs) {
    await checkChain(slug);
  }
}

run();
