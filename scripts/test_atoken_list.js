// Native fetch is available in Node 24

async function checkChain(chain) {
  const url = 'https://uatapi.cleanverse.com/api/cooperate/query_deposit_atoken_list';
  const apiId = 'APP20260614112550LIDZXM';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-id': apiId,
        'X-Request-ID': '550e8400-e29b-41d4-a716-446655440009'
      },
      body: JSON.stringify({ chain })
    });
    const json = await response.json();
    console.log(`Chain: ${chain} -> Status: ${json.code}, Message: ${json.message}, Tokens Count: ${json.data?.tokens ? json.data.tokens.length : 0}`);
    if (json.data?.tokens) {
      console.log(JSON.stringify(json.data.tokens, null, 2));
    }
  } catch (error) {
    console.error(`Error for ${chain}:`, error);
  }
}

async function run() {
  const chains = ['solana', 'base', 'avalanche', 'arbitrum', 'ethereum', 'polygon', 'bsc', 'monad', 'hashkey', 'platon'];
  for (const chain of chains) {
    await checkChain(chain);
  }
}

run();
