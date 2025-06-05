// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {RoleManager} from './RoleManager.sol';
import {Transfer} from './libraries/Transfer.sol';
import {Erros} from './libraries/Errors.sol';

contract Groups is RoleManager, Transfer, Errors {
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
	/// === Storage Variables ===
	/// =========================

	mapping(string => Group) public groups;
	mapping(uint256 => string) public groupList;

	uint256 public immutable pncg = 10000; // 100% in basis points
	uint256 public groupCount = 0;

	/// =========================
	/// ======== Events =========
	/// =========================

	event GroupCreated(
		string indexed referral,
		bool state,
		Embassador[] embassadors
	);

	event GroupStatusUpdated(string indexed referral, bool status);

	event EmbassadorsAdded(string indexed referral, Embassador[] embassadors);

	event EmbassadorsUpdated(string indexed referral, Embassador[] embassadors);

	event EmbassadorsRemoved(string indexed referral, address[] accounts);

	event Distributed(address indexed embassador, uint256 amount);

	// =========================
	// ==== View Functions =====
	// =========================

	function getGroup(
		string calldata _referral
	) public view returns (Group memory) {
		return groups[_referral];
	}

	function calculateFee(
		uint256 amount,
		uint256 porcentaje
	) public pure returns (uint256 fee) {
		return (amount * porcentaje) / 10000;
	}

	/// =================================
	/// == External / Public Functions ==
	/// =================================

	function Group(
		string calldata _referral,
		bool _state,
		Embassador[] memory _embassadors
	) external onlyRole(ADMIN_ROLE) {
		_isEmptyString(_referral);
		_isGroupExist(_referral);
		_validateFeeArray(_embassadors);

		groups[_referral] = Group({
			referral: _referral,
			state: _state,
			embassadors: _embassadors
		});

		groupList[++groupCount] = _referral;
		emit GroupCreated(_referral, _state, _embassadors);
	}

	function updateGroupStatus(
		string calldata _referral,
		bool _status
	) external onlyRole(ADMIN_ROLE) {
		_isNotGroupExist(_referral);

		Group storage group = groups[_referral];
		if (group.state == _status) revert SAME_STATE();

		group.state = _status;
		emit GroupStatusUpdated(_referral, _status);
	}

	function addEmbassadors(
		string calldata _referal,
		Embassador[] calldata _embassadors
	) external onlyRole(ADMIN_ROLE) {
		_isNotGroupExist(_referal);
		_isEmptyArray(_embassadors);

		Group storage group = groups[_referal];

		for (uint256 i; i < _embassadors.length; ) {
			_isZeroAddress(_embassadors[i].account);
			group.embassadors.push(_embassadors[i]);

			unchecked {
				++i;
			}
		}

		_validateFee(group);
		emit EmbassadorsAdded(_referal, _embassadors);
	}

	function updateEmbassadors(
		string calldata _referral,
		Embassador[] calldata _embassadors
	) external onlyRole(ADMIN_ROLE) {
		_isNotGroupExist(_referral);
		_isEmptyArray(_embassadors);

		Group storage group = groups[_referral];

		for (uint256 i; i < _embassadors.length; ) {
			_isZeroAddress(_embassadors[i].account);

			bool found = false;
			for (uint256 j; j < group.embassadors.length; ) {
				if (group.embassadors[j].account == _embassadors[i].account) {
					group.embassadors[j].fee = _embassadors[i].fee;
					found = true;
					break;
				}

				unchecked {
					++j;
				}
			}

			if (!found) revert EMBASSADOR_NOT_FOUND();

			unchecked {
				++i;
			}
		}

		_validateFee(group);
		emit EmbassadorsUpdated(_referral, _embassadors);
	}

	function removeEmbassadors(
		string calldata _referral,
		address[] calldata _accounts
	) external onlyRole(ADMIN_ROLE) {
		_isNotGroupExist(_referral);
		if (_accounts.length == 0) revert EMPTY_ARRAY();

		Group storage group = groups[_referral];

		for (uint256 i; i < _accounts.length; ) {
			if (_accounts[i] == address(0)) revert ZERO_ADDRESS();

			bool found = false;
			for (uint256 j; j < group.embassadors.length; ) {
				if (group.embassadors[j].account == _accounts[i]) {
					group.embassadors[j] = group.embassadors[
						group.embassadors.length - 1
					];
					group.embassadors.pop();
					found = true;
					break;
				}

				unchecked {
					++j;
				}
			}

			if (!found) revert EMBASSADOR_NOT_FOUND();

			unchecked {
				++i;
			}
		}

		emit EmbassadorsRemoved(_referral, _accounts);
	}

	/// =========================
	/// == Internal Functions ===
	/// =========================

	function _distribution(
		string calldata _referal,
		address _token,
		uint256 _amount
	) internal {
		_isNotGroupExist(_referal);

		Group storage group = groups[_referal];
		if (!group.state) revert GROUP_NOT_ACTIVE();

		TransferData[] memory transfers = new TransferData[](
			group.embassadors.length
		);

		for (uint256 i; i < group.embassadors.length; ) {
			uint256 fee = calculateFee(_amount, group.embassadors[i].fee);

			transfers[i] = TransferData({
				from: msg.sender,
				to: group.embassadors[i].account,
				amount: fee
			});

			emit Distributed(group.embassadors[i].account, fee);
			unchecked {
				++i;
			}
		}

		_transferAmountsFrom(_token, transfers);
	}

	function _isGroupExist(string calldata _referral) internal view {
		if (bytes(groups[_referral].referral).length != 0)
			revert GROUP_ALREADY_EXISTS();
	}

	function _isNotGroupExist(string calldata _referral) internal view {
		if (bytes(groups[_referral].referral).length == 0) revert GROUP_NOT_FOUND();
	}

	function _validateFee(Group storage group) internal view {
		uint256 totalFee = 0;
		for (uint256 i; i < group.embassadors.length; ) {
			totalFee += group.embassadors[i].fee;

			unchecked {
				++i;
			}
		}

		if (totalFee > pncg) revert PERCENTAGE_ERROR();
	}

	function _validateFeeArray(Embassador[] memory _embassadors) internal pure {
		uint256 totalFee = 0;
		for (uint256 i; i < _embassadors.length; ) {
			_isZeroAddress(_embassadors[i].account);
			totalFee += _embassadors[i].fee;
			unchecked {
				++i;
			}
		}
		if (totalFee > 10000) revert PERCENTAGE_ERROR();
	}
}
