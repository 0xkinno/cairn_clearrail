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

async function run() {
  const payload = {
    chain: "arbitrum",
    token_name: "ClearRail Test Token",
    token_symbol: "CRTL" + crypto.randomBytes(3).toString('hex').toUpperCase(),
    decimals: 6,
    admin_address: "0x44be5240559880f39ba5604D33486Da4d8A48527",
    rule: {
      allowed_group: "",
      allowed_sub_group: "",
      min_tier: 5,
      min_sub_tier: 0,
      is_black_list: false,
      countries: []
    },
    icon: "https://images.cleanverse.com/app/token_icon/USDC.svg"
  };

  const encryptedBody = encrypt(JSON.stringify(payload));
  const url = 'https://uatapi.cleanverse.com/api/cooperate/atoken/launch';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-id': API_ID,
        'X-Request-ID': crypto.randomUUID()
      },
      body: JSON.stringify({ data: encryptedBody })
    });

    const json = await response.json();
    console.log('Launch Token Response:', json);
  } catch (error) {
    console.error('Launch Token Failed:', error);
  }
}

run();
