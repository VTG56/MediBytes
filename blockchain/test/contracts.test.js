const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MediBytes Smart Contracts", function () {
  let ehrStorage, accessControl, reportVerification, organRegistry, organAllocation;
  let owner, patient, doctor, donor, recipient;

  beforeEach(async function () {
    [owner, patient, doctor, donor, recipient] = await ethers.getSigners();

    // Deploy contracts
    const EHRStorage = await ethers.getContractFactory("EHRStorage");
    ehrStorage = await EHRStorage.deploy();

    const AccessControl = await ethers.getContractFactory("AccessControl");
    accessControl = await AccessControl.deploy();

    const ReportVerification = await ethers.getContractFactory("ReportVerification");
    reportVerification = await ReportVerification.deploy();

    const OrganRegistry = await ethers.getContractFactory("OrganRegistry");
    organRegistry = await OrganRegistry.deploy();

    const OrganAllocation = await ethers.getContractFactory("OrganAllocation");
    organAllocation = await OrganAllocation.deploy(await organRegistry.getAddress());
  });

  describe("EHRStorage", function () {
    it("Should upload a record", async function () {
      const ipfsHash = "QmTest123";
      const documentType = "Blood Test";

      await expect(ehrStorage.connect(patient).uploadRecord(ipfsHash, documentType))
        .to.emit(ehrStorage, "RecordUploaded");

      const records = await ehrStorage.connect(patient).getPatientRecords(patient.address);
      expect(records.length).to.equal(1);
      expect(records[0].ipfsHash).to.equal(ipfsHash);
    });

    it("Should grant and check access", async function () {
      await ehrStorage.connect(patient).grantAccess(doctor.address);
      
      const hasAccess = await ehrStorage.hasAccess(patient.address, doctor.address);
      expect(hasAccess).to.be.true;
    });
  });

  describe("AccessControl", function () {
    it("Should grant access with expiry time", async function () {
      const expiryTime = Math.floor(Date.now() / 1000) + 86400; // 1 day

      await expect(
        accessControl.connect(patient).grantAccess(doctor.address, expiryTime)
      ).to.emit(accessControl, "AccessGranted");

      const hasAccess = await accessControl.checkAccess(doctor.address, patient.address);
      expect(hasAccess).to.be.true;
    });

    it("Should revoke access", async function () {
      const expiryTime = Math.floor(Date.now() / 1000) + 86400;

      await accessControl.connect(patient).grantAccess(doctor.address, expiryTime);
      await accessControl.connect(patient).revokeAccess(doctor.address);

      const hasAccess = await accessControl.checkAccess(doctor.address, patient.address);
      expect(hasAccess).to.be.false;
    });
  });

  describe("ReportVerification", function () {
    it("Should register and verify a report", async function () {
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("test-document"));

      await expect(reportVerification.registerReport(documentHash))
        .to.emit(reportVerification, "ReportRegistered");

      const [isVerified, timestamp, uploader] = await reportVerification.verifyReport(documentHash);
      expect(isVerified).to.be.true;
      expect(uploader).to.equal(owner.address);
    });

    it("Should not register duplicate reports", async function () {
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("test-document"));

      await reportVerification.registerReport(documentHash);
      
      await expect(
        reportVerification.registerReport(documentHash)
      ).to.be.revertedWith("Report already registered");
    });
  });

  describe("OrganRegistry", function () {
    it("Should register a donor", async function () {
      await expect(
        organRegistry.connect(donor).registerDonor("O+", "Kidney", 35, "HLA-A*02:01")
      ).to.emit(organRegistry, "DonorRegistered");

      const donorInfo = await organRegistry.getDonor(donor.address);
      expect(donorInfo.bloodType).to.equal("O+");
      expect(donorInfo.organType).to.equal("Kidney");
    });

    it("Should register a recipient", async function () {
      await expect(
        organRegistry.connect(recipient).registerRecipient("O+", "Kidney", 40, "HLA-A*02:01", 75)
      ).to.emit(organRegistry, "RecipientRegistered");

      const recipientInfo = await organRegistry.getRecipient(recipient.address);
      expect(recipientInfo.bloodType).to.equal("O+");
      expect(recipientInfo.urgencyScore).to.equal(75);
    });
  });

  describe("OrganAllocation", function () {
    beforeEach(async function () {
      await organRegistry.connect(donor).registerDonor("O+", "Kidney", 35, "HLA-A*02:01");
      await organRegistry.connect(recipient).registerRecipient("O+", "Kidney", 40, "HLA-A*02:01", 75);
    });

    it("Should create an allocation", async function () {
      await expect(
        organAllocation.createAllocation(donor.address, recipient.address, 85)
      ).to.emit(organAllocation, "AllocationCreated");

      const allocationCount = await organAllocation.getTotalAllocations();
      expect(allocationCount).to.equal(1);
    });

    it("Should calculate compatibility score", async function () {
      const score = await organAllocation.calculateCompatibility(donor.address, recipient.address);
      expect(score).to.be.gt(0);
    });
  });
});
