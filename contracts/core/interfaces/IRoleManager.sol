// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IRoleManager {
	function hasRole(bytes32 role, address account) external view returns (bool);

	function DEFAULT_ADMIN_ROLE() external view returns (bytes32);

	function USER_ROLE() external view returns (bytes32);

	function grantRole(bytes32 role, address account) external;

	function revokeRole(bytes32 role, address account) external;
}
