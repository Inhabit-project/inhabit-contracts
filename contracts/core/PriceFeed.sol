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

contract PriceFeed is IPriceFeed, Errors {
	/// =========================
	/// === Storage Variables ===
	/// =========================

	address private usdToken;

	mapping(address token => AggregatorV3Interface aggregator)
		private aggregators;

	/// =========================
	/// ====== Constructor ======
	/// =========================

	constructor() {}

	/// =========================
	/// ======= Getters =========
	/// =========================

	function getAggregator(
		address _aggregator
	) public view returns (AggregatorV3Interface) {
		return aggregators[_aggregator];
	}

	function getUsdToken() public view returns (address) {
		return usdToken;
	}

	/// =========================
	/// ======= Setters =========
	/// =========================

	function setAggregator(
		address _token,
		AggregatorV3Interface _aggregator
	) external {
		aggregators[_token] = _aggregator;
	}

	function setUsdToken(address _usdToken) external {
		if (_usdToken == usdToken || _usdToken == address(0))
			revert INVALID_ADDRESS();

		usdToken = _usdToken;
	}

	/// =========================
	/// === Public Functions ====
	/// =========================

	function calculateTokenAmount(
		address _paymentToken,
		uint256 _price
	) external view returns (uint256 amountInToken) {
		uint256 amountInUsd = getPriceInUSD(usdToken, _price);

		uint8 tokenDecimals = ERC20(_paymentToken).decimals();

		uint256 usdPerPaymentToken = getPriceInUSD(
			_paymentToken,
			10 ** tokenDecimals
		);

		if (usdPerPaymentToken == 0) revert INVALID_AMOUNT();

		amountInToken = _divCeil(
			amountInUsd * (10 ** tokenDecimals),
			usdPerPaymentToken
		);
	}

	/// =========================
	/// == Internal Functions ===
	/// =========================

	function getPriceInUSD(
		address _token,
		uint256 _amount
	) internal view returns (uint256 amountInUsd) {
		AggregatorV3Interface aggregator = aggregators[_token];

		if (aggregator == AggregatorV3Interface(address(0)))
			revert INVALID_AGGREGATOR();

		int256 tokenPriceInUsd = _getLatestPrice(aggregator);
		uint8 decimals = ERC20(_token).decimals();

		amountInUsd = (_amount * uint256(tokenPriceInUsd)) / (10 ** decimals);
	}

	/// =========================
	/// === Private Functions ===
	/// =========================

	function _divCeil(uint256 a, uint256 b) private pure returns (uint256) {
		return (a + b - 1) / b;
	}

	function _getLatestPrice(
		AggregatorV3Interface _aggregator
	) private view returns (int256) {
		(, int256 price, , , ) = _aggregator.latestRoundData();
		return price;
	}
}
