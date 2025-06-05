// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IGroups {
	/// =========================
	/// ======== Structs ========
	/// =========================

	struct Group {
		string referral;
		bool state;
		Embassador[] embassadors;
	}

	struct Embassador {
		address account;
		uint256 fee;
	}

	/// =========================
	/// ======== Events =========
	/// =========================

	event GroupAdded(
		string indexed referral,
		bool state,
		Embassador[] embassadors
	);

	event GroupStatusUpdated(string indexed referral, bool status);

	event EmbassadorsAdded(string indexed referral, Embassador[] embassadors);

	event EmbassadorsUpdated(string indexed referral, Embassador[] embassadors);

	event EmbassadorsRemoved(string indexed referral, address[] accounts);

	event Distributed(address indexed embassador, uint256 amount);

	/// =========================
	/// ===== View Functions ====
	/// =========================

	/**
	 * @dev Get group information by referral code
	 * @param _referral The referral code of the group
	 * @return Group struct containing group data
	 */
	function getGroup(
		string calldata _referral
	) external view returns (Group memory);

	/**
	 * @dev Calculate fee based on amount and percentage
	 * @param amount Total amount
	 * @param porcentaje Fee percentage in basis points
	 * @return fee Calculated fee amount
	 */
	function calculateFee(
		uint256 amount,
		uint256 porcentaje
	) external pure returns (uint256 fee);

	/**
	 * @dev Get total number of groups
	 * @return Total count of groups
	 */
	function groupCount() external view returns (uint256);

	/**
	 * @dev Get group referral by index
	 * @param index Group index
	 * @return Referral code
	 */
	function groupList(uint256 index) external view returns (string memory);

	/**
	 * @dev Get maximum percentage (basis points)
	 * @return Maximum percentage value
	 */
	function pncg() external view returns (uint256);

	/// =========================
	/// == External Functions ===
	/// =========================

	/**
	 * @dev Add a new group
	 * @param _referral Unique referral code for the group
	 * @param _state Initial state of the group (active/inactive)
	 * @param _embassadors Array of embassadors with their fees
	 */
	function addGroup(
		string calldata _referral,
		bool _state,
		Embassador[] memory _embassadors
	) external;

	/**
	 * @dev Update group status
	 * @param _referral Referral code of the group
	 * @param _status New status for the group
	 */
	function updateGroupStatus(string calldata _referral, bool _status) external;

	/**
	 * @dev Add embassadors to an existing group
	 * @param _referal Referral code of the group
	 * @param _embassadors Array of embassadors to add
	 */
	function addEmbassadors(
		string calldata _referal,
		Embassador[] calldata _embassadors
	) external;

	/**
	 * @dev Update existing embassadors' fees
	 * @param _referral Referral code of the group
	 * @param _embassadors Array of embassadors with updated fees
	 */
	function updateEmbassadors(
		string calldata _referral,
		Embassador[] calldata _embassadors
	) external;

	/**
	 * @dev Remove embassadors from a group
	 * @param _referral Referral code of the group
	 * @param _accounts Array of embassador addresses to remove
	 */
	function removeEmbassadors(
		string calldata _referral,
		address[] calldata _accounts
	) external;
}
