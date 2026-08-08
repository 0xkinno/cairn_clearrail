const API_ID = 'APP20260614112550LIDZXM';

async function run() {
  const url = 'https://uatapi.cleanverse.com/api/cooperate/query_apass';
  const payload = {
    chain: 'arbitrum',
    address: '0x44be5240559880f39ba5604D33486Da4d8A48527'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-id': API_ID,
        'X-Request-ID': crypto.randomUUID()
      },
      body: JSON.stringify(payload)
    });
    const json = await response.json();
    console.log('Query A-Pass Result:', json);
  } catch (error) {
    console.error('Error querying A-Pass:', error);
  }
}

run();
