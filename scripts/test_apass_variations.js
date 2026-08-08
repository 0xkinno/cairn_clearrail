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

function decrypt(ciphertextBase64) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, IV);
  let decrypted = decipher.update(ciphertextBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function tryGenerate(label, payload) {
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
    console.log(`[${label}] Status: ${json.code}, Message: ${json.message}`);
    if (json.data) {
      console.log(`[${label}] Data:`, JSON.stringify(json.data, null, 2));
    }
  } catch (error) {
    console.error(`[${label}] Failed:`, error.message);
  }
}

async function run() {
  const address = "0x44be5240559880f39ba5604D33486Da4d8A48527";

  // Variation 1: Complete payload similar to the documented example but with base chain
  const p1 = {
    customerId: "CUST" + crypto.randomBytes(6).toString('hex').toUpperCase(),
    kycSource: "sumsub",
    kycId: "KYC" + crypto.randomBytes(6).toString('hex').toUpperCase(),
    subTier: 9,
    subGroup: "CD",
    override: true,
    expirationTime: 1863690034,
    wallet: {
      address: address,
      chain: "base"
    },
    identityDataList: [
      {
        idType: "PASSPORT",
        fullName: "Jerry Cui",
        idNumber: "A123456789",
        validUntil: "2030-12-31",
        issuingCountryISO2: "US"
      }
    ],
    bankAccountList: [
      {
        bankCountry: "US",
        bankName: "Bank of America",
        bankAccount: "6222021234567890",
        bankAccountType: "A",
        balance: 0,
        currency: "USD"
      }
    ]
  };

  // Variation 2: Same as V1 but with arbitrum chain
  const p2 = JSON.parse(JSON.stringify(p1));
  p2.wallet.chain = "arbitrum";
  p2.customerId = "CUST" + crypto.randomBytes(6).toString('hex').toUpperCase();

  // Variation 3: Minimal payload with base chain
  const p3 = {
    customerId: "CUST" + crypto.randomBytes(6).toString('hex').toUpperCase(),
    expirationTime: 1863690034,
    wallet: {
      address: address,
      chain: "base"
    },
    override: true
  };

  // Variation 4: Minimal payload with arbitrum chain
  const p4 = {
    customerId: "CUST" + crypto.randomBytes(6).toString('hex').toUpperCase(),
    expirationTime: 1863690034,
    wallet: {
      address: address,
      chain: "arbitrum"
    },
    override: true
  };

  await tryGenerate("V1 Base Full", p1);
  await tryGenerate("V2 Arbitrum Full", p2);
  await tryGenerate("V3 Base Minimal", p3);
  await tryGenerate("V4 Arbitrum Minimal", p4);
}

run();
