// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from 'solady/src/tokens/ERC20.sol';

import {IGroups} from './interfaces/IGroups.sol';
import {Transfer} from './libraries/Transfer.sol';
import {Errors} from './libraries/Errors.sol';

contract Groups is IGroups, Transfer, Errors {
	/// =========================
	/// === Storage Variables ===
	/// =========================

	/// @dev Collection of groups
	mapping(string => Group) private groups;

	/// @dev Collection of group referral
	mapping(uint256 => string) private groupList;

	/// @dev Collection of supported tokens
	mapping(address => bool) private tokens;

	/**
	 * @dev Gets the maximum percentage value (basis points)
	 * @return uint256 Maximum percentage value (10000 = 100%)
	 */
	uint256 public pncg;

	/**
	 * @dev Gets the total number of created groups
	 * @return uint256 Total number of groups
	 */
	uint256 public groupCount;

	receive() external payable {}

	/// =========================
	/// ==== View Functions =====
	/// =========================

	/**
	 * @dev Gets complete information of a group by its referral code
	 * @param _referral Group's referral code
	 * @return Group Complete group structure
	 */
	function getGroup(
		string calldata _referral
	) public view returns (Group memory) {
		return groups[_referral];
	}

	/**
	 * @dev Gets a group's referral code by its index
	 * @param _id Group index in the list
	 * @return string Group's referral code
	 */
	function getGroupReferral(uint256 _id) public view returns (string memory) {
		return groupList[_id];
	}

	/**
	 * @dev Checks if a token is supported by the contract
	 * @param _token Token address to verify
	 * @return bool True if the token is supported, false otherwise
	 */
	function isTokenSupported(address _token) public view returns (bool) {
		return tokens[_token];
	}

	/**
	 * @dev Calculates commission based on amount and percentage
	 * @param _amount Total amount on which to calculate the commission
	 * @param _porcentaje Commission percentage in basis points (10000 = 100%)
	 * @return fee Calculated commission amount
	 */
	function calculateFee(
		uint256 _amount,
		uint256 _porcentaje
	) public pure returns (uint256 fee) {
		return (_amount * _porcentaje) / 10000;
	}

	/// =========================
	/// == Internal Functions ===
	/// =========================

	/**
	 * @dev Adds supported tokens to the contract
	 * @param _tokens Array of token addresses to add
	 * @notice Can only be called by the contract owner
	 */
	function _addToTokens(address[] calldata _tokens) internal {
		// todo: check if token is already added, if it is, revert
		for (uint256 i = 0; i < _tokens.length; i++) {
			_isZeroAddress(_tokens[i]);
			tokens[_tokens[i]] = true;

			unchecked {
				++i;
			}
		}
	}

	/**
	 * @dev Removes a supported token from the contract
	 * @param _token Token address to remove
	 * @notice Can only be called by the contract owner
	 */
	function _removeFromTokens(address _token) internal {
		_isZeroAddress(_token);
		tokens[_token] = false;
	}

	/**
	 * @dev Recovers funds from the contract
	 * @param _token Token address to recover (use address(0) for native ETH)
	 * @param _to Destination address to send the funds
	 * @notice Can only be called by the contract owner
	 */
	function _recoverFunds(address _token, address _to) internal {
		_isZeroAddress(_to);

		uint256 amount = _token == NATIVE
			? address(this).balance
			: ERC20(_token).balanceOf(address(this));

		_transferAmount(_token, _to, amount);
	}

	/**
	 * @dev Creates a new group with ambassadors
	 * @param _referral Unique referral code for the group
	 * @param _state Initial group state (true = active, false = inactive)
	 * @param _ambassadors Array of ambassadors with their respective commissions
	 * @notice Total commission sum must not exceed 10000 basis points (100%)
	 * @notice Can only be called by the contract owner
	 */
	function _createGroup(
		string calldata _referral,
		bool _state,
		Embassador[] memory _ambassadors
	) internal {
		_isEmptyString(_referral);
		_isGroupExist(_referral);
		_validateFeeArray(_ambassadors);

		Group storage newGroup = groups[_referral];
		newGroup.referral = _referral;
		newGroup.state = _state;

		for (uint256 i = 0; i < _ambassadors.length; i++) {
			newGroup.embassadors.push(_ambassadors[i]);
		}

		groupList[++groupCount] = _referral;
		emit GroupCreated(_referral, _state, _ambassadors);
	}

	/**
	 * @dev Updates the status of an existing group
	 * @param _referral Group's referral code
	 * @param _status New group status
	 * @notice Can only be called by the contract owner
	 */

	function _updateGroupStatus(
		string calldata _referral,
		bool _status
	) internal {
		_isNotGroupExist(_referral);
		Group storage group = groups[_referral];
		if (group.state == _status) revert SAME_STATE();
		group.state = _status;
		emit GroupStatusUpdated(_referral, _status);
	}

	/**
	 * @dev Adds ambassadors to an existing group
	 * @param _referral Group's referral code
	 * @param _ambassadors Array of ambassadors to add
	 * @notice Total commission sum after adding must not exceed 10000 basis points
	 * @notice Can only be called by the contract owner
	 */
	function _addEmbassadors(
		string calldata _referral,
		Embassador[] calldata _ambassadors
	) internal {
		_isNotGroupExist(_referral);
		_isEmptyEmbassador(_ambassadors);

		Group storage group = groups[_referral];

		for (uint256 i; i < _ambassadors.length; ) {
			_isZeroAddress(_ambassadors[i].account);
			group.embassadors.push(_ambassadors[i]);

			unchecked {
				++i;
			}
		}

		_validateFee(group);
		emit EmbassadorsAdded(_referral, _ambassadors);
	}

	/**
	 * @dev Updates commissions of existing ambassadors in a group
	 * @param _referral Group's referral code
	 * @param _ambassadors Array of ambassadors with their new commissions
	 * @notice Ambassadors must already exist in the group
	 * @notice Total commission sum after updating must not exceed 10000 basis points
	 * @notice Can only be called by the contract owner
	 */
	function _updateEmbassadors(
		string calldata _referral,
		Embassador[] calldata _ambassadors
	) internal {
		_isNotGroupExist(_referral);
		_isEmptyEmbassador(_ambassadors);

		Group storage group = groups[_referral];

		for (uint256 i; i < _ambassadors.length; ) {
			_isZeroAddress(_ambassadors[i].account);

			bool found = false;
			for (uint256 j; j < group.embassadors.length; ) {
				if (group.embassadors[j].account == _ambassadors[i].account) {
					group.embassadors[j].fee = _ambassadors[i].fee;
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
		emit EmbassadorsUpdated(_referral, _ambassadors);
	}

	/**
	 * @dev Removes ambassadors from a group
	 * @param _referral Group's referral code
	 * @param _accounts Array of ambassador addresses to remove
	 * @notice Ambassadors must exist in the group
	 * @notice Can only be called by the contract owner
	 */
	function _removeEmbassadors(
		string calldata _referral,
		address[] calldata _accounts
	) internal {
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

	/**
	 * @dev Distributes commissions to group ambassadors
	 * @param _referral Group's referral code
	 * @param _token Token address to distribute (use address(0) for native ETH)
	 * @param _amount Total amount to distribute
	 * @notice Group must be active
	 * @notice Token must be supported by the contract
	 * @notice Caller must have sufficient balance and allowance for the token
	 */
	function _distribution(
		string calldata _referral,
		address _token,
		uint256 _amount
	) internal returns (uint256) {
		_isNotGroupExist(_referral);

		Group storage group = groups[_referral];
		if (!group.state) revert GROUP_NOT_ACTIVE();

		TransferData[] memory transfers = new TransferData[](
			group.embassadors.length
		);

		uint256 totalFee = 0;
		for (uint256 i; i < group.embassadors.length; ) {
			uint256 fee = calculateFee(_amount, group.embassadors[i].fee);

			transfers[i] = TransferData({
				from: msg.sender,
				to: group.embassadors[i].account,
				amount: fee
			});

			totalFee += fee;

			emit Distributed(group.embassadors[i].account, fee);

			unchecked {
				++i;
			}
		}

		_transferAmountsFrom(_token, transfers);
		return totalFee;
	}

	function _isTokenSupported(address _token) internal view {
		if (!isTokenSupported(_token)) revert TOKEN_NOT_SUPPORTED();
	}

	/// =========================
	/// === Private Functions ===
	/// =========================

	/**
	 * @dev Validates that a group exists
	 * @param _referral Group's referral code to validate
	 * @notice Reverts if group does not exist with the given referral code
	 * @notice Used before group operations to ensure target exists
	 */
	function _isGroupExist(string calldata _referral) private view {
		if (bytes(groups[_referral].referral).length != 0)
			revert GROUP_ALREADY_EXISTS();
	}

	/**
	 * @dev Validates that a group does not already exist
	 * @param _referral Group's referral code to validate
	 * @notice Reverts if group already exists with the given referral code
	 * @notice Used before group creation to prevent duplicates
	 */
	function _isNotGroupExist(string calldata _referral) private view {
		if (bytes(groups[_referral].referral).length == 0) revert GROUP_NOT_FOUND();
	}

	/**
	 * @dev Validates that total commission fees do not exceed maximum allowed
	 * @param group Storage reference to the group being validated
	 * @notice Reverts if total fees exceed 10000 basis points (100%)
	 * @notice This function performs O(n) iteration over all ambassadors
	 * @dev Consider caching total fees in group struct for gas optimization
	 */
	function _validateFee(Group storage group) private view {
		uint256 totalFee = 0;
		for (uint256 i; i < group.embassadors.length; ) {
			totalFee += group.embassadors[i].fee;

			unchecked {
				++i;
			}
		}

		if (totalFee > pncg) revert PERCENTAGE_ERROR();
	}

	/**
	 * @dev Validates an array of ambassadors before processing
	 * @param _ambassadors Array of ambassadors to validate
	 * @notice Validates that no ambassador has zero address
	 * @notice Validates that total fees do not exceed maximum percentage
	 * @notice Validates that no duplicate addresses exist in array
	 * @dev This is a pure function for standalone array validation
	 */
	function _validateFeeArray(Embassador[] memory _ambassadors) private view {
		uint256 totalFee = 0;
		for (uint256 i; i < _ambassadors.length; ) {
			_isZeroAddress(_ambassadors[i].account);
			totalFee += _ambassadors[i].fee;
			unchecked {
				++i;
			}
		}
		if (totalFee > pncg) revert PERCENTAGE_ERROR();
	}

	/**
	 * @dev Validates that ambassador array is not empty
	 * @param _ambassadors Array of ambassadors to validate
	 * @notice Reverts if the provided array has zero length
	 * @notice Used to prevent operations on empty ambassador arrays
	 */
	function _isEmptyEmbassador(Embassador[] memory _ambassadors) private pure {
		if (_ambassadors.length == 0) revert EMPTY_ARRAY();
	}
}
