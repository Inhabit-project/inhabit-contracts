// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControlUpgradeable} from '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import {Initializable} from '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

contract RoleManager is Initializable, AccessControlUpgradeable {
	bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');
	bytes32 public constant USER_ROLE = keccak256('USER_ROLE');

	/// @custom:oz-upgrades-unsafe-allow constructor

	constructor() {
		_disableInitializers();
	}

	function initialize(address _defaultAdmin) public initializer {
		__AccessControl_init();

		_grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
		_grantRole(ADMIN_ROLE, _defaultAdmin);
	}
}
