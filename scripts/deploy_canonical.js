import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  console.log("=== ClearRail Arbitrum Sepolia Deployment ===");

  const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
  const privateKey = process.env.CLEARAIL_PRIVATE_KEY || "0xc4374f6f0182a412b3a6d10118e770e83ea6bed0d44d30ed5a67bd877080a002";

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`Deployer Wallet Address: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Wallet Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    throw new Error("Insufficient ETH balance on Arbitrum Sepolia for deployment.");
  }

  // 1. Deploy ClearRail Testnet A-USDC (ERC-20 settlement token)
  console.log("\n1. Deploying ClearRail Testnet A-USDC (ERC-20 settlement token)...");
  const mockArtifactPath = path.resolve("artifacts/contracts/MockERC20.sol/MockERC20.json");
  if (!fs.existsSync(mockArtifactPath)) {
    throw new Error("ClearRail Testnet A-USDC artifact not found. Please run 'npx hardhat compile' first.");
  }
  const mockArtifact = JSON.parse(fs.readFileSync(mockArtifactPath, "utf8"));
  const mockFactory = new ethers.ContractFactory(mockArtifact.abi, mockArtifact.bytecode, wallet);
  const mockToken = await mockFactory.deploy();
  await mockToken.waitForDeployment();
  const mockAddress = await mockToken.getAddress();
  console.log(`✅ ClearRail Testnet A-USDC Deployed at: ${mockAddress}`);

  // 2. Deploy ClearRailCore
  console.log("\n2. Deploying ClearRailCore...");
  const coreArtifactPath = path.resolve("artifacts/contracts/ClearRailCore.sol/ClearRailCore.json");
  if (!fs.existsSync(coreArtifactPath)) {
    throw new Error("ClearRailCore artifact not found. Please run 'npx hardhat compile' first.");
  }
  const coreArtifact = JSON.parse(fs.readFileSync(coreArtifactPath, "utf8"));
  const coreFactory = new ethers.ContractFactory(coreArtifact.abi, coreArtifact.bytecode, wallet);
  
  // Pass admin = wallet.address, registrar = wallet.address
  const coreContract = await coreFactory.deploy(wallet.address, wallet.address);
  await coreContract.waitForDeployment();
  const coreAddress = await coreContract.getAddress();
  console.log(`✅ ClearRailCore Deployed at: ${coreAddress}`);

  // Update .env.local
  const envPath = path.resolve(".env.local");
  let envContent = fs.readFileSync(envPath, "utf8");

  if (envContent.includes("NEXT_PUBLIC_CLEARAIL_CORE_ADDRESS=")) {
    envContent = envContent.replace(/NEXT_PUBLIC_CLEARAIL_CORE_ADDRESS=.*/, `NEXT_PUBLIC_CLEARAIL_CORE_ADDRESS=${coreAddress}`);
  } else {
    envContent += `\nNEXT_PUBLIC_CLEARAIL_CORE_ADDRESS=${coreAddress}`;
  }

  if (envContent.includes("CLEARAIL_CORE_ADDRESS=")) {
    envContent = envContent.replace(/CLEARAIL_CORE_ADDRESS=.*/, `CLEARAIL_CORE_ADDRESS=${coreAddress}`);
  } else {
    envContent += `\nCLEARAIL_CORE_ADDRESS=${coreAddress}`;
  }

  if (envContent.includes("NEXT_PUBLIC_MOCK_ATOKEN_ADDRESS=")) {
    envContent = envContent.replace(/NEXT_PUBLIC_MOCK_ATOKEN_ADDRESS=.*/, `NEXT_PUBLIC_MOCK_ATOKEN_ADDRESS=${mockAddress}`);
  } else {
    envContent += `\nNEXT_PUBLIC_MOCK_ATOKEN_ADDRESS=${mockAddress}`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log("\n✅ Updated .env.local with canonical contract addresses!");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
