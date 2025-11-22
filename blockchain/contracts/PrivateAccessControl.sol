// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PrivateAccessControl
 * @dev Manages access permissions with minimal on-chain exposure
 * Access logs stored off-chain, only permission grants/revokes on-chain
 */
contract PrivateAccessControl {
    struct AccessGrant {
        address doctor;
        uint256 expiresAt;
        bool active;
        bool exists;
    }
    
    // Patient => Doctor => Access Grant
    mapping(address => mapping(address => AccessGrant)) private accessGrants;
    
    // Patient => List of doctors with access
    mapping(address => address[]) private patientDoctors;
    
    // Minimal events - no sensitive data
    event AccessGranted(address indexed patient, address indexed doctor, uint256 expiresAt);
    event AccessRevoked(address indexed patient, address indexed doctor);
    event AccessExpired(address indexed patient, address indexed doctor);
    
    /**
     * @dev Grant access to a doctor with time limit
     */
    function grantAccess(address _doctor, uint256 _durationInDays) external {
        require(_doctor != address(0), "Invalid doctor address");
        require(_durationInDays > 0 && _durationInDays <= 365, "Invalid duration");
        
        uint256 expiresAt = block.timestamp + (_durationInDays * 1 days);
        
        AccessGrant storage grant = accessGrants[msg.sender][_doctor];
        
        if (!grant.exists) {
            patientDoctors[msg.sender].push(_doctor);
        }
        
        grant.doctor = _doctor;
        grant.expiresAt = expiresAt;
        grant.active = true;
        grant.exists = true;
        
        emit AccessGranted(msg.sender, _doctor, expiresAt);
    }
    
    /**
     * @dev Revoke access from a doctor
     */
    function revokeAccess(address _doctor) external {
        AccessGrant storage grant = accessGrants[msg.sender][_doctor];
        require(grant.exists, "Access grant does not exist");
        
        grant.active = false;
        emit AccessRevoked(msg.sender, _doctor);
    }
    
    /**
     * @dev Check if doctor has active access to patient records
     */
    function hasAccess(address _patient, address _doctor) external view returns (bool) {
        AccessGrant memory grant = accessGrants[_patient][_doctor];
        
        if (!grant.exists || !grant.active) {
            return false;
        }
        
        if (block.timestamp > grant.expiresAt) {
            return false;
        }
        
        return true;
    }
    
    /**
     * @dev Get access grant details
     */
    function getAccessGrant(address _patient, address _doctor) 
        external 
        view 
        returns (uint256 expiresAt, bool active) 
    {
        AccessGrant memory grant = accessGrants[_patient][_doctor];
        return (grant.expiresAt, grant.active && block.timestamp <= grant.expiresAt);
    }
    
    /**
     * @dev Get all doctors with access to patient (active or expired)
     */
    function getAuthorizedDoctors(address _patient) 
        external 
        view 
        returns (address[] memory) 
    {
        return patientDoctors[_patient];
    }
    
    /**
     * @dev Extend access duration for a doctor
     */
    function extendAccess(address _doctor, uint256 _additionalDays) external {
        AccessGrant storage grant = accessGrants[msg.sender][_doctor];
        require(grant.exists && grant.active, "No active access to extend");
        require(_additionalDays > 0 && _additionalDays <= 365, "Invalid duration");
        
        grant.expiresAt += (_additionalDays * 1 days);
        emit AccessGranted(msg.sender, _doctor, grant.expiresAt);
    }
    
    /**
     * @dev Batch grant access to multiple doctors
     */
    function batchGrantAccess(
        address[] calldata _doctors, 
        uint256 _durationInDays
    ) external {
        require(_doctors.length > 0 && _doctors.length <= 10, "Invalid batch size");
        require(_durationInDays > 0 && _durationInDays <= 365, "Invalid duration");
        
        uint256 expiresAt = block.timestamp + (_durationInDays * 1 days);
        
        for (uint i = 0; i < _doctors.length; i++) {
            address doctor = _doctors[i];
            require(doctor != address(0), "Invalid doctor address");
            
            AccessGrant storage grant = accessGrants[msg.sender][doctor];
            
            if (!grant.exists) {
                patientDoctors[msg.sender].push(doctor);
            }
            
            grant.doctor = doctor;
            grant.expiresAt = expiresAt;
            grant.active = true;
            grant.exists = true;
            
            emit AccessGranted(msg.sender, doctor, expiresAt);
        }
    }
}
