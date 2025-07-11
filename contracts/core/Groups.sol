// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from 'solady/src/tokens/ERC20.sol';

import {IGroups} from './interfaces/IGroups.sol';
import {Transfer} from './libraries/Transfer.sol';
import {Errors} from './libraries/Errors.sol';

import 'hardhat/console.sol';

/**
 * @title Groups Contract
 * @author [salviega]
 * @notice Manages ambassador groups and referral-based commission distribution.
 * @dev Allows creation, update, and distribution of funds among ambassadors based on predefined fee percentages.
 * Supports ERC20 tokens and native ETH as payment assets.
 */

abstract contract Groups is Transfer, Errors, IGroups {
	/// =========================
	/// === Storage Variables ===
	/// =========================

	uint256 private groupCount;

	mapping(bytes32 referral => bool) private referrals;

	mapping(uint256 groupId => Group) private groups;

	mapping(uint256 campaignId => mapping(bytes32 referral => bool))
		internal campaignReferrals;

	/// =========================
	/// ====== Modifiers ========
	/// =========================

	modifier ifGroupExists(uint256 _groupId) {
		_checkIfGroupExists(_groupId);
		_;
	}

	modifier ifAreValidAmbassadors(Ambassador[] memory _ambassadors) {
		_checkAreValidAmbassadors(_ambassadors);
		_;
	}

	modifier ifIsValidReferral(string calldata _referral) {
		_checkIfIsValidReferral(_referral);
		_;
	}

	/// =========================
	/// ====== Initializer ======
	/// =========================

	function __Groups_init() internal {}

	/// =========================
	/// ======= Getters =========
	/// =========================

	function getGroupCount() external view returns (uint256) {
		return groupCount;
	}

	function getGroup(uint256 _id) external view returns (Group memory) {
		return groups[_id];
	}

	function getGroups() external view returns (Group[] memory groupList) {
		groupList = new Group[](groupCount);
		for (uint256 i = 1; i <= groupCount; ) {
			groupList[i - 1] = groups[i];

			unchecked {
				++i;
			}
		}

		return groupList;
	}

	function isReferralSupported(bytes32 _referral) public view returns (bool) {
		return referrals[_referral];
	}

	function isCampaignReferralSupported(
		uint256 _campaignId,
		bytes32 _referral
	) public view returns (bool) {
		return campaignReferrals[_campaignId][_referral];
	}

	/// =========================
	/// ======= Setters =========
	/// =========================

	function _setCampaignReferral(
		uint256 _campaignId,
		bytes32 _referral
	) internal {
		bool status = campaignReferrals[_campaignId][_referral];
		campaignReferrals[_campaignId][_referral] = !status;

		emit CampaignReferralSet(_campaignId, _referral, !status);
	}

	function _setGroupReferral(
		uint256 _campaignId,
		uint256 _groupId,
		string calldata _referral
	) internal ifGroupExists(_groupId) ifIsValidReferral(_referral) {
		Group storage group = groups[_groupId];
		bytes32 referralEncrypted = _encryptReferral(_referral);
		if (group.referral == referralEncrypted) revert INVALID_REFERRAL();

		referrals[group.referral] = false;
		campaignReferrals[_campaignId][group.referral] = false;

		group.referral = referralEncrypted;

		referrals[group.referral] = true;
		campaignReferrals[_campaignId][group.referral] = true;

		emit GroupReferralSet(_campaignId, _groupId, referralEncrypted);
	}

	function _setGroupStatus(
		uint256 _campaignId,
		uint256 _groupId,
		bool _status
	) internal ifGroupExists(_groupId) {
		Group storage group = groups[_groupId];
		if (group.state == _status) revert SAME_STATE();

		group.state = _status;
		emit GroupStatusSet(_campaignId, _groupId, _status);
	}

	function _setAmbassadors(
		uint256 _campaignId,
		uint256 _groupId,
		Ambassador[] calldata _ambassadors
	) internal ifGroupExists(_groupId) ifAreValidAmbassadors(_ambassadors) {
		Group storage group = groups[_groupId];
		for (uint256 i; i < _ambassadors.length; ) {
			bool found = false;
			for (uint256 j; j < group.ambassadors.length; ) {
				if (group.ambassadors[j].account == _ambassadors[i].account) {
					group.ambassadors[j] = _ambassadors[i];
					found = true;
					break;
				}

				unchecked {
					++j;
				}
			}

			if (!found) revert AMBASSADOR_NOT_FOUND();
			emit AmbassadorSet(_campaignId, _groupId, _ambassadors[i]);

			unchecked {
				++i;
			}
		}
	}

	function _addAmbassadors(
		uint256 _campaignId,
		uint256 _groupId,
		Ambassador[] calldata _ambassadors
	) internal ifGroupExists(_groupId) ifAreValidAmbassadors(_ambassadors) {
		Group storage group = groups[_groupId];
		for (uint256 i; i < _ambassadors.length; ) {
			bool found = false;
			for (uint256 j; j < group.ambassadors.length; ) {
				if (group.ambassadors[j].account == _ambassadors[i].account) {
					found = true;
					break;
				}

				unchecked {
					++j;
				}
			}

			if (found) revert AMBASSADOR_ALREADY_EXISTS();

			group.ambassadors.push(_ambassadors[i]);
			emit AmbassadorAdded(_campaignId, _groupId, _ambassadors[i]);

			unchecked {
				++i;
			}
		}
	}

	function _removeAmbassadors(
		uint256 _campaignId,
		uint256 _groupId,
		Ambassador[] calldata _ambassadors
	) internal ifGroupExists(_groupId) ifAreValidAmbassadors(_ambassadors) {
		Group storage group = groups[_groupId];
		for (uint256 i; i < _ambassadors.length; ) {
			bool found = false;
			for (uint256 j; j < group.ambassadors.length; ) {
				if (group.ambassadors[j].account == _ambassadors[i].account) {
					group.ambassadors[j] = group.ambassadors[
						group.ambassadors.length - 1
					];
					group.ambassadors.pop();
					found = true;
					break;
				}

				unchecked {
					++j;
				}
			}

			if (!found) revert AMBASSADOR_NOT_FOUND();
			emit AmbassadorRemoved(_campaignId, _groupId, _ambassadors[i].account);

			unchecked {
				++i;
			}
		}
	}

	/// =========================
	/// ==== View Functions =====
	/// =========================

	function calculateFee(
		uint256 _amount,
		uint256 _porcentaje
	) external pure returns (uint256 fee) {
		return (_amount * _porcentaje) / 10000;
	}

	function encriptReferral(
		string calldata _referral
	) external pure returns (bytes32) {
		return keccak256(abi.encodePacked(_referral));
	}

	function activeBalance(address _token) external view returns (uint256) {
		return
			_token == NATIVE
				? address(this).balance
				: ERC20(_token).balanceOf(address(this));
	}

	/// =========================
	/// == Internal Functions ===
	/// =========================

	function _createGroup(
		uint256 _campaignId,
		GroupParams calldata _params
	)
		internal
		ifIsValidReferral(_params.referral)
		ifAreValidAmbassadors(_params.ambassadors)
	{
		bytes32 referralEncrypted = _encryptReferral(_params.referral);

		Group storage newGroup = groups[++groupCount];
		newGroup.referral = referralEncrypted;
		newGroup.state = _params.state;

		for (uint256 i = 0; i < _params.ambassadors.length; i++) {
			newGroup.ambassadors.push(_params.ambassadors[i]);
		}

		referrals[referralEncrypted] = true;
		campaignReferrals[_campaignId][referralEncrypted] = true;

		emit GroupCreated(
			_campaignId,
			newGroup.referral,
			newGroup.state,
			newGroup.ambassadors
		);
	}

	function _distribution(
		uint256 _campaignId,
		uint256 _groupId,
		address _token,
		uint256 _amount
	) internal returns (uint256) {
		if (!_isGroup(_groupId)) return 0;

		Group memory group = groups[_groupId];
		if (!_isCampaignReferralSupported(_campaignId, group.referral)) return 0;
		if (group.ambassadors.length == 0) return 0;
		if (group.state == false) return 0;
		if (_amount == 0) return 0;

		uint256 totalFee = 0;
		for (uint256 i; i < group.ambassadors.length; ) {
			uint256 fee = _calculateFee(_amount, group.ambassadors[i].fee);

			totalFee += fee;
			_transferAmount(_token, group.ambassadors[i].account, fee);

			unchecked {
				++i;
			}
		}

		return totalFee;
	}

	function _recoverFunds(address _token, address _to) internal {
		uint256 amount = _token == NATIVE
			? address(this).balance
			: ERC20(_token).balanceOf(address(this));

		_transferAmount(_token, _to, amount);
	}

	/// =========================
	/// === Private Functions ===
	/// =========================

	function _calculateFee(
		uint256 _amount,
		uint256 _porcentaje
	) private pure returns (uint256 fee) {
		return (_amount * _porcentaje) / 10000;
	}

	function _encryptReferral(
		string calldata _referral
	) private pure returns (bytes32) {
		return keccak256(abi.encodePacked(_referral));
	}

	function _isReferralSupported(bytes32 _referral) private view returns (bool) {
		return referrals[_referral];
	}

	function _isCampaignReferralSupported(
		uint256 _campaignId,
		bytes32 _referral
	) private view returns (bool) {
		return campaignReferrals[_campaignId][_referral];
	}

	function _isGroup(uint256 _id) private view returns (bool) {
		return _id > 0 && _id <= groupCount ? true : false;
	}

	function _areAmbassadors(
		Ambassador[] memory _ambassadors
	) private pure returns (bool) {
		if (_ambassadors.length == 0) return false;

		uint256 totalFee = 0;
		for (uint256 i; i < _ambassadors.length; ) {
			if (_isZeroAddress(_ambassadors[i].account)) return false;
			totalFee += _ambassadors[i].fee;

			unchecked {
				++i;
			}
		}

		return totalFee > 10000 ? false : true;
	}

	function _ifIsValidReferral(
		string calldata _referral
	) internal view returns (bool) {
		bytes32 referralEncrypted = _encryptReferral(_referral);
		if (referralEncrypted == bytes32(0)) return false;
		if (_isReferralSupported(referralEncrypted)) return false;

		return true;
	}

	function _checkIfGroupExists(uint256 _groupId) private view {
		if (!_isGroup(_groupId)) revert GROUP_NOT_FOUND();
	}

	function _checkAreValidAmbassadors(
		Ambassador[] memory _ambassadors
	) private pure {
		if (_areAmbassadors(_ambassadors) == false) revert INVALID_AMBASSADORS();
	}

	function _checkIfIsValidReferral(string calldata _referral) private view {
		if (!_ifIsValidReferral(_referral)) revert INVALID_REFERRAL();
	}
}
