const crypto = require('crypto');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

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

async function run() {
  // Let's test encryption and decryption first
  const testObj = { test: "hello world" };
  const encrypted = encrypt(JSON.stringify(testObj));
  console.log('Encrypted:', encrypted);
  const decrypted = decrypt(encrypted);
  console.log('Decrypted:', decrypted);

  // Now, let's call generate_apass for our wallet address
  // Wallet address: 0x44be5240559880f39ba5604D33486Da4d8A48527
  // Chain: arbitrum
  const payload = {
    customerId: "CUST44BE5240559880F3", // unique, at least 12 chars, alphanumeric
    expirationTime: Math.floor(Date.now() / 1000) + 365 * 24 * 3600, // 1 year expiry
    wallet: {
      address: "0x44be5240559880f39ba5604D33486Da4d8A48527",
      chain: "arbitrum"
    },
    identityDataList: [
      {
        idType: "PASSPORT",
        fullName: "ClearRail Owner",
        idNumber: "P12345678",
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
      })
    });

    const json = await response.json();
    console.log('Response JSON:', json);
    if (json.data && typeof json.data === 'string' && json.data !== '{}') {
      try {
        const decryptedResponse = decrypt(json.data);
        console.log('Decrypted Data:', JSON.parse(decryptedResponse));
      } catch (e) {
        console.log('Could not decrypt data (perhaps it is not encrypted or format is different):', e.message);
      }
    } else {
      console.log('Response Data:', json.data);
    }
  } catch (error) {
    console.error('API Error:', error);
  }
}

run();
