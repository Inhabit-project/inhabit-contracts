// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from '@openzeppelin/contracts/access/AccessControl.sol';
import {Errors} from './libraries/Errors.sol';

contract RoleManager is AccessControl, Errors {
	bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');
	bytes32 public constant USER_ROLE = keccak256('USER_ROLE');

	constructor(address _defaultAdmin) {
		_isZeroAddress(_defaultAdmin);
		_grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
	}
}
