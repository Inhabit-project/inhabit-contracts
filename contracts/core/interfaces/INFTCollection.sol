// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface INFTCollection {
	/// =========================
	/// ======== Structs ========
	/// =========================

	struct CollectionParams {
		uint256 id;
		string name;
		string symbol;
		string uri;
		uint256 supply;
		uint256 price;
		bool state;
	}

	/// =========================
	/// ======== Events =========
	/// =========================

	event BaseURIUpdated(string newBaseURI);
	event PriceUpdated(uint256 newPrice);
	event StateUpdated(bool newState);
	event SupplyUpdated(uint256 newSupply);
}
