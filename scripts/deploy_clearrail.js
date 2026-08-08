import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Starting ClearRailCore deployment...");

  const ClearRailCore = await hre.ethers.getContractFactory("ClearRailCore");
  const contract = await ClearRailCore.deploy();

  console.log("Deployment transaction sent. Waiting for deployment completion...");
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("ClearRailCore successfully deployed to:", address);

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

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
