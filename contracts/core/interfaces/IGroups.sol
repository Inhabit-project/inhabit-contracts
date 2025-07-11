// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IGroups Interface
 * @dev Interface for the Groups contract that manages ambassador groups and commission distribution
 */
interface IGroups {
	/// =========================
	/// ======== Structs ========
	/// =========================

	struct Ambassador {
		address account;
		uint256 fee;
	}

	struct Group {
		bytes32 referral;
		Ambassador[] ambassadors;
		bool state;
	}

	struct GroupParams {
		string referral;
		Ambassador[] ambassadors;
		bool state;
	}

	/// =========================
	/// ======== Events =========
	/// =========================

	event TokenAdded(address token);
	event TokenRemoved(address token);

	event GroupCreated(
		uint256 indexed campaignId,
		bytes32 referral,
		bool state,
		Ambassador[] ambassadors
	);

	event GroupReferralSet(
		uint256 indexed campaignId,
		uint256 indexed groupId,
		bytes32 referral
	);

	event GroupStatusSet(
		uint256 indexed campaignId,
		uint256 indexed groupId,
		bool status
	);

	event AmbassadorSet(
		uint256 indexed campaignId,
		uint256 indexed groupId,
		Ambassador ambassador
	);

	event AmbassadorAdded(
		uint256 indexed campaignId,
		uint256 indexed groupId,
		Ambassador ambassador
	);

	event AmbassadorRemoved(
		uint256 indexed campaignId,
		uint256 indexed groupId,
		address ambassador
	);

	event Distributed(address indexed embassador, uint256 amount);

	event CampaignReferralSet(
		uint256 indexed campaignId,
		bytes32 indexed referral,
		bool isReferral
	);

	/// =========================
	/// ===== View Functions ====
	/// =========================

	function getGroup(uint256 _id) external view returns (Group memory);

	function getGroups() external view returns (Group[] memory);

	function isReferralSupported(bytes32 _referral) external view returns (bool);

	function isCampaignReferralSupported(
		uint256 _campaignId,
		bytes32 _referral
	) external view returns (bool);

	function calculateFee(
		uint256 _amount,
		uint256 _porcentaje
	) external pure returns (uint256 fee);

	function encriptReferral(
		string calldata _referral
	) external pure returns (bytes32);

	function activeBalance(address _token) external view returns (uint256);

	function getGroupCount() external view returns (uint256);
}
