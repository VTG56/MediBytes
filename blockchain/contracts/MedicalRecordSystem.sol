// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MedicalRecordSystem
 * @dev Complete healthcare system with role-based access control
 * Only verified doctors can commit medical records to blockchain
 * Patients control access permissions
 */
contract MedicalRecordSystem is Ownable {
    
    // ============ Enums ============
    
    enum Role { None, Patient, Doctor, Hospital }
    enum AccessStatus { Pending, Approved, Revoked }
    
    // ============ Structs ============
    
    struct User {
        address walletAddress;
        Role role;
        bool isActive;
        string licenseNumber;  // For doctors/hospitals
        uint256 registeredAt;
    }
    
    struct MedicalRecord {
        bytes32 documentHash;      // Hash of the original document
        string ipfsCID;            // IPFS CID of encrypted document
        string reportType;         // Blood Test, X-Ray, Prescription, etc.
        string issuingFacility;    // Hospital/Lab name
        address patient;           // Patient's address (mapped from backend)
        address issuedBy;          // Doctor who issued/approved the record
        uint256 issuedDate;        // Timestamp of actual medical report
        uint256 approvedAt;        // Blockchain registration timestamp
        bool isDoctorVerified;     // True = doctor-approved
        string metadata;           // JSON string with structured data
    }
    
    struct AccessPermission {
        address patient;
        address requester;         // Doctor requesting access
        AccessStatus status;
        uint256 requestedAt;
        uint256 respondedAt;
        uint256 expiresAt;         // Access expiry timestamp
        string purpose;            // Reason for access request
    }
    
    // ============ State Variables ============
    
    // User management
    mapping(address => User) public users;
    mapping(string => address) public licenseToAddress;  // Doctor license -> wallet
    
    // Medical records
    mapping(bytes32 => MedicalRecord) public records;
    mapping(address => bytes32[]) public patientRecords;  // patient -> record hashes
    uint256 public totalRecords;
    
    // Access control
    mapping(bytes32 => AccessPermission) public accessRequests;  // keccak256(patient, doctor) -> permission
    mapping(address => mapping(address => bool)) public hasAccess;  // patient -> doctor -> has access
    
    // ============ Events ============
    
    event UserRegistered(address indexed user, Role role, string licenseNumber);
    event DoctorVerified(address indexed doctor, string licenseNumber);
    event DoctorRevoked(address indexed doctor);
    
    event RecordSubmitted(
        bytes32 indexed documentHash,
        address indexed patient,
        address indexed issuedBy,
        string reportType,
        uint256 issuedDate
    );
    
    event AccessRequested(
        address indexed patient,
        address indexed doctor,
        string purpose,
        uint256 requestedAt
    );
    
    event AccessGranted(
        address indexed patient,
        address indexed doctor,
        uint256 expiresAt
    );
    
    event AccessRevoked(
        address indexed patient,
        address indexed doctor
    );
    
    // ============ Modifiers ============
    
    modifier onlyRole(Role _role) {
        require(users[msg.sender].role == _role, "Unauthorized role");
        require(users[msg.sender].isActive, "User not active");
        _;
    }
    
    modifier onlyDoctor() {
        require(users[msg.sender].role == Role.Doctor, "Only doctors allowed");
        require(users[msg.sender].isActive, "Doctor not active");
        _;
    }
    
    modifier onlyPatient() {
        require(users[msg.sender].role == Role.Patient, "Only patients allowed");
        require(users[msg.sender].isActive, "Patient not active");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {}
    
    // ============ User Management ============
    
    /**
     * @dev Register a doctor with license verification (only owner/admin)
     */
    function registerDoctor(
        address doctorAddress,
        string memory licenseNumber
    ) external onlyOwner {
        require(doctorAddress != address(0), "Invalid address");
        require(bytes(licenseNumber).length > 0, "License required");
        require(users[doctorAddress].role == Role.None, "Already registered");
        require(licenseToAddress[licenseNumber] == address(0), "License already used");
        
        users[doctorAddress] = User({
            walletAddress: doctorAddress,
            role: Role.Doctor,
            isActive: true,
            licenseNumber: licenseNumber,
            registeredAt: block.timestamp
        });
        
        licenseToAddress[licenseNumber] = doctorAddress;
        
        emit UserRegistered(doctorAddress, Role.Doctor, licenseNumber);
        emit DoctorVerified(doctorAddress, licenseNumber);
    }
    
    /**
     * @dev Register patient (mapped from backend user ID)
     */
    function registerPatient(address patientAddress) external onlyOwner {
        require(patientAddress != address(0), "Invalid address");
        require(users[patientAddress].role == Role.None, "Already registered");
        
        users[patientAddress] = User({
            walletAddress: patientAddress,
            role: Role.Patient,
            isActive: true,
            licenseNumber: "",
            registeredAt: block.timestamp
        });
        
        emit UserRegistered(patientAddress, Role.Patient, "");
    }
    
    /**
     * @dev Revoke doctor's privileges
     */
    function revokeDoctor(address doctorAddress) external onlyOwner {
        require(users[doctorAddress].role == Role.Doctor, "Not a doctor");
        users[doctorAddress].isActive = false;
        emit DoctorRevoked(doctorAddress);
    }
    
    // ============ Medical Records Management ============
    
    /**
     * @dev Doctor submits/approves a medical record for a patient
     * This is the ONLY way records get on blockchain - ensures credibility
     */
    function submitMedicalRecord(
        bytes32 documentHash,
        string memory ipfsCID,
        string memory reportType,
        string memory issuingFacility,
        address patientAddress,
        uint256 issuedDate,
        string memory metadata
    ) external onlyDoctor {
        require(documentHash != bytes32(0), "Invalid document hash");
        require(bytes(ipfsCID).length > 0, "IPFS CID required");
        require(patientAddress != address(0), "Invalid patient address");
        require(users[patientAddress].role == Role.Patient, "Invalid patient");
        require(records[documentHash].approvedAt == 0, "Record already exists");
        
        records[documentHash] = MedicalRecord({
            documentHash: documentHash,
            ipfsCID: ipfsCID,
            reportType: reportType,
            issuingFacility: issuingFacility,
            patient: patientAddress,
            issuedBy: msg.sender,
            issuedDate: issuedDate,
            approvedAt: block.timestamp,
            isDoctorVerified: true,
            metadata: metadata
        });
        
        patientRecords[patientAddress].push(documentHash);
        totalRecords++;
        
        emit RecordSubmitted(
            documentHash,
            patientAddress,
            msg.sender,
            reportType,
            issuedDate
        );
    }
    
    /**
     * @dev Get all record hashes for a patient
     */
    function getPatientRecords(address patientAddress) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return patientRecords[patientAddress];
    }
    
    /**
     * @dev Get record details (only if caller has access)
     */
    function getRecordDetails(bytes32 documentHash) 
        external 
        view 
        returns (
            string memory ipfsCID,
            string memory reportType,
            string memory issuingFacility,
            address patient,
            address issuedBy,
            uint256 issuedDate,
            uint256 approvedAt,
            bool isDoctorVerified,
            string memory metadata
        ) 
    {
        MedicalRecord memory record = records[documentHash];
        require(record.approvedAt > 0, "Record not found");
        
        // Check access permission
        require(
            msg.sender == record.patient ||  // Patient can always view their records
            msg.sender == record.issuedBy ||  // Issuing doctor can view
            hasAccess[record.patient][msg.sender] ||  // Granted access
            msg.sender == owner(),  // Admin can view
            "Access denied"
        );
        
        return (
            record.ipfsCID,
            record.reportType,
            record.issuingFacility,
            record.patient,
            record.issuedBy,
            record.issuedDate,
            record.approvedAt,
            record.isDoctorVerified,
            record.metadata
        );
    }
    
    /**
     * @dev Verify document authenticity (public function for verification)
     */
    function verifyDocument(bytes32 documentHash) 
        external 
        view 
        returns (
            bool exists,
            bool isDoctorVerified,
            address issuedBy,
            string memory reportType,
            uint256 approvedAt
        ) 
    {
        MedicalRecord memory record = records[documentHash];
        
        return (
            record.approvedAt > 0,
            record.isDoctorVerified,
            record.issuedBy,
            record.reportType,
            record.approvedAt
        );
    }
    
    // ============ Access Control ============
    
    /**
     * @dev Doctor requests access to patient's records
     */
    function requestAccess(
        address patientAddress,
        string memory purpose,
        uint256 durationDays
    ) external onlyDoctor {
        require(patientAddress != address(0), "Invalid patient");
        require(users[patientAddress].role == Role.Patient, "Not a patient");
        require(!hasAccess[patientAddress][msg.sender], "Access already granted");
        
        bytes32 requestId = keccak256(abi.encodePacked(patientAddress, msg.sender));
        
        require(
            accessRequests[requestId].status != AccessStatus.Pending,
            "Request already pending"
        );
        
        accessRequests[requestId] = AccessPermission({
            patient: patientAddress,
            requester: msg.sender,
            status: AccessStatus.Pending,
            requestedAt: block.timestamp,
            respondedAt: 0,
            expiresAt: block.timestamp + (durationDays * 1 days),
            purpose: purpose
        });
        
        emit AccessRequested(patientAddress, msg.sender, purpose, block.timestamp);
    }
    
    /**
     * @dev Patient approves access request (called by backend on patient's behalf)
     */
    function approveAccess(
        address patientAddress,
        address doctorAddress
    ) external onlyOwner {  // Backend calls this with patient's authorization
        bytes32 requestId = keccak256(abi.encodePacked(patientAddress, doctorAddress));
        AccessPermission storage request = accessRequests[requestId];
        
        require(request.status == AccessStatus.Pending, "No pending request");
        require(users[doctorAddress].role == Role.Doctor, "Not a doctor");
        require(users[doctorAddress].isActive, "Doctor not active");
        
        request.status = AccessStatus.Approved;
        request.respondedAt = block.timestamp;
        hasAccess[patientAddress][doctorAddress] = true;
        
        emit AccessGranted(patientAddress, doctorAddress, request.expiresAt);
    }
    
    /**
     * @dev Patient revokes access
     */
    function revokeAccess(
        address patientAddress,
        address doctorAddress
    ) external onlyOwner {  // Backend calls this with patient's authorization
        require(hasAccess[patientAddress][doctorAddress], "No access to revoke");
        
        bytes32 requestId = keccak256(abi.encodePacked(patientAddress, doctorAddress));
        accessRequests[requestId].status = AccessStatus.Revoked;
        hasAccess[patientAddress][doctorAddress] = false;
        
        emit AccessRevoked(patientAddress, doctorAddress);
    }
    
    /**
     * @dev Check if doctor has access to patient's records
     */
    function checkAccess(address patientAddress, address doctorAddress) 
        external 
        view 
        returns (bool) 
    {
        bytes32 requestId = keccak256(abi.encodePacked(patientAddress, doctorAddress));
        AccessPermission memory request = accessRequests[requestId];
        
        return (
            hasAccess[patientAddress][doctorAddress] && 
            request.status == AccessStatus.Approved &&
            block.timestamp < request.expiresAt
        );
    }
    
    /**
     * @dev Get all pending access requests for a patient
     */
    function getPendingRequests(address patientAddress) 
        external 
        view 
        returns (address[] memory) 
    {
        // Note: In production, use an array to track requests
        // This is a simplified version
        address[] memory empty;
        return empty;
    }
    
    // ============ Utility Functions ============
    
    /**
     * @dev Check if user is a verified doctor
     */
    function isDoctorVerified(address doctorAddress) external view returns (bool) {
        return users[doctorAddress].role == Role.Doctor && users[doctorAddress].isActive;
    }
    
    /**
     * @dev Get user role
     */
    function getUserRole(address userAddress) external view returns (Role) {
        return users[userAddress].role;
    }
    
    /**
     * @dev Get total number of records for a patient
     */
    function getPatientRecordCount(address patientAddress) external view returns (uint256) {
        return patientRecords[patientAddress].length;
    }
}
