const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying MedicalRecordSystem to Polygon Amoy...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MATIC\n");

  // Deploy MedicalRecordSystem
  console.log("⏳ Deploying MedicalRecordSystem contract...");
  const MedicalRecordSystem = await hre.ethers.getContractFactory("MedicalRecordSystem");
  const medicalSystem = await MedicalRecordSystem.deploy();
  
  await medicalSystem.waitForDeployment();
  const contractAddress = await medicalSystem.getAddress();

  console.log("\n✅ MedicalRecordSystem deployed!");
  console.log("📍 Contract address:", contractAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const owner = await medicalSystem.owner();
  console.log("👤 Contract owner:", owner);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    owner: owner,
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\n📌 Next Steps:");
  console.log("1. Update frontend .env with:");
  console.log(`   VITE_MEDICAL_SYSTEM_ADDRESS=${contractAddress}`);
  console.log("\n2. Register verified doctors:");
  console.log(`   await medicalSystem.registerDoctor(doctorWallet, "LICENSE_NUMBER")`);
  console.log("\n3. Register patients (mapped from backend users):");
  console.log(`   await medicalSystem.registerPatient(patientMappedAddress)`);
  console.log("\n4. View on PolygonScan:");
  console.log(`   https://amoy.polygonscan.com/address/${contractAddress}`);
  console.log("\n");

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
