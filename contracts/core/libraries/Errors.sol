// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Errors {
	/// ======================
	/// ====== Generic =======
	/// ======================

	error EMPTY_STRING();
	error EMPTY_ARRAY();
	error INVALID_INDEX();
	error INVALID_PRICE();
	error INVALID_SUPPLY();
	error NOT_INITIALIZED();
	error SAME_STATE();
	error UNAUTHORIZED();
	error ZERO_ADDRESS();

	function _isEmptyArray(bytes memory _array) internal pure {
		if (_array.length == 0) revert EMPTY_ARRAY();
	}

	function _isEmptyString(string memory _str) internal pure {
		if (bytes(_str).length == 0) revert EMPTY_STRING();
	}

	function _isZeroAddress(address _addr) internal pure {
		if (_addr == address(0)) revert ZERO_ADDRESS();
	}

	/// ======================
	/// === NFTCollection ====
	/// ======================

	error COLLECTION_NOT_ACTIVE();

	/// ======================
	/// ======= Groups =======
	/// ======================

	error EMBASSADOR_NOT_FOUND();
	error GROUP_ALREADY_EXISTS();
	error GROUP_NOT_FOUND();
	error GROUP_NOT_ACTIVE();

	/// ======================
	/// ==== Collections =====
	/// ======================

	error CAMPAIGN_NOT_ACTIVE();
	error INVALID_CAMPAIGN_ID();
}
