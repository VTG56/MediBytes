// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OrganDonorRegistry
 * @dev Privacy-preserving organ donor registry
 * Only stores IPFS CID of encrypted donor data, not actual medical details
 */
contract OrganDonorRegistry {
    struct Donor {
        string encryptedDataCID;     // IPFS CID of encrypted donor info
        bytes32 commitmentHash;      // Hash(donorDetails + salt)
        uint256 registeredAt;
        address registrant;
        bool isActive;
        bool exists;
    }
    
    struct Recipient {
        string encryptedDataCID;     // IPFS CID of encrypted recipient info
        bytes32 commitmentHash;      // Hash(recipientDetails + salt)
        uint256 registeredAt;
        uint8 urgencyScore;          // 1-10 scale
        address registrant;
        bool isActive;
        bool exists;
    }
    
    // Donor and recipient registries
    mapping(address => Donor) private donors;
    mapping(address => Recipient) private recipients;
    
    // Lists for doctor search (addresses only, no medical data)
    address[] private donorList;
    address[] private recipientList;
    
    event DonorRegistered(address indexed donor, bytes32 commitmentHash, uint256 timestamp);
    event RecipientRegistered(address indexed recipient, bytes32 commitmentHash, uint8 urgencyScore, uint256 timestamp);
    event DonorDeactivated(address indexed donor);
    event RecipientDeactivated(address indexed recipient);
    event UrgencyUpdated(address indexed recipient, uint8 newUrgency);
    
    /**
     * @dev Register as organ donor
     * @param _encryptedDataCID IPFS CID of encrypted donor data (blood type, organs, medical history)
     * @param _commitmentHash Hash of donor details for verification
     */
    function registerDonor(
        string memory _encryptedDataCID,
        bytes32 _commitmentHash
    ) external {
        require(bytes(_encryptedDataCID).length > 0, "Invalid IPFS CID");
        require(_commitmentHash != bytes32(0), "Invalid commitment hash");
        require(!donors[msg.sender].exists, "Already registered as donor");
        
        donors[msg.sender] = Donor({
            encryptedDataCID: _encryptedDataCID,
            commitmentHash: _commitmentHash,
            registeredAt: block.timestamp,
            registrant: msg.sender,
            isActive: true,
            exists: true
        });
        
        donorList.push(msg.sender);
        
        emit DonorRegistered(msg.sender, _commitmentHash, block.timestamp);
    }
    
    /**
     * @dev Register as organ recipient
     * @param _encryptedDataCID IPFS CID of encrypted recipient data
     * @param _commitmentHash Hash of recipient details
     * @param _urgencyScore Urgency level (1-10)
     */
    function registerRecipient(
        string memory _encryptedDataCID,
        bytes32 _commitmentHash,
        uint8 _urgencyScore
    ) external {
        require(bytes(_encryptedDataCID).length > 0, "Invalid IPFS CID");
        require(_commitmentHash != bytes32(0), "Invalid commitment hash");
        require(_urgencyScore >= 1 && _urgencyScore <= 10, "Invalid urgency score");
        require(!recipients[msg.sender].exists, "Already registered as recipient");
        
        recipients[msg.sender] = Recipient({
            encryptedDataCID: _encryptedDataCID,
            commitmentHash: _commitmentHash,
            registeredAt: block.timestamp,
            urgencyScore: _urgencyScore,
            registrant: msg.sender,
            isActive: true,
            exists: true
        });
        
        recipientList.push(msg.sender);
        
        emit RecipientRegistered(msg.sender, _commitmentHash, _urgencyScore, block.timestamp);
    }
    
    /**
     * @dev Get donor info (IPFS CID only, actual data is encrypted)
     */
    function getDonor(address _donor) external view returns (
        string memory encryptedDataCID,
        uint256 registeredAt,
        bool isActive
    ) {
        require(donors[_donor].exists, "Donor not found");
        Donor memory donor = donors[_donor];
        return (donor.encryptedDataCID, donor.registeredAt, donor.isActive);
    }
    
    /**
     * @dev Get recipient info (IPFS CID only)
     */
    function getRecipient(address _recipient) external view returns (
        string memory encryptedDataCID,
        uint256 registeredAt,
        uint8 urgencyScore,
        bool isActive
    ) {
        require(recipients[_recipient].exists, "Recipient not found");
        Recipient memory recipient = recipients[_recipient];
        return (recipient.encryptedDataCID, recipient.registeredAt, recipient.urgencyScore, recipient.isActive);
    }
    
    /**
     * @dev Get all active donor addresses (for doctor to fetch and decrypt)
     */
    function getActiveDonors() external view returns (address[] memory) {
        uint256 activeCount = 0;
        
        // Count active donors
        for (uint i = 0; i < donorList.length; i++) {
            if (donors[donorList[i]].isActive) {
                activeCount++;
            }
        }
        
        // Build result array
        address[] memory activeDonors = new address[](activeCount);
        uint256 index = 0;
        
        for (uint i = 0; i < donorList.length; i++) {
            if (donors[donorList[i]].isActive) {
                activeDonors[index] = donorList[i];
                index++;
            }
        }
        
        return activeDonors;
    }
    
    /**
     * @dev Get all active recipient addresses
     */
    function getActiveRecipients() external view returns (address[] memory) {
        uint256 activeCount = 0;
        
        for (uint i = 0; i < recipientList.length; i++) {
            if (recipients[recipientList[i]].isActive) {
                activeCount++;
            }
        }
        
        address[] memory activeRecipients = new address[](activeCount);
        uint256 index = 0;
        
        for (uint i = 0; i < recipientList.length; i++) {
            if (recipients[recipientList[i]].isActive) {
                activeRecipients[index] = recipientList[i];
                index++;
            }
        }
        
        return activeRecipients;
    }
    
    /**
     * @dev Deactivate donor registration
     */
    function deactivateDonor() external {
        require(donors[msg.sender].exists, "Not registered as donor");
        donors[msg.sender].isActive = false;
        emit DonorDeactivated(msg.sender);
    }
    
    /**
     * @dev Deactivate recipient registration
     */
    function deactivateRecipient() external {
        require(recipients[msg.sender].exists, "Not registered as recipient");
        recipients[msg.sender].isActive = false;
        emit RecipientDeactivated(msg.sender);
    }
    
    /**
     * @dev Update recipient urgency score
     */
    function updateUrgency(uint8 _newUrgency) external {
        require(recipients[msg.sender].exists, "Not registered as recipient");
        require(_newUrgency >= 1 && _newUrgency <= 10, "Invalid urgency score");
        
        recipients[msg.sender].urgencyScore = _newUrgency;
        emit UrgencyUpdated(msg.sender, _newUrgency);
    }
    
    /**
     * @dev Get total counts
     */
    function getCounts() external view returns (uint256 totalDonors, uint256 totalRecipients) {
        return (donorList.length, recipientList.length);
    }
}
