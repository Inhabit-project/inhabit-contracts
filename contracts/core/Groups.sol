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

	mapping(uint256 campaignId => mapping(bytes32 referral => Group))
		private campaignGroups;

	/// =========================
	/// ====== Modifiers ========
	/// =========================

	modifier ifAreValidAmbassadors(Ambassador[] memory _ambassadors) {
		_checkAreValidAmbassadors(_ambassadors);
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

	function getGroup(
		uint256 _campaignId,
		bytes32 _referral
	) external view returns (Group memory) {
		Group storage group = campaignGroups[_campaignId][_referral];
		return group;
	}

	/// =========================
	/// ======= Setters =========
	/// =========================

	function _setGroupReferral(uint256 _campaignId, bytes32 _referral) internal {
		Group storage group = campaignGroups[_campaignId][_referral];
		if (group.id == 0) revert GROUP_NOT_FOUND();

		group.referral = _referral;
		emit GroupReferralSet(_campaignId, group.id, _referral);
	}

	function _setGroupStatus(
		uint256 _campaignId,
		bytes32 _referral,
		bool _status
	) internal {
		Group storage group = campaignGroups[_campaignId][_referral];
		if (group.id == 0) revert GROUP_NOT_FOUND();

		group.state = _status;
		emit GroupStatusSet(_campaignId, group.id, _status);
	}

	function _setAmbassadors(
		uint256 _campaignId,
		bytes32 _referral,
		Ambassador[] calldata _ambassadors
	) internal ifAreValidAmbassadors(_ambassadors) {
		Group storage group = campaignGroups[_campaignId][_referral];
		if (group.id == 0) revert GROUP_NOT_FOUND();

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
			emit AmbassadorSet(
				_campaignId,
				group.id,
				_ambassadors[i].account,
				_ambassadors[i].fee
			);
		}
	}

	function _addAmbassadors(
		uint256 _campaignId,
		bytes32 _referral,
		Ambassador[] calldata _ambassadors
	) internal ifAreValidAmbassadors(_ambassadors) {
		Group storage group = campaignGroups[_campaignId][_referral];
		if (group.id == 0) revert GROUP_NOT_FOUND();

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
			emit AmbassadorAdded(
				_campaignId,
				group.id,
				_ambassadors[i].account,
				_ambassadors[i].fee
			);

			unchecked {
				++i;
			}
		}
	}

	function _removeAmbassadors(
		uint256 _campaignId,
		bytes32 _referral,
		Ambassador[] calldata _ambassadors
	) internal ifAreValidAmbassadors(_ambassadors) {
		Group storage group = campaignGroups[_campaignId][_referral];
		if (group.id == 0) revert GROUP_NOT_FOUND();

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
			emit AmbassadorRemoved(_campaignId, group.id, _ambassadors[i].account);

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
	) internal ifAreValidAmbassadors(_params.ambassadors) {
		bytes32 referralEncrypted = _encryptReferral(_params.referral);
		if (referralEncrypted == bytes32(0)) revert INVALID_REFERRAL();

		Group storage newGroup = campaignGroups[_campaignId][referralEncrypted];
		newGroup.id = ++groupCount;
		newGroup.referral = referralEncrypted;
		newGroup.state = _params.state;

		for (uint256 i = 0; i < _params.ambassadors.length; i++) {
			newGroup.ambassadors.push(_params.ambassadors[i]);
		}

		emit GroupCreated(
			_campaignId,
			newGroup.id,
			newGroup.referral,
			newGroup.state,
			newGroup.ambassadors
		);
	}

	function _distribution(
		uint256 _campaignId,
		bytes32 _referral,
		address _token,
		uint256 _amount
	) internal returns (uint256) {
		Group storage group = campaignGroups[_campaignId][_referral];
		if (group.id == 0) return 0;
		if (group.state == false) return 0;
		if (group.ambassadors.length == 0) return 0;

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

	function _checkAreValidAmbassadors(
		Ambassador[] memory _ambassadors
	) private pure {
		if (!_areAmbassadors(_ambassadors)) revert INVALID_AMBASSADORS();
	}
}
