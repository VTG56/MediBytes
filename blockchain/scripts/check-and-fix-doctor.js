const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔍 Checking and Fixing Doctor Registration...\n");

  const contractAddress = "0x745d52A59140ec1A6dEeeE38687256f8e3533845";
  const doctorWallet = "0xEB1Dd2bc587B1C0801be9b14987AAf93897f4c30";
  
  // Get contract instance
  const MedicalRecordSystem = await ethers.getContractFactory("MedicalRecordSystem");
  const contract = MedicalRecordSystem.attach(contractAddress);
  
  // Get deployer (owner) account
  const [owner] = await ethers.getSigners();
  console.log("👤 Owner address:", owner.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(owner.address)), "MATIC\n");

  // Check current registration
  console.log("🔍 Checking current registration for:", doctorWallet);
  const userInfo = await contract.users(doctorWallet);
  
  console.log("Current Status:");
  console.log("  Role:", userInfo.role.toString(), getRoleName(userInfo.role));
  console.log("  Active:", userInfo.isActive);
  console.log("  License:", userInfo.licenseNumber);
  console.log("  Registered At:", new Date(Number(userInfo.registeredAt) * 1000).toISOString());
  
  // Check if this is the owner (who deployed the contract)
  const contractOwner = await contract.owner();
  console.log("\n📋 Contract Owner:", contractOwner);
  console.log("📋 Checking wallet:", doctorWallet);
  console.log("📋 Is owner?:", contractOwner.toLowerCase() === doctorWallet.toLowerCase());
  
  if (userInfo.role !== 2n) { // Not a Doctor
    console.log("\n⚠️  Wallet is not registered as a Doctor!");
    console.log("Expected role: 2 (Doctor)");
    console.log("Current role:", userInfo.role.toString(), getRoleName(userInfo.role));
    
    // The owner wallet is likely registered as admin/owner automatically
    // We need to manually register it as a doctor with a license
    console.log("\n🔧 Attempting to register as doctor...");
    
    try {
      const tx = await contract.registerDoctor(
        doctorWallet,
        "MCI-MH-99999-2025"
      );
      console.log("📤 Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ Doctor registered! Gas used:", receipt.gasUsed.toString());
      
      // Verify
      const newInfo = await contract.users(doctorWallet);
      console.log("\n✅ New Status:");
      console.log("  Role:", newInfo.role.toString(), getRoleName(newInfo.role));
      console.log("  Active:", newInfo.isActive);
      console.log("  License:", newInfo.licenseNumber);
    } catch (error) {
      console.log("❌ Error registering:", error.message);
      
      if (error.message.includes("Already registered")) {
        console.log("\n💡 Wallet is already registered with a different role.");
        console.log("💡 Solution: You need to use a different wallet for the doctor,");
        console.log("💡 or modify the smart contract to allow role changes.");
      }
    }
  } else {
    console.log("\n✅ Wallet is correctly registered as a Doctor!");
    console.log("✅ You can now approve reports with this wallet.");
  }
  
  // Also check patient wallet
  console.log("\n\n🔍 Checking patient wallet...");
  const patientWallet = "0xBeDdBdED049f68D005723d4077314Afe0d5D326f";
  const patientInfo = await contract.users(patientWallet);
  console.log("Patient Status:");
  console.log("  Address:", patientWallet);
  console.log("  Role:", patientInfo.role.toString(), getRoleName(patientInfo.role));
  console.log("  Active:", patientInfo.isActive);
}

function getRoleName(role) {
  const roles = ["None", "Patient", "Doctor", "Hospital"];
  return `(${roles[Number(role)] || "Unknown"})`;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
