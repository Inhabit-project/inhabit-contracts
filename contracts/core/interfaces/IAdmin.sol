// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAdmin {
	/// =========================
	/// ======== Getters ========
	/// =========================

	function isAdmin(address _admin) external view returns (bool);

	function isUser(address _user) external view returns (bool);

	/// =========================
	/// ======== Setters ========
	/// =========================

	function addAdmin(address _admin) external;

	function addUser(address _user) external;

	function removeAdmin(address _admin) external;

	function removeUser(address _user) external;
}
