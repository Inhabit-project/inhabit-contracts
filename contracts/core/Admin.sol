// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControlUpgradeable} from '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';

import {IAdmin} from './interfaces/IAdmin.sol';
import {Errors} from './libraries/Errors.sol';

contract Admin is AccessControlUpgradeable, IAdmin, Errors {
	/// =========================
	/// === Storage Variables ===
	/// =========================

	bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');
	bytes32 public constant USER_ROLE = keccak256('USER_ROLE');

	/// =========================
	/// ====== Initializer ======
	/// =========================

	function __Admin_init(address _defaultAdmin) internal {
		__AccessControl_init();

		_grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
		_grantRole(ADMIN_ROLE, _defaultAdmin);
		_grantRole(USER_ROLE, _defaultAdmin);
	}

	/// =========================
	/// ======= Getters =========
	/// =========================

	/// @notice Check if an address has admin role
	/// @param _admin Address to check
	/// @return bool True if address has admin role
	function isAdmin(address _admin) external view returns (bool) {
		return hasRole(ADMIN_ROLE, _admin);
	}

	/// @notice Check if an address has user role
	/// @param _user Address to check
	/// @return bool True if address has user role
	function isUser(address _user) external view returns (bool) {
		return hasRole(USER_ROLE, _user);
	}

	/// =========================
	/// ======= Setters =========
	/// =========================

	/// @notice Add admin role to an address
	/// @param _admin Address to grant admin role
	function addAdmin(address _admin) external onlyRole(DEFAULT_ADMIN_ROLE) {
		if (_isZeroAddress(_admin)) revert INVALID_ADDRESS();
		_grantRole(ADMIN_ROLE, _admin);
	}

	/// @notice Add user role to an address
	/// @param _user Address to grant user role
	function addUser(address _user) external onlyRole(ADMIN_ROLE) {
		if (_isZeroAddress(_user)) revert INVALID_ADDRESS();
		_grantRole(USER_ROLE, _user);
	}

	/// @notice Remove admin role from an address
	/// @param _admin Address to revoke admin role
	function removeAdmin(address _admin) external onlyRole(DEFAULT_ADMIN_ROLE) {
		if (_isZeroAddress(_admin)) revert INVALID_ADDRESS();
		_revokeRole(ADMIN_ROLE, _admin);
	}

	/// @notice Remove user role from an address
	/// @param _user Address to revoke user role
	function removeUser(address _user) external onlyRole(ADMIN_ROLE) {
		if (_isZeroAddress(_user)) revert INVALID_ADDRESS();
		_revokeRole(USER_ROLE, _user);
	}
}
