import { readFileSync, statSync } from "fs";
import { Account, JsonRpcProvider, KeyPair, actions, nearToYocto } from "near-api-js";

const [, , deployerAccountId, deployerKey, subAccountId, wasmPath, nodeUrl] = process.argv;

const provider = new JsonRpcProvider({ url: nodeUrl });
const deployer = new Account(deployerAccountId, provider, deployerKey);
const deployerPublicKey = KeyPair.fromString(deployerKey).getPublicKey();

// NEAR storage staking is ~1 NEAR per 100KB. Compute the exact requirement for this
// WASM plus a small buffer for the account's own base storage, instead of a flat guess.
const wasmBytes = statSync(wasmPath).size;
const requiredYocto = BigInt(Math.ceil((wasmBytes / 100_000) * 1.05 * 1e24));

let exists = false;
let currentBalance = 0n;
try {
  const acc = await provider.viewAccount({ accountId: subAccountId });
  exists = true;
  currentBalance = BigInt(acc.amount);
} catch {
  exists = false;
}

if (!exists) {
  console.log(`Creating sub-account ${subAccountId} with deployer's own key, funded for ${(Number(requiredYocto) / 1e24).toFixed(2)} NEAR of storage stake...`);
  await deployer.createSubAccount({
    accountOrPrefix: subAccountId,
    publicKey: deployerPublicKey,
    nearToTransfer: requiredYocto.toString(),
  });
  console.log(`Created ${subAccountId}.`);
} else if (currentBalance < requiredYocto) {
  const topUp = requiredYocto - currentBalance;
  console.log(`Sub-account ${subAccountId} exists but is underfunded, topping up by ${(Number(topUp) / 1e24).toFixed(2)} NEAR...`);
  await deployer.signAndSendTransaction({
    receiverId: subAccountId,
    actions: [actions.transfer(topUp.toString())],
  });
} else {
  console.log(`Sub-account ${subAccountId} already exists and is sufficiently funded, redeploying contract.`);
}

const wasm = readFileSync(wasmPath);
const subAccount = new Account(subAccountId, provider, deployerKey);

const outcome = await subAccount.signAndSendTransaction({
  receiverId: subAccountId,
  actions: [actions.deployContract(wasm)],
});

console.log(`Deployed ${wasmPath} to ${subAccountId}`);
console.log(`Transaction hash: ${outcome.transaction_outcome.id}`);
