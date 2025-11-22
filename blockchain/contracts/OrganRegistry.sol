// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract OrganRegistry is Ownable {
    struct Donor {
        address donorAddress;
        string bloodType;
        string organType;
        uint256 age;
        string tissueType;
        uint256 registrationDate;
        bool isActive;
    }

    struct Recipient {
        address recipientAddress;
        string bloodType;
        string organType;
        uint256 age;
        string tissueType;
        uint256 urgencyScore;
        uint256 waitingSince;
        bool isActive;
    }

    mapping(address => Donor) private donors;
    mapping(address => Recipient) private recipients;
    
    address[] private donorList;
    address[] private recipientList;

    event DonorRegistered(
        address indexed donor,
        string organType,
        string bloodType,
        uint256 timestamp
    );

    event RecipientRegistered(
        address indexed recipient,
        string organType,
        string bloodType,
        uint256 urgencyScore,
        uint256 timestamp
    );

    event DonorDeactivated(address indexed donor);
    event RecipientDeactivated(address indexed recipient);

    constructor() Ownable(msg.sender) {}

    function registerDonor(
        string memory _bloodType,
        string memory _organType,
        uint256 _age,
        string memory _tissueType
    ) external {
        require(!donors[msg.sender].isActive, "Already registered as donor");

        donors[msg.sender] = Donor({
            donorAddress: msg.sender,
            bloodType: _bloodType,
            organType: _organType,
            age: _age,
            tissueType: _tissueType,
            registrationDate: block.timestamp,
            isActive: true
        });

        donorList.push(msg.sender);

        emit DonorRegistered(msg.sender, _organType, _bloodType, block.timestamp);
    }

    function registerRecipient(
        string memory _bloodType,
        string memory _organType,
        uint256 _age,
        string memory _tissueType,
        uint256 _urgencyScore
    ) external {
        require(!recipients[msg.sender].isActive, "Already registered as recipient");
        require(_urgencyScore <= 100, "Urgency score must be <= 100");

        recipients[msg.sender] = Recipient({
            recipientAddress: msg.sender,
            bloodType: _bloodType,
            organType: _organType,
            age: _age,
            tissueType: _tissueType,
            urgencyScore: _urgencyScore,
            waitingSince: block.timestamp,
            isActive: true
        });

        recipientList.push(msg.sender);

        emit RecipientRegistered(
            msg.sender,
            _organType,
            _bloodType,
            _urgencyScore,
            block.timestamp
        );
    }

    function getDonor(address _donor) external view returns (Donor memory) {
        require(donors[_donor].isActive, "Donor not found or inactive");
        return donors[_donor];
    }

    function getRecipient(address _recipient) 
        external 
        view 
        returns (Recipient memory) 
    {
        require(recipients[_recipient].isActive, "Recipient not found or inactive");
        return recipients[_recipient];
    }

    function getAllDonors() external view returns (address[] memory) {
        return donorList;
    }

    function getAllRecipients() external view returns (address[] memory) {
        return recipientList;
    }

    function deactivateDonor() external {
        require(donors[msg.sender].isActive, "Not an active donor");
        donors[msg.sender].isActive = false;
        emit DonorDeactivated(msg.sender);
    }

    function deactivateRecipient() external {
        require(recipients[msg.sender].isActive, "Not an active recipient");
        recipients[msg.sender].isActive = false;
        emit RecipientDeactivated(msg.sender);
    }

    function updateUrgencyScore(uint256 _newScore) external {
        require(recipients[msg.sender].isActive, "Not an active recipient");
        require(_newScore <= 100, "Urgency score must be <= 100");
        
        recipients[msg.sender].urgencyScore = _newScore;
    }

    function getDonorCount() external view returns (uint256) {
        return donorList.length;
    }

    function getRecipientCount() external view returns (uint256) {
        return recipientList.length;
    }
}
