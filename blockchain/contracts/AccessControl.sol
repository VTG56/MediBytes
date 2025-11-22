// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AccessControl is Ownable {
    struct AccessPermission {
        bool isActive;
        uint256 expiryTime;
        uint256 grantedAt;
    }

    mapping(address => mapping(address => AccessPermission)) private permissions;
    mapping(address => address[]) private patientDoctors;
    mapping(address => address[]) private doctorPatients;

    event AccessGranted(
        address indexed patient,
        address indexed doctor,
        uint256 expiryTime
    );

    event AccessRevoked(
        address indexed patient,
        address indexed doctor
    );

    event AccessExpired(
        address indexed patient,
        address indexed doctor
    );

    constructor() Ownable(msg.sender) {}

    function grantAccess(address _doctor, uint256 _expiryTime) external {
        require(_doctor != address(0), "Invalid doctor address");
        require(_expiryTime > block.timestamp, "Expiry time must be in future");

        permissions[msg.sender][_doctor] = AccessPermission({
            isActive: true,
            expiryTime: _expiryTime,
            grantedAt: block.timestamp
        });

        patientDoctors[msg.sender].push(_doctor);
        doctorPatients[_doctor].push(msg.sender);

        emit AccessGranted(msg.sender, _doctor, _expiryTime);
    }

    function revokeAccess(address _doctor) external {
        require(permissions[msg.sender][_doctor].isActive, "Access not active");

        permissions[msg.sender][_doctor].isActive = false;

        emit AccessRevoked(msg.sender, _doctor);
    }

    function checkAccess(address _doctor, address _patient) 
        external 
        view 
        returns (bool) 
    {
        AccessPermission memory permission = permissions[_patient][_doctor];
        
        if (!permission.isActive) {
            return false;
        }

        if (block.timestamp > permission.expiryTime) {
            return false;
        }

        return true;
    }

    function getPermission(address _patient, address _doctor) 
        external 
        view 
        returns (AccessPermission memory) 
    {
        return permissions[_patient][_doctor];
    }

    function getAuthorizedDoctors(address _patient) 
        external 
        view 
        returns (address[] memory) 
    {
        return patientDoctors[_patient];
    }

    function getAuthorizedPatients(address _doctor) 
        external 
        view 
        returns (address[] memory) 
    {
        return doctorPatients[_doctor];
    }

    function extendAccess(address _doctor, uint256 _newExpiryTime) external {
        require(permissions[msg.sender][_doctor].isActive, "Access not active");
        require(_newExpiryTime > block.timestamp, "Expiry time must be in future");
        require(
            _newExpiryTime > permissions[msg.sender][_doctor].expiryTime,
            "New expiry must be later than current"
        );

        permissions[msg.sender][_doctor].expiryTime = _newExpiryTime;

        emit AccessGranted(msg.sender, _doctor, _newExpiryTime);
    }
}
