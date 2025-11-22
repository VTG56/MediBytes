// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PrivateEHRStorage
 * @dev Privacy-preserving Electronic Health Record storage using double-hash commitment
 * Stores only commitment hashes (hash of hash + salt) to prevent metadata leakage
 */
contract PrivateEHRStorage is Ownable {
    struct Record {
        bytes32 commitmentHash;      // Hash(originalHash + salt) - PUBLIC
        string ipfsCID;              // IPFS Content ID of encrypted file
        uint256 timestamp;
        address issuer;              // Hospital/Doctor who issued
        string recordType;           // General category only (not detailed diagnosis)
        bool verified;
        bool exists;
    }
    
    // Patient address => Record ID => Record
    mapping(address => mapping(uint256 => Record)) private patientRecords;
    mapping(address => uint256) private patientRecordCount;
    
    // Commitment hash => exists (prevents duplicate commitments)
    mapping(bytes32 => bool) private commitmentExists;
    
    // Emergency contacts mapping
    mapping(address => address[]) private emergencyContacts;
    
    event RecordAdded(
        address indexed patient, 
        uint256 indexed recordId,
        bytes32 commitmentHash, 
        string ipfsCID, 
        uint256 timestamp
    );
    event RecordVerified(address indexed patient, uint256 recordId);
    event EmergencyAccessGranted(address indexed patient, address indexed emergency);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Add a new medical record with privacy-preserving commitment hash
     * @param _commitmentHash Hash of (originalHash + salt) - prevents direct file correlation
     * @param _ipfsCID IPFS CID of encrypted file
     * @param _recordType General category (lab-report, prescription, etc.)
     */
    function addRecord(
        bytes32 _commitmentHash,
        string memory _ipfsCID,
        string memory _recordType
    ) external returns (uint256) {
        require(_commitmentHash != bytes32(0), "Invalid commitment hash");
        require(bytes(_ipfsCID).length > 0, "Invalid IPFS CID");
        require(!commitmentExists[_commitmentHash], "Commitment already exists");
        
        uint256 recordId = patientRecordCount[msg.sender];
        
        Record memory newRecord = Record({
            commitmentHash: _commitmentHash,
            ipfsCID: _ipfsCID,
            timestamp: block.timestamp,
            issuer: msg.sender,
            recordType: _recordType,
            verified: false,
            exists: true
        });
        
        patientRecords[msg.sender][recordId] = newRecord;
        patientRecordCount[msg.sender]++;
        commitmentExists[_commitmentHash] = true;
        
        emit RecordAdded(msg.sender, recordId, _commitmentHash, _ipfsCID, block.timestamp);
        
        return recordId;
    }
    
    /**
     * @dev Get total record count for a patient
     */
    function getRecordCount(address _patient) external view returns (uint256) {
        return patientRecordCount[_patient];
    }
    
    /**
     * @dev Get specific record by ID
     */
    function getRecord(address _patient, uint256 _recordId) 
        external 
        view 
        returns (Record memory) 
    {
        require(_recordId < patientRecordCount[_patient], "Record does not exist");
        return patientRecords[_patient][_recordId];
    }
    
    /**
     * @dev Get all records for a patient (paginated)
     */
    function getRecordsPaginated(
        address _patient, 
        uint256 _offset, 
        uint256 _limit
    ) external view returns (Record[] memory) {
        uint256 totalRecords = patientRecordCount[_patient];
        require(_offset < totalRecords, "Offset out of bounds");
        
        uint256 end = _offset + _limit;
        if (end > totalRecords) {
            end = totalRecords;
        }
        
        uint256 resultCount = end - _offset;
        Record[] memory results = new Record[](resultCount);
        
        for (uint256 i = 0; i < resultCount; i++) {
            results[i] = patientRecords[_patient][_offset + i];
        }
        
        return results;
    }
    
    /**
     * @dev Verify a record commitment exists (for two-tier verification)
     * Does NOT reveal which patient owns it
     */
    function verifyCommitment(bytes32 _commitmentHash) external view returns (bool) {
        return commitmentExists[_commitmentHash];
    }
    
    /**
     * @dev Mark record as verified by issuer
     */
    function verifyRecord(address _patient, uint256 _recordId) external {
        require(_recordId < patientRecordCount[_patient], "Record does not exist");
        Record storage record = patientRecords[_patient][_recordId];
        require(record.issuer == msg.sender || msg.sender == owner(), "Not authorized");
        
        record.verified = true;
        emit RecordVerified(_patient, _recordId);
    }
    
    /**
     * @dev Add emergency contact who can access records in emergencies
     */
    function addEmergencyContact(address _emergencyContact) external {
        require(_emergencyContact != address(0), "Invalid address");
        emergencyContacts[msg.sender].push(_emergencyContact);
        emit EmergencyAccessGranted(msg.sender, _emergencyContact);
    }
    
    /**
     * @dev Check if address is emergency contact for patient
     */
    function isEmergencyContact(address _patient, address _contact) 
        external 
        view 
        returns (bool) 
    {
        address[] memory contacts = emergencyContacts[_patient];
        for (uint i = 0; i < contacts.length; i++) {
            if (contacts[i] == _contact) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Get all emergency contacts for a patient
     */
    function getEmergencyContacts(address _patient) 
        external 
        view 
        returns (address[] memory) 
    {
        return emergencyContacts[_patient];
    }
}
