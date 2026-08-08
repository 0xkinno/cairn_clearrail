import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Starting ClearRailCore deployment via ethers...");

  const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
  const privateKey = process.env.CLEARAIL_PRIVATE_KEY;

  if (!privateKey) {
    console.error("Error: CLEARAIL_PRIVATE_KEY is not defined in .env.local");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Deployer address:", wallet.address);

  // Read artifact
  const artifactPath = path.join(__dirname, "../artifacts/contracts/ClearRailCore.sol/ClearRailCore.json");
  if (!fs.existsSync(artifactPath)) {
    console.error(`Error: Artifact not found at ${artifactPath}. Did you compile the contract?`);
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const { abi, bytecode } = artifact;

  // Deploy contract
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  
  console.log("Sending deployment transaction...");
  const contract = await factory.deploy();
  
  console.log("Waiting for deployment transaction to confirm...");
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("ClearRailCore deployed successfully at:", address);

  // Update .env.local with the contract address
  const envPath = path.join(__dirname, "../.env.local");
  let envContent = fs.readFileSync(envPath, "utf8");

  // Check if CLEARAIL_CORE_ADDRESS exists, if so replace it, else append
  if (envContent.includes("CLEARAIL_CORE_ADDRESS=")) {
    envContent = envContent.replace(/CLEARAIL_CORE_ADDRESS=.*/, `CLEARAIL_CORE_ADDRESS=${address}`);
  } else {
    envContent += `\nCLEARAIL_CORE_ADDRESS=${address}\n`;
  }

  fs.writeFileSync(envPath, envContent, "utf8");
  console.log("Updated .env.local with CLEARAIL_CORE_ADDRESS=" + address);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});
