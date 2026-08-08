const crypto = require('crypto');

const API_ID = 'APP20260614112550LIDZXM';
const API_KEY_BASE64 = 'qhfPE24VqLv7wTK7AXMkD4p2i7zKnerg84AtT0IGto0=';
const KEY = Buffer.from(API_KEY_BASE64, 'base64');
const IV = Buffer.alloc(16, 0); // 16 bytes of 0

function encrypt(text) {
  const cipher = crypto.createCipheriv('aes-256-cbc', KEY, IV);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function decrypt(ciphertextBase64) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, IV);
  let decrypted = decipher.update(ciphertextBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function testGenerateAPass(chain) {
  const payload = {
    customerId: "CUST" + crypto.randomBytes(6).toString('hex').toUpperCase(),
    expirationTime: Math.floor(Date.now() / 1000) + 365 * 24 * 3600,
    wallet: {
      address: "0x44be5240559880f39ba5604D33486Da4d8A48527",
      chain: chain
    },
    identityDataList: [
      {
        idType: "PASSPORT",
        fullName: "ClearRail Owner",
        idNumber: "P" + crypto.randomBytes(4).toString('hex').toUpperCase(),
        validUntil: "2030-12-31",
        issuingCountryISO2: "US"
      }
    ],
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
      body: JSON.stringify({
        data: encryptedBody
      }),
      signal: AbortSignal.timeout(15000) // 15s timeout
    });

    const json = await response.json();
    console.log(`Chain: ${chain} -> Status: ${json.code}, Message: ${json.message}`);
    if (json.data && typeof json.data === 'string' && json.data !== '{}') {
      try {
        const decryptedResponse = decrypt(json.data);
        console.log(`Decrypted for ${chain}:`, JSON.parse(decryptedResponse));
      } catch (e) {
        console.log(`Could not decrypt for ${chain}:`, e.message);
      }
    }
  } catch (error) {
    console.error(`Error for ${chain}:`, error);
  }
}

async function run() {
  // Let's test on base first, then arbitrum
  console.log('Testing generate_apass on base...');
  await testGenerateAPass('base');
  console.log('Testing generate_apass on arbitrum...');
  await testGenerateAPass('arbitrum');
}

run();
