import { ethers } from 'ethers';
import { CleanverseClient } from '../lib/cleanverse/adapter.ts';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
  const privateKey = process.env.CLEARAIL_PRIVATE_KEY;
  const contractAddress = process.env.CLEARAIL_CORE_ADDRESS;

  if (!privateKey || !contractAddress) {
    console.error('Error: missing env variables');
    process.exit(1);
  }

  const wallet = new ethers.Wallet(privateKey);
  
  // Cleanverse lowercase chain slug + lowercase hex address
  const messageToSign = `arbitrum${contractAddress.toLowerCase()}`;
  console.log(`Signing message: "${messageToSign}"`);

  // EIP-191 personal_sign
  const signature = await wallet.signMessage(messageToSign);
  console.log(`Generated owner signature: ${signature}`);

  const client = new CleanverseClient();
  
  console.log('Sending register pool compliance request...');
  const res = await client.registerCompliancePool(
    contractAddress,
    'arbitrum',
    10, // minTier
    'CR', // allowedGroup
    'SG', // allowedSubGroup
    signature
  );

  console.log('Register Pool Response:', res);
}

run().catch(console.error);
