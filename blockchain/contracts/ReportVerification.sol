// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ReportVerification is Ownable {
    struct Report {
        bytes32 documentHash;
        uint256 timestamp;
        address uploader;
        bool exists;
    }

    mapping(bytes32 => Report) private reports;
    bytes32[] private reportHashes;

    event ReportRegistered(
        bytes32 indexed documentHash,
        address indexed uploader,
        uint256 timestamp
    );

    event ReportVerified(
        bytes32 indexed documentHash,
        bool isValid
    );

    constructor() Ownable(msg.sender) {}

    function registerReport(bytes32 _documentHash) external {
        require(!reports[_documentHash].exists, "Report already registered");

        reports[_documentHash] = Report({
            documentHash: _documentHash,
            timestamp: block.timestamp,
            uploader: msg.sender,
            exists: true
        });

        reportHashes.push(_documentHash);

        emit ReportRegistered(_documentHash, msg.sender, block.timestamp);
    }

    function verifyReport(bytes32 _documentHash) 
        external 
        view 
        returns (bool isVerified, uint256 timestamp, address uploader) 
    {
        Report memory report = reports[_documentHash];
        
        if (report.exists) {
            return (true, report.timestamp, report.uploader);
        } else {
            return (false, 0, address(0));
        }
    }

    function getReport(bytes32 _documentHash) 
        external 
        view 
        returns (Report memory) 
    {
        require(reports[_documentHash].exists, "Report not found");
        return reports[_documentHash];
    }

    function getTotalReports() external view returns (uint256) {
        return reportHashes.length;
    }

    function getReportByIndex(uint256 _index) 
        external 
        view 
        returns (Report memory) 
    {
        require(_index < reportHashes.length, "Index out of bounds");
        bytes32 hash = reportHashes[_index];
        return reports[hash];
    }

    function getAllReportHashes() external view returns (bytes32[] memory) {
        return reportHashes;
    }
}
