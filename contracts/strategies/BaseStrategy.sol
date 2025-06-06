// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from 'solady/src/tokens/ERC20.sol';
import {IInhabit} from '../core/interfaces/IInhabit.sol';

import {Transfer} from '../core/libraries/Transfer.sol';
import {Native} from '../core/libraries/Native.sol';
import {Errors} from '../core/libraries/Errors.sol';

abstract contract BaseStrategy is Errors, Native, Transfer {
	/// =========================
	/// === Storage Variables ===
	/// =========================

	IInhabit public inhabit;
	uint256 public collectionId;

	/// =========================
	/// ====== Modifiers ========
	/// =========================

	modifier onlyInhabit() {
		_checkOnlyInhabit();
		_;
	}

	modifier onlyInitialized() {
		_checkOnlyInitialized();
		_;
	}

	/// =========================
	/// ====== Constructor ======
	/// =========================

	constructor() {}

	/// =========================
	/// ====== Initializer ======
	/// =========================

	function __BaseStrategy_init(
		uint256 _collectionId,
		address _inhabit
	) internal virtual onlyInhabit {
		_isZeroAddress(_inhabit);

		// check if collection ID is not initialized already, if it is, revert
		if (collectionId != 0) revert ALREADY_INITIALIZED_STRATEGY();

		// check if collection ID is valid and not zero (0), if it is, revert
		if (_collectionId == 0) revert INVALID();

		collectionId = _collectionId;
		inhabit = IInhabit(_inhabit);
	}

	/// =========================
	/// ==== View Functions =====
	/// =========================

	function getInhabit() external view virtual returns (address) {
		return address(inhabit);
	}

	function getCollectionId() external view virtual returns (uint256) {
		return collectionId;
	}

	function recoverFunds(address _token, address _to) external onlyInhabit {
		_isZeroAddress(_to);

		uint256 amount = _token == NATIVE
			? address(this).balance
			: ERC20(_token).balanceOf(address(this));

		_transferAmount(_token, _to, amount);
	}

	/// =========================
	/// == Internal Functions ===
	/// =========================

	function _checkOnlyInitialized() internal view {
		if (collectionId == 0) revert NOT_INITIALIZED();
	}

	function _checkOnlyInhabit() internal view {
		if (msg.sender != address(inhabit)) revert UNAUTHORIZED();
	}

	/// =========================
	/// ======== Hooks ==========
	/// =========================

	receive() external payable {}
}
