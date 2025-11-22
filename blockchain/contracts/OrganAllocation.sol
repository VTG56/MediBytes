// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./OrganRegistry.sol";

contract OrganAllocation is Ownable {
    OrganRegistry public registry;

    struct Allocation {
        address donor;
        address recipient;
        string organType;
        uint256 compatibilityScore;
        uint256 timestamp;
        AllocationStatus status;
    }

    enum AllocationStatus {
        Pending,
        Approved,
        Completed,
        Rejected
    }

    Allocation[] private allocations;
    mapping(address => uint256[]) private recipientAllocations;
    mapping(address => uint256[]) private donorAllocations;

    event AllocationCreated(
        uint256 indexed allocationId,
        address indexed donor,
        address indexed recipient,
        uint256 compatibilityScore
    );

    event AllocationStatusChanged(
        uint256 indexed allocationId,
        AllocationStatus newStatus
    );

    constructor(address _registryAddress) Ownable(msg.sender) {
        registry = OrganRegistry(_registryAddress);
    }

    function createAllocation(
        address _donor,
        address _recipient,
        uint256 _compatibilityScore
    ) external onlyOwner returns (uint256) {
        OrganRegistry.Donor memory donor = registry.getDonor(_donor);
        OrganRegistry.Recipient memory recipient = registry.getRecipient(_recipient);

        require(donor.isActive, "Donor not active");
        require(recipient.isActive, "Recipient not active");
        require(
            keccak256(bytes(donor.organType)) == keccak256(bytes(recipient.organType)),
            "Organ types do not match"
        );

        Allocation memory newAllocation = Allocation({
            donor: _donor,
            recipient: _recipient,
            organType: donor.organType,
            compatibilityScore: _compatibilityScore,
            timestamp: block.timestamp,
            status: AllocationStatus.Pending
        });

        allocations.push(newAllocation);
        uint256 allocationId = allocations.length - 1;

        recipientAllocations[_recipient].push(allocationId);
        donorAllocations[_donor].push(allocationId);

        emit AllocationCreated(allocationId, _donor, _recipient, _compatibilityScore);

        return allocationId;
    }

    function updateAllocationStatus(
        uint256 _allocationId,
        AllocationStatus _newStatus
    ) external onlyOwner {
        require(_allocationId < allocations.length, "Invalid allocation ID");

        allocations[_allocationId].status = _newStatus;

        emit AllocationStatusChanged(_allocationId, _newStatus);
    }

    function getAllocation(uint256 _allocationId) 
        external 
        view 
        returns (Allocation memory) 
    {
        require(_allocationId < allocations.length, "Invalid allocation ID");
        return allocations[_allocationId];
    }

    function getAllocations() external view returns (Allocation[] memory) {
        return allocations;
    }

    function getRecipientAllocations(address _recipient) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return recipientAllocations[_recipient];
    }

    function getDonorAllocations(address _donor) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return donorAllocations[_donor];
    }

    function getTotalAllocations() external view returns (uint256) {
        return allocations.length;
    }

    function calculateCompatibility(
        address _donor,
        address _recipient
    ) external view returns (uint256) {
        OrganRegistry.Donor memory donor = registry.getDonor(_donor);
        OrganRegistry.Recipient memory recipient = registry.getRecipient(_recipient);

        uint256 score = 0;

        // Blood type match (40 points)
        if (keccak256(bytes(donor.bloodType)) == keccak256(bytes(recipient.bloodType))) {
            score += 40;
        }

        // Age compatibility (20 points)
        uint256 ageDiff = donor.age > recipient.age 
            ? donor.age - recipient.age 
            : recipient.age - donor.age;
        
        if (ageDiff <= 10) {
            score += 20;
        } else if (ageDiff <= 20) {
            score += 10;
        }

        // Urgency factor (40 points)
        score += (recipient.urgencyScore * 40) / 100;

        return score;
    }
}
