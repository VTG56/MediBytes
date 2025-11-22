const hre = require("hardhat");

async function main() {
  console.log("Starting demo data seeding...");

  const [owner, patient1, patient2, doctor1, donor1, recipient1] = await hre.ethers.getSigners();

  // Load deployed contract addresses
  const fs = require("fs");
  const path = require("path");
  const constantsPath = path.join(__dirname, "../shared/constants.json");
  
  if (!fs.existsSync(constantsPath)) {
    console.error("❌ constants.json not found. Please deploy contracts first.");
    return;
  }

  const constants = JSON.parse(fs.readFileSync(constantsPath, "utf8"));
  const addresses = constants.contracts;

  // Get contract instances
  const ehrStorage = await hre.ethers.getContractAt("EHRStorage", addresses.EHRStorage);
  const accessControl = await hre.ethers.getContractAt("AccessControl", addresses.AccessControl);
  const reportVerification = await hre.ethers.getContractAt("ReportVerification", addresses.ReportVerification);
  const organRegistry = await hre.ethers.getContractAt("OrganRegistry", addresses.OrganRegistry);

  console.log("✅ Contract instances loaded");

  // Seed Patient Records
  console.log("\n📝 Seeding patient records...");
  
  await ehrStorage.connect(patient1).uploadRecord("QmPatient1Record1", "Blood Test");
  await ehrStorage.connect(patient1).uploadRecord("QmPatient1Record2", "X-Ray");
  await ehrStorage.connect(patient2).uploadRecord("QmPatient2Record1", "MRI Scan");
  
  console.log("✅ Patient records seeded");

  // Seed Access Permissions
  console.log("\n🔐 Seeding access permissions...");
  
  const expiryTime = Math.floor(Date.now() / 1000) + 30 * 86400; // 30 days
  await accessControl.connect(patient1).grantAccess(doctor1.address, expiryTime);
  
  console.log("✅ Access permissions seeded");

  // Seed Report Verifications
  console.log("\n✅ Seeding report verifications...");
  
  const hash1 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("Sample Medical Report 1"));
  const hash2 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("Sample Medical Report 2"));
  
  await reportVerification.registerReport(hash1);
  await reportVerification.registerReport(hash2);
  
  console.log("✅ Report verifications seeded");

  // Seed Organ Registry
  console.log("\n❤️  Seeding organ registry...");
  
  await organRegistry.connect(donor1).registerDonor("O+", "Kidney", 35, "HLA-A*02:01");
  await organRegistry.connect(recipient1).registerRecipient("O+", "Kidney", 40, "HLA-A*02:01", 75);
  
  console.log("✅ Organ registry seeded");

  console.log("\n================================");
  console.log("   Demo Data Seeded Successfully! 🎉");
  console.log("================================");
  console.log("\nAccount Summary:");
  console.log("════════════════════════════════════════");
  console.log(`Owner:       ${owner.address}`);
  console.log(`Patient 1:   ${patient1.address}`);
  console.log(`Patient 2:   ${patient2.address}`);
  console.log(`Doctor 1:    ${doctor1.address}`);
  console.log(`Donor 1:     ${donor1.address}`);
  console.log(`Recipient 1: ${recipient1.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
