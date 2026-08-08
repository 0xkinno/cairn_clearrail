const crypto = require('crypto');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const API_ID = 'APP20260614112550LIDZXM';
const API_KEY_BASE64 = 'qhfPE24VqLv7wTK7AXMkD4p2i7zKnerg84AtT0IGto0=';
const KEY = Buffer.from(API_KEY_BASE64, 'base64');
const IV = Buffer.alloc(16, 0);

function encrypt(text) {
  const cipher = crypto.createCipheriv('aes-256-cbc', KEY, IV);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

async function tryGenerate(chain) {
  const payload = {
    customerId: "CUST" + crypto.randomBytes(6).toString('hex').toUpperCase(),
    expirationTime: Math.floor(Date.now() / 1000) + 365 * 24 * 3600,
    wallet: {
      address: "0x44be5240559880f39ba5604D33486Da4d8A48527",
      chain: chain
    },
    override: true
  };

  const encryptedBody = encrypt(JSON.stringify(payload));
  const url = 'https://uatapi.cleanverse.com/api/cooperate/generate_apass';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-id': API_ID,
        'X-Request-ID': crypto.randomUUID()
      },
      body: JSON.stringify({ data: encryptedBody }),
      signal: AbortSignal.timeout(10000)
    });

    const json = await response.json();
    console.log(`Chain: ${chain} -> Status: ${json.code}, Message: ${json.message}`);
  } catch (error) {
    console.error(`Chain: ${chain} -> Failed:`, error.message);
  }
}

async function run() {
  const chains = ['solana', 'base', 'avalanche', 'arbitrum', 'ethereum', 'polygon', 'bsc', 'monad', 'hashkey', 'platon'];
  for (const chain of chains) {
    await tryGenerate(chain);
  }
}

run();
