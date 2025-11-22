const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting MediBytes Smart Contract Deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // Deploy PrivateEHRStorage
  console.log("📝 Deploying PrivateEHRStorage...");
  const PrivateEHRStorage = await hre.ethers.getContractFactory("PrivateEHRStorage");
  const ehrStorage = await PrivateEHRStorage.deploy();
  await ehrStorage.waitForDeployment();
  const ehrAddress = await ehrStorage.getAddress();
  console.log("✅ PrivateEHRStorage deployed to:", ehrAddress);

  // Deploy PrivateAccessControl
  console.log("\n🔒 Deploying PrivateAccessControl...");
  const PrivateAccessControl = await hre.ethers.getContractFactory("PrivateAccessControl");
  const accessControl = await PrivateAccessControl.deploy();
  await accessControl.waitForDeployment();
  const accessAddress = await accessControl.getAddress();
  console.log("✅ PrivateAccessControl deployed to:", accessAddress);

  // Deploy OrganDonorRegistry
  console.log("\n❤️  Deploying OrganDonorRegistry...");
  const OrganDonorRegistry = await hre.ethers.getContractFactory("OrganDonorRegistry");
  const organRegistry = await OrganDonorRegistry.deploy();
  await organRegistry.waitForDeployment();
  const organAddress = await organRegistry.getAddress();
  console.log("✅ OrganDonorRegistry deployed to:", organAddress);

  // Prepare contract addresses object
  const addresses = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    PrivateEHRStorage: ehrAddress,
    PrivateAccessControl: accessAddress,
    OrganDonorRegistry: organAddress,
    deployedAt: new Date().toISOString()
  };

  // Create shared directory if it doesn't exist
  const sharedDir = path.join(__dirname, "..", "..", "shared");
  const abisDir = path.join(sharedDir, "abis");
  
  if (!fs.existsSync(sharedDir)) {
    fs.mkdirSync(sharedDir, { recursive: true });
  }
  if (!fs.existsSync(abisDir)) {
    fs.mkdirSync(abisDir, { recursive: true });
  }

  // Save contract addresses
  const addressesPath = path.join(sharedDir, "contract-addresses.json");
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("\n💾 Contract addresses saved to:", addressesPath);

  // Save ABIs
  console.log("\n📋 Saving ABIs...");
  
  const artifacts = [
    { name: "PrivateEHRStorage", contract: ehrStorage },
    { name: "PrivateAccessControl", contract: accessControl },
    { name: "OrganDonorRegistry", contract: organRegistry }
  ];

  for (const { name, contract } of artifacts) {
    const artifact = await hre.artifacts.readArtifact(name);
    const abiPath = path.join(abisDir, `${name}.json`);
    fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
    console.log(`✅ ${name} ABI saved`);
  }

  // Generate TypeScript constants file for frontend
  const constantsContent = `// Auto-generated contract addresses and ABIs
// Generated at: ${new Date().toISOString()}

export const CONTRACT_ADDRESSES = ${JSON.stringify(addresses, null, 2)};

export const NETWORK_CONFIG = {
  chainId: ${addresses.chainId},
  chainName: "${hre.network.name}",
  rpcUrl: "${hre.network.config.url || 'http://localhost:8545'}",
};
`;

  const constantsPath = path.join(sharedDir, "constants.ts");
  fs.writeFileSync(constantsPath, constantsContent);
  console.log("✅ TypeScript constants generated");

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📝 Contract Summary:");
  console.log("  PrivateEHRStorage:     ", ehrAddress);
  console.log("  PrivateAccessControl:  ", accessAddress);
  console.log("  OrganDonorRegistry:    ", organAddress);
  console.log("\n🌐 Network:", hre.network.name);
  console.log("⛓️  Chain ID:", addresses.chainId);
  console.log("\n💡 Next Steps:");
  console.log("  1. Update frontend .env with contract addresses");
  console.log("  2. Start the frontend: cd frontend && npm run dev");
  console.log("  3. Start ML service: cd ml-service && python run.py");
  console.log("\n📚 Documentation: See README.md for usage guide");
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
