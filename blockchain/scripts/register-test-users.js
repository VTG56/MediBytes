const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔧 Registering Test Users on MedicalRecordSystem...\n");

  const contractAddress = "0x745d52A59140ec1A6dEeeE38687256f8e3533845";
  
  // Get contract instance
  const MedicalRecordSystem = await ethers.getContractFactory("MedicalRecordSystem");
  const medicalSystem = MedicalRecordSystem.attach(contractAddress);
  
  // Get deployer (owner) account
  const [owner] = await ethers.getSigners();
  console.log("👤 Owner address:", owner.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(owner.address)), "MATIC\n");

  // ===== REGISTER DOCTORS =====
  console.log("👨‍⚕️ Registering Doctors...\n");
  
  const doctors = [
    {
      address: "0xEB1Dd2bc587B1C0801be9b14987AAf93897f4c30",
      license: "MCI-MH-99999-2025",
      name: "Dr. Sarah (Main Doctor - Connected Wallet)"
    },
    {
      address: "0x8Ba1f109551bD432803012645Ac136ddd64DBA72",
      license: "MCI-MH-12345-2025",
      name: "Dr. Amit Sharma"
    },
    {
      address: "0x9Cb2f109551bD432803012645Ac136ddd64DCA83",
      license: "MCI-DL-67890-2024",
      name: "Dr. Priya Singh"
    },
    {
      address: "0x7Ab3f109551bD432803012645Ac136ddd64DBB94",
      license: "MCI-KA-54321-2023",
      name: "Dr. Rajesh Kumar"
    }
  ];

  for (const doctor of doctors) {
    try {
      console.log(`Registering ${doctor.name}...`);
      console.log(`  Address: ${doctor.address}`);
      console.log(`  License: ${doctor.license}`);
      
      const tx = await medicalSystem.registerDoctor(doctor.address, doctor.license);
      const receipt = await tx.wait();
      
      console.log(`  ✅ Registered! Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`  TX: ${receipt.hash}\n`);
    } catch (error) {
      if (error.message.includes("Doctor already registered")) {
        console.log(`  ⚠️  Already registered\n`);
      } else {
        console.log(`  ❌ Error: ${error.message}\n`);
      }
    }
  }

  // ===== REGISTER PATIENTS =====
  console.log("\n👥 Registering Patients...\n");
  
  const patients = [
    {
      address: "0xBeDdBdED049f68D005723d4077314Afe0d5D326f",
      name: "Hardcoded Patient (Used for all patients)"
    },
    {
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5",
      name: "John Doe (Patient ID: P001)"
    },
    {
      address: "0x853e46De7634D0542935b4c955Cd1e7506f1cCc6",
      name: "Sarah Khan (Patient ID: P002)"
    },
    {
      address: "0x964f57Ef8735E0552946c5d966De2f617f2dDd7",
      name: "Rahul Patel (Patient ID: P003)"
    }
  ];

  for (const patient of patients) {
    try {
      console.log(`Registering ${patient.name}...`);
      console.log(`  Address: ${patient.address}`);
      
      const tx = await medicalSystem.registerPatient(patient.address);
      const receipt = await tx.wait();
      
      console.log(`  ✅ Registered! Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`  TX: ${receipt.hash}\n`);
    } catch (error) {
      if (error.message.includes("Patient already registered")) {
        console.log(`  ⚠️  Already registered\n`);
      } else {
        console.log(`  ❌ Error: ${error.message}\n`);
      }
    }
  }

  // ===== VERIFY REGISTRATIONS =====
  console.log("\n🔍 Verifying Registrations...\n");
  
  // Check doctors
  for (const doctor of doctors) {
    const user = await medicalSystem.users(doctor.address);
    console.log(`Doctor: ${doctor.name}`);
    console.log(`  Role: ${user.role === 2 ? "✅ Doctor" : "❌ Not Doctor"}`);
    console.log(`  License: ${user.licenseNumber}`);
    console.log(`  Active: ${user.isActive ? "✅" : "❌"}\n`);
  }

  // Check patients
  for (const patient of patients) {
    const user = await medicalSystem.users(patient.address);
    console.log(`Patient: ${patient.name}`);
    console.log(`  Role: ${user.role === 1 ? "✅ Patient" : "❌ Not Patient"}`);
    console.log(`  Active: ${user.isActive ? "✅" : "❌"}\n`);
  }

  console.log("✅ Registration complete!\n");
  
  console.log("📋 Test User Summary:");
  console.log("─────────────────────────────────────────────");
  console.log("Doctors: 3");
  console.log("Patients: 3");
  console.log("─────────────────────────────────────────────\n");
  
  console.log("🧪 Next Steps:");
  console.log("1. Use doctor wallets to approve patient documents");
  console.log("2. Test access control: doctor requests → patient approves");
  console.log("3. Submit test medical records");
  console.log("4. Verify records on PolygonScan");
  console.log("\n🔗 Contract: https://amoy.polygonscan.com/address/" + contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
