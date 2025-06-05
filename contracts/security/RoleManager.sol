// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from '@openzeppelin/contracts/access/AccessControl.sol';

contract RoleManager is AccessControl {
	error ZERO_ADDRESS();

	bytes32 public constant USER_ROLE = keccak256('USER_ROLE');

	constructor(address defaultAdmin) {
		if (defaultAdmin == address(0)) revert ZERO_ADDRESS();

		_grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
	}
}
