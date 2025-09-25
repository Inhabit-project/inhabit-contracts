// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// third party
/// chainlink
import {AggregatorV3Interface} from '@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol';

interface IPriceFeed {
	/// =========================
	/// ======== Events =========
	/// =========================

	event AggregatorAdded(address indexed token, address indexed aggregator);

	event AggregatorRemoved(address indexed token, address indexed aggregator);

	event PriceSet(address indexed token, uint256 price);

	event UsdTokenSet(address indexed token);

	event AggregatorSet(address indexed token, address indexed aggregator);

	/// =========================
	/// ======= Getters =========
	/// =========================

	function getAggregator(
		address _aggregator
	) external view returns (AggregatorV3Interface);

	function getUsdToken() external view returns (address);

	/// =========================
	/// ==== View Functions =====
	/// =========================

	function calculateUsdTokenPriceInPaymentToken(
		address _paymentToken,
		uint256 _nftPriceInUsdToken
	) external view returns (uint256 priceInPaymentToken);
}
