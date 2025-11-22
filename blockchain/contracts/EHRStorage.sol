// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract EHRStorage is Ownable {
    struct Record {
        string ipfsHash;
        uint256 timestamp;
        string documentType;
        address uploadedBy;
        bool exists;
    }

    mapping(address => Record[]) private patientRecords;
    mapping(address => mapping(address => bool)) private authorizedDoctors;

    event RecordUploaded(
        address indexed patient,
        string ipfsHash,
        string documentType,
        uint256 timestamp
    );

    event AccessGranted(address indexed patient, address indexed doctor);
    event AccessRevoked(address indexed patient, address indexed doctor);

    constructor() Ownable(msg.sender) {}

    modifier onlyAuthorized(address patient) {
        require(
            msg.sender == patient || authorizedDoctors[patient][msg.sender],
            "Not authorized to access records"
        );
        _;
    }

    function uploadRecord(string memory _ipfsHash, string memory _documentType) external {
        Record memory newRecord = Record({
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp,
            documentType: _documentType,
            uploadedBy: msg.sender,
            exists: true
        });

        patientRecords[msg.sender].push(newRecord);

        emit RecordUploaded(msg.sender, _ipfsHash, _documentType, block.timestamp);
    }

    function getPatientRecords(address _patient) 
        external 
        view 
        onlyAuthorized(_patient) 
        returns (Record[] memory) 
    {
        return patientRecords[_patient];
    }

    function getRecordCount(address _patient) 
        external 
        view 
        onlyAuthorized(_patient) 
        returns (uint256) 
    {
        return patientRecords[_patient].length;
    }

    function grantAccess(address _doctor) external {
        authorizedDoctors[msg.sender][_doctor] = true;
        emit AccessGranted(msg.sender, _doctor);
    }

    function revokeAccess(address _doctor) external {
        authorizedDoctors[msg.sender][_doctor] = false;
        emit AccessRevoked(msg.sender, _doctor);
    }

    function hasAccess(address _patient, address _doctor) 
        external 
        view 
        returns (bool) 
    {
        return _doctor == _patient || authorizedDoctors[_patient][_doctor];
    }
}
