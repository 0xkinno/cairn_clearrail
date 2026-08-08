import crypto from 'crypto';
import dns from 'dns';

// Force IPv4 lookup for dns resolution in Node.js to prevent connection timeouts to Cleanverse Sandbox
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  console.warn('Failed to set DNS default result order to ipv4first:', e);
}

const CLEANVERSE_URL = 'https://uatapi.cleanverse.com/api/cooperate';

// Helper to encrypt requests
export function encryptPayload(payload: any, apiKeyBase64: string): string {
  const key = Buffer.from(apiKeyBase64, 'base64');
  const iv = Buffer.alloc(16, 0); // 16 zero bytes as per docs
  const text = JSON.stringify(payload);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

// Helper to decrypt responses if they contain encrypted data
export function decryptPayload(ciphertextBase64: string, apiKeyBase64: string): string {
  const key = Buffer.from(apiKeyBase64, 'base64');
  const iv = Buffer.alloc(16, 0);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(ciphertextBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Cleanverse Client
export class CleanverseClient {
  private apiId: string;
  private apiKey: string;

  constructor() {
    this.apiId = process.env.CLEANVERSE_SANDBOX_API_ID || '';
    this.apiKey = process.env.CLEANVERSE_SANDBOX_API_KEY || '';

    if (!this.apiId || !this.apiKey) {
      console.warn('Warning: Cleanverse Sandbox API credentials are not set in environment variables.');
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'api-id': this.apiId,
      'X-Request-ID': crypto.randomUUID()
    };
  }

  // Encrypted request POST helper
  private async postEncrypted<T = any>(path: string, payload: any): Promise<{ code: string; message: string; data: T }> {
    const url = `${CLEANVERSE_URL}${path}`;
    const encryptedData = encryptPayload(payload, this.apiKey);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ data: encryptedData }),
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      return json;
    } catch (error: any) {
      console.error(`Cleanverse Encrypted POST failed [${path}]:`, error);
      return {
        code: '5000',
        message: `Network error: ${error.message || 'Unknown error'}`,
        data: {} as any
      };
    }
  }

  // Plain JSON request POST helper
  private async postPlain<T = any>(path: string, payload: any): Promise<{ code: string; message: string; data: T }> {
    const url = `${CLEANVERSE_URL}${path}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      return json;
    } catch (error: any) {
      console.error(`Cleanverse Plain POST failed [${path}]:`, error);
      return {
        code: '5000',
        message: `Network error: ${error.message || 'Unknown error'}`,
        data: {} as any
      };
    }
  }

  // --- A-Pass Management ---

  async generateAPass(params: {
    customerId: string;
    walletAddress: string;
    chain: string;
    fullName?: string;
    idNumber?: string;
    issuingCountry?: string;
    override?: boolean;
  }) {
    const expirationTime = Math.floor(Date.now() / 1000) + 3 * 365 * 24 * 3600; // 3 years expiry
    const payload: any = {
      customerId: params.customerId,
      expirationTime: expirationTime,
      wallet: {
        address: params.walletAddress,
        chain: params.chain
      },
      override: params.override !== false
    };

    if (params.fullName && params.idNumber && params.issuingCountry) {
      payload.identityDataList = [
        {
          idType: 'PASSPORT',
          fullName: params.fullName,
          idNumber: params.idNumber,
          validUntil: '2030-12-31',
          issuingCountryISO2: params.issuingCountry.toUpperCase()
        }
      ];
    }

    return this.postEncrypted<any>('/generate_apass', payload);
  }

  async updateAPassStatus(walletAddress: string, chain: string, status: '1' | '2', reason?: string) {
    const payload = {
      status,
      blacklistReason: reason || '',
      wallet: {
        chain,
        address: walletAddress
      }
    };
    return this.postEncrypted<any>('/update_status', payload);
  }

  async queryAPass(walletAddress: string, chain: string) {
    const payload = {
      chain,
      address: walletAddress
    };
    return this.postPlain<any>('/query_apass', payload);
  }

  async verifyAPass(walletAddress: string, atokenAddress: string, chain: string) {
    const payload = {
      chain,
      atoken: atokenAddress,
      address: walletAddress
    };
    return this.postPlain<{
      chain: string;
      atoken: string;
      address: string;
      code: number; // 1 = not found, 2 = no apass, 3 = cannot transfer, 4 = success
      message: string;
      magickLink?: string;
    }>('/verify_apass', payload);
  }

  // --- A-Token Management ---

  async queryDepositATokenList(chain: string, symbol?: string, address?: string) {
    const payload: any = { chain };
    if (symbol) payload.symbol = symbol;
    if (address) payload.address = address;
    return this.postPlain<{
      chain: string;
      tokens: Array<{
        origin_token: {
          address: string;
          name: string;
          symbol: string;
          decimals: number;
          icon: string;
        };
        atoken: {
          address: string;
          name: string;
          symbol: string;
          decimals: number;
          icon: string;
        };
        accesscore_address: string;
        apass_address: string;
      }>;
    }>('/query_deposit_atoken_list', payload);
  }

  // --- Validator Compliance ---

  async registerCompliancePool(contractAddress: string, chain: string, minTier: number, allowedGroup: string, allowedSubGroup: string, ownerSignature: string) {
    const payload = {
      chain,
      contract_address: contractAddress,
      rule: {
        allowed_group: allowedGroup,
        allowed_sub_group: allowedSubGroup,
        min_tier: minTier,
        min_sub_tier: 0,
        is_black_list: false,
        countries: []
      },
      owner_signature: ownerSignature
    };
    return this.postEncrypted<any>('/validator/register', payload);
  }

  async verifyUserCompliance(contractAddress: string, userAddress: string, chain: string) {
    const payload = {
      chain,
      contract_address: contractAddress,
      user_address: userAddress
    };
    return this.postPlain<{
      chain: string;
      contract_address: string;
      user_address: string;
      valid: boolean;
    }>('/validator/verify', payload);
  }

  async setPoolComplianceRules(contractAddress: string, chain: string, minTier: number, allowedGroup: string, countries: string[] = [], isBlackList = false) {
    const payload = {
      chain,
      contract_address: contractAddress,
      rule: {
        allowed_group: allowedGroup,
        allowed_sub_group: '',
        min_tier: minTier,
        min_sub_tier: 0,
        is_black_list: isBlackList,
        countries: countries
      }
    };
    return this.postEncrypted<any>('/validator/set_rule', payload);
  }

  async setPoolPaused(contractAddress: string, chain: string, paused: boolean) {
    const payload = {
      chain,
      contract_address: contractAddress,
      paused
    };
    return this.postEncrypted<any>('/validator/set_paused', payload);
  }

  async queryPoolPauseState(contractAddress: string, chain: string) {
    const payload = {
      chain,
      contract_address: contractAddress
    };
    return this.postPlain<{
      chain: string;
      contract_address: string;
      paused: boolean;
    }>('/validator/is_paused', payload);
  }

  // --- Common Queries & Transactions ---

  async queryTransactions(walletAddress: string, chain: string, symbol?: string, txHash?: string) {
    const payload: any = {
      chain,
      address: walletAddress
    };
    if (symbol) payload.symbol = symbol;
    if (txHash) payload.txHash = txHash;
    return this.postPlain<{
      total_count: number;
      txs: Array<{
        chain: string;
        symbol: string;
        tx_hash: string;
        from_address: string;
        from_org_name: string;
        to_address: string;
        amount: string;
        fee_amount: string;
        type: string; // transfer, mint, burn, etc.
        block_number: number;
        block_time: number;
        status: string; // success
      }>;
    }>('/query_txs', payload);
  }

  async downloadTravelRuleReport(walletAddress: string, chain: string, txHash: string) {
    const payload = {
      txHash,
      wallet: {
        chain,
        address: walletAddress
      }
    };
    return this.postPlain<{
      downloadUrl: string;
      fileName: string;
    }>('/download_travel_rule', payload);
  }

  async requestFaucet(depositAddress: string, chain: string, symbol: string, amount: string) {
    const payload = {
      chain,
      symbol,
      depositAddress,
      amount
    };
    return this.postPlain<{
      chain: string;
      symbol: string;
      deposit_address: string;
      amount: string;
      tx_hash: string;
    }>('/faucet', payload);
  }
}
