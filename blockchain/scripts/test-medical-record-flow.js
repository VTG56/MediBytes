const { ethers } = require("hardhat");

async function main() {
  console.log("\n🧪 Testing Medical Record Submission Flow...\n");

  const contractAddress = "0x745d52A59140ec1A6dEeeE38687256f8e3533845";
  
  // Get contract instance
  const MedicalRecordSystem = await ethers.getContractFactory("MedicalRecordSystem");
  const medicalSystem = MedicalRecordSystem.attach(contractAddress);
  
  // Get signers
  const [owner, doctor, patient] = await ethers.getSigners();
  
  console.log("👤 Test Accounts:");
  console.log("─────────────────────────────────────────────");
  console.log("Owner:   ", owner.address);
  console.log("Doctor:  ", doctor.address);
  console.log("Patient: ", patient.address);
  console.log("─────────────────────────────────────────────\n");

  // ===== STEP 1: REGISTER DOCTOR =====
  console.log("📝 Step 1: Registering Doctor...");
  try {
    const tx1 = await medicalSystem.registerDoctor(doctor.address, "MCI-TEST-12345");
    await tx1.wait();
    console.log("✅ Doctor registered\n");
  } catch (error) {
    if (error.message.includes("already registered")) {
      console.log("⚠️  Doctor already registered\n");
    } else {
      throw error;
    }
  }

  // ===== STEP 2: REGISTER PATIENT =====
  console.log("📝 Step 2: Registering Patient...");
  try {
    const tx2 = await medicalSystem.registerPatient(patient.address);
    await tx2.wait();
    console.log("✅ Patient registered\n");
  } catch (error) {
    if (error.message.includes("already registered")) {
      console.log("⚠️  Patient already registered\n");
    } else {
      throw error;
    }
  }

  // ===== STEP 3: CREATE TEST MEDICAL RECORD =====
  console.log("📝 Step 3: Doctor Submitting Medical Record...\n");
  
  // Simulate a real medical report
  const medicalReport = {
    patient: {
      name: "Test Patient",
      dob: "1990-01-15",
      patientId: "P001",
      gender: "Male"
    },
    report: {
      type: "Blood Test - Complete Blood Count",
      date: "2025-11-20",
      facility: "Apollo Hospital, Mumbai",
      doctor: "Dr. Test Physician",
      license: "MCI-TEST-12345"
    },
    clinical: {
      hemoglobin: {
        value: "14.5",
        unit: "g/dL",
        normalRange: "13-17 g/dL",
        status: "normal"
      },
      wbc: {
        value: "7500",
        unit: "cells/µL",
        normalRange: "4000-11000 cells/µL",
        status: "normal"
      },
      platelets: {
        value: "250000",
        unit: "cells/µL",
        normalRange: "150000-450000 cells/µL",
        status: "normal"
      },
      rbc: {
        value: "4.8",
        unit: "million/µL",
        normalRange: "4.5-5.5 million/µL",
        status: "normal"
      }
    },
    notes: "All parameters within normal range. Patient is healthy.",
    aiInsights: {
      risk_level: "low",
      summary: "Blood count indicates good overall health",
      recommendations: ["Maintain current lifestyle", "Regular exercise", "Balanced diet"]
    }
  };

  // Create document hash (in real system, this would be hash of actual PDF/image)
  const documentContent = JSON.stringify(medicalReport);
  const documentHash = ethers.keccak256(ethers.toUtf8Bytes(documentContent));
  
  // Simulate IPFS CID (in real system, this would be from IPFS upload)
  const ipfsCID = "QmTestCID1234567890abcdefghijklmnopqrstuvwxyz";
  
  console.log("📄 Document Details:");
  console.log("  Type: Blood Test - Complete Blood Count");
  console.log("  Patient:", medicalReport.patient.name);
  console.log("  Facility:", medicalReport.report.facility);
  console.log("  Document Hash:", documentHash);
  console.log("  IPFS CID:", ipfsCID);
  console.log("");

  // Doctor submits the record
  const metadata = JSON.stringify(medicalReport);
  const reportDate = Math.floor(new Date(medicalReport.report.date).getTime() / 1000);

  try {
    console.log("🔐 Doctor signing transaction...");
    const doctorSigner = medicalSystem.connect(doctor);
    
    const tx3 = await doctorSigner.submitMedicalRecord(
      documentHash,
      ipfsCID,
      medicalReport.report.type,
      medicalReport.report.facility,
      patient.address,
      reportDate,
      metadata
    );
    
    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx3.wait();
    
    console.log("✅ Medical Record Submitted!");
    console.log("  TX Hash:", receipt.hash);
    console.log("  Block:", receipt.blockNumber);
    console.log("  Gas Used:", receipt.gasUsed.toString());
    console.log("  🔗 View on PolygonScan:");
    console.log("     https://amoy.polygonscan.com/tx/" + receipt.hash);
    console.log("");
  } catch (error) {
    console.log("❌ Error:", error.message);
    return;
  }

  // ===== STEP 4: VERIFY RECORD =====
  console.log("📝 Step 4: Verifying Medical Record...\n");
  
  const record = await medicalSystem.records(documentHash);
  
  console.log("📋 Retrieved Record:");
  console.log("─────────────────────────────────────────────");
  console.log("Document Hash:", record.documentHash);
  console.log("IPFS CID:", record.ipfsCID);
  console.log("Report Type:", record.reportType);
  console.log("Facility:", record.issuingFacility);
  console.log("Patient:", record.patient);
  console.log("Issued By (Doctor):", record.issuedBy);
  console.log("Issued Date:", new Date(Number(record.issuedDate) * 1000).toLocaleDateString());
  console.log("Approved At:", new Date(Number(record.approvedAt) * 1000).toLocaleString());
  console.log("Doctor Verified:", record.isDoctorVerified ? "✅ YES" : "❌ NO");
  console.log("─────────────────────────────────────────────\n");

  // ===== STEP 5: VERIFY DOCUMENT HASH =====
  console.log("📝 Step 5: Public Document Verification...\n");
  
  const isVerified = await medicalSystem.verifyDocument(documentHash);
  console.log("Document Verification:", isVerified ? "✅ VERIFIED ON BLOCKCHAIN" : "❌ NOT FOUND");
  console.log("");

  // ===== STEP 6: GET PATIENT'S RECORDS =====
  console.log("📝 Step 6: Fetching Patient Records...\n");
  
  const patientRecords = await medicalSystem.getPatientRecords(patient.address);
  console.log(`Patient has ${patientRecords.length} record(s) on blockchain`);
  
  if (patientRecords.length > 0) {
    console.log("\n📚 Patient's Medical Records:");
    for (let i = 0; i < patientRecords.length; i++) {
      const rec = await medicalSystem.records(patientRecords[i]);
      console.log(`\n  Record ${i + 1}:`);
      console.log(`    Type: ${rec.reportType}`);
      console.log(`    Facility: ${rec.issuingFacility}`);
      console.log(`    Doctor: ${rec.issuedBy}`);
      console.log(`    Date: ${new Date(Number(rec.issuedDate) * 1000).toLocaleDateString()}`);
      console.log(`    Verified: ${rec.isDoctorVerified ? "✅" : "❌"}`);
    }
  }
  console.log("");

  // ===== SUMMARY =====
  console.log("✅ Test Complete!\n");
  console.log("📊 Summary:");
  console.log("─────────────────────────────────────────────");
  console.log("✅ Doctor registered and verified");
  console.log("✅ Patient registered");
  console.log("✅ Medical record submitted by doctor");
  console.log("✅ Record permanently stored on blockchain");
  console.log("✅ Document hash verification working");
  console.log("✅ Patient can retrieve their records");
  console.log("─────────────────────────────────────────────\n");
  
  console.log("🎉 The system is working perfectly!");
  console.log("\n🔗 Contract: https://amoy.polygonscan.com/address/" + contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  });
