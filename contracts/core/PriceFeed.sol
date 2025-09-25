// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// third party
/// chainlink
import {AggregatorV3Interface} from '@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol';
/// openZeppelin
import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';

// local
/// interfaces
import {IPriceFeed} from './interfaces/IPriceFeed.sol';
import {Errors} from './libraries/Errors.sol';

import 'hardhat/console.sol';

abstract contract PriceFeed is IPriceFeed, Errors {
	/// =========================
	/// === Storage Variables ===
	/// =========================

	address private usdToken;

	mapping(address token => AggregatorV3Interface aggregator)
		private aggregators;

	/// =========================
	/// ====== Initializer ======
	/// =========================

	function __PriceFeed_init() internal {}

	/// =========================
	/// ======= Getters =========
	/// =========================

	function getAggregator(
		address _aggregator
	) external view returns (AggregatorV3Interface) {
		return aggregators[_aggregator];
	}

	function getUsdToken() public view returns (address) {
		return usdToken;
	}

	/// =========================
	/// ======= Setters =========
	/// =========================

	function _addAggregator(
		address _token,
		AggregatorV3Interface _aggregator
	) internal {
		aggregators[_token] = _aggregator;
		emit AggregatorAdded(_token, address(_aggregator));
	}

	function _removeAggregator(address _token) internal {
		aggregators[_token] = AggregatorV3Interface(address(0));
		emit AggregatorRemoved(_token, address(0));
	}

	function _setUsdToken(address _usdToken) internal {
		if (_usdToken == usdToken || _isZeroAddress(_usdToken))
			revert INVALID_ADDRESS();
		usdToken = _usdToken;
		emit UsdTokenSet(_usdToken);
	}

	/// =========================
	/// ==== View Functions =====
	/// =========================

	function calculateUsdTokenPriceInPaymentToken(
		address _paymentToken,
		uint256 _nftPriceInUsdToken
	) external view returns (uint256 priceInPaymentToken) {
		if (_nftPriceInUsdToken == 0) revert INVALID_AMOUNT();

		uint256 paymentTokenPriceInUsdToken = getPriceInUsdToken(
			_paymentToken,
			10 ** ERC20(_paymentToken).decimals()
		);

		uint256 nftPriceInUsdToken = getPriceInUsdToken(
			usdToken,
			_nftPriceInUsdToken
		);

		priceInPaymentToken = _divCeil(
			nftPriceInUsdToken * (10 ** ERC20(_paymentToken).decimals()),
			paymentTokenPriceInUsdToken
		);
	}

	/// =========================
	/// == Internal Functions ===
	/// =========================

	function getTokenPriceInUSD(
		address _token,
		uint256 _amount
	) internal view returns (uint256 priceInUsd) {
		AggregatorV3Interface aggregator = aggregators[_token];

		if (address(aggregator) == address(0)) revert INVALID_AGGREGATOR();

		(, int256 price, , , ) = aggregator.latestRoundData();

		if (price <= 0) revert INVALID_AMOUNT();

		uint8 tokenDecimals = ERC20(_token).decimals();
		priceInUsd = (_amount * uint256(price)) / (10 ** tokenDecimals);
	}

	function getPriceInUsdToken(
		address _token,
		uint256 _amount
	) internal view returns (uint256 priceInUsdToken) {
		AggregatorV3Interface aggregator = aggregators[_token];

		if (address(aggregator) == address(0)) revert INVALID_AGGREGATOR();

		(, int256 price, , , ) = aggregator.latestRoundData();

		if (price <= 0) revert INVALID_AMOUNT();

		uint8 feedDecimals = aggregator.decimals();
		uint8 tokenDecimals = ERC20(_token).decimals();
		uint8 usdTokenDecimals = ERC20(usdToken).decimals();

		uint256 amountInUsd = (_amount * uint256(price)) / (10 ** tokenDecimals);
		priceInUsdToken = _toDecimals(amountInUsd, feedDecimals, usdTokenDecimals);
	}

	/// =========================
	/// === Private Functions ===
	/// =========================

	function _divCeil(uint256 a, uint256 b) private pure returns (uint256) {
		return (a + b - 1) / b;
	}

	function _toDecimals(
		uint256 amount,
		uint8 fromDecimals,
		uint8 toDecimals
	) private pure returns (uint256) {
		if (fromDecimals == toDecimals) return amount;
		return
			(fromDecimals > toDecimals)
				? amount / (10 ** (fromDecimals - toDecimals))
				: amount * (10 ** (toDecimals - fromDecimals));
	}
}
