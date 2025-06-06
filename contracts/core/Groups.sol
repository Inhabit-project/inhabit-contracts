// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from 'solady/src/tokens/ERC20.sol';

import {Transfer} from './libraries/Transfer.sol';
import {Errors} from './libraries/Errors.sol';

contract Groups is Transfer, Errors {
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
	mapping(address => bool) private tokens;

	uint256 public immutable pncg = 10000;
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

	/// =========================
	/// ==== View Functions =====
	/// =========================

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

	// Funciones públicas/externas sin modificadores de rol
	// Los modificadores de rol se aplicarán en Inhabit

	function createGroup(
		string calldata _referral,
		bool _state,
		Embassador[] memory _embassadors
	) external {
		_isEmptyString(_referral);
		_isGroupExist(_referral);
		_validateFeeArray(_embassadors);

		Group storage newGroup = groups[_referral];
		newGroup.referral = _referral;
		newGroup.state = _state;

		for (uint256 i = 0; i < _embassadors.length; i++) {
			newGroup.embassadors.push(_embassadors[i]);
		}

		groupList[++groupCount] = _referral;
		emit GroupCreated(_referral, _state, _embassadors);
	}

	function updateGroupStatus(string calldata _referral, bool _status) external {
		_isNotGroupExist(_referral);
		Group storage group = groups[_referral];
		if (group.state == _status) revert SAME_STATE();
		group.state = _status;
		emit GroupStatusUpdated(_referral, _status);
	}

	function removeFromTokens(address _token) external {
		_isZeroAddress(_token);
		tokens[_token] = false;
	}

	function recoverFunds(address _token, address _to) external {
		_isZeroAddress(_to);

		uint256 amount = _token == NATIVE
			? address(this).balance
			: ERC20(_token).balanceOf(address(this));

		_transferAmount(_token, _to, amount);
	}

	function addToTokens(address[] calldata _tokens) external {
		// todo: check if token is already added, if it is, revert
		for (uint256 i = 0; i < _tokens.length; i++) {
			_isZeroAddress(_tokens[i]);
			tokens[_tokens[i]] = true;

			unchecked {
				++i;
			}
		}
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

	function _validateFeeArray(Embassador[] memory _embassadors) internal pure {
		if (_embassadors.length == 0) revert EMPTY_ARRAY();

		uint256 totalFee = 0;
		for (uint256 i = 0; i < _embassadors.length; ) {
			_isZeroAddress(_embassadors[i].account);
			totalFee += _embassadors[i].fee;
			unchecked {
				++i;
			}
		}
		if (totalFee > 10000) revert PERCENTAGE_ERROR();
	}

	receive() external payable {}
}
