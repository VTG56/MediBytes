const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...");

  // Deploy EHRStorage
  console.log("Deploying EHRStorage...");
  const EHRStorage = await hre.ethers.getContractFactory("EHRStorage");
  const ehrStorage = await EHRStorage.deploy();
  await ehrStorage.waitForDeployment();
  const ehrStorageAddress = await ehrStorage.getAddress();
  console.log(`EHRStorage deployed to: ${ehrStorageAddress}`);

  // Deploy AccessControl
  console.log("Deploying AccessControl...");
  const AccessControl = await hre.ethers.getContractFactory("AccessControl");
  const accessControl = await AccessControl.deploy();
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log(`AccessControl deployed to: ${accessControlAddress}`);

  // Deploy ReportVerification
  console.log("Deploying ReportVerification...");
  const ReportVerification = await hre.ethers.getContractFactory("ReportVerification");
  const reportVerification = await ReportVerification.deploy();
  await reportVerification.waitForDeployment();
  const reportVerificationAddress = await reportVerification.getAddress();
  console.log(`ReportVerification deployed to: ${reportVerificationAddress}`);

  // Deploy OrganRegistry
  console.log("Deploying OrganRegistry...");
  const OrganRegistry = await hre.ethers.getContractFactory("OrganRegistry");
  const organRegistry = await OrganRegistry.deploy();
  await organRegistry.waitForDeployment();
  const organRegistryAddress = await organRegistry.getAddress();
  console.log(`OrganRegistry deployed to: ${organRegistryAddress}`);

  // Deploy OrganAllocation
  console.log("Deploying OrganAllocation...");
  const OrganAllocation = await hre.ethers.getContractFactory("OrganAllocation");
  const organAllocation = await OrganAllocation.deploy(organRegistryAddress);
  await organAllocation.waitForDeployment();
  const organAllocationAddress = await organAllocation.getAddress();
  console.log(`OrganAllocation deployed to: ${organAllocationAddress}`);

  // Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    contracts: {
      EHRStorage: ehrStorageAddress,
      AccessControl: accessControlAddress,
      ReportVerification: reportVerificationAddress,
      OrganRegistry: organRegistryAddress,
      OrganAllocation: organAllocationAddress,
    },
    timestamp: new Date().toISOString(),
  };

  // Save to shared folder
  const sharedDir = path.join(__dirname, "../../shared");
  if (!fs.existsSync(sharedDir)) {
    fs.mkdirSync(sharedDir, { recursive: true });
  }

  const constantsPath = path.join(sharedDir, "constants.json");
  fs.writeFileSync(constantsPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${constantsPath}`);

  // Save ABIs
  const abisDir = path.join(sharedDir, "abis");
  if (!fs.existsSync(abisDir)) {
    fs.mkdirSync(abisDir, { recursive: true });
  }

  const contracts = ["EHRStorage", "AccessControl", "ReportVerification", "OrganRegistry", "OrganAllocation"];
  
  for (const contractName of contracts) {
    const artifactPath = path.join(__dirname, `../artifacts/contracts/${contractName}.sol/${contractName}.json`);
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      const abiPath = path.join(abisDir, `${contractName}.json`);
      fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
      console.log(`ABI saved: ${contractName}.json`);
    }
  }

  console.log("\n✅ Deployment completed successfully!");
  console.log("\nContract Addresses:");
  console.log("═══════════════════════════════════════════");
  Object.entries(deploymentInfo.contracts).forEach(([name, address]) => {
    console.log(`${name.padEnd(25)}: ${address}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
