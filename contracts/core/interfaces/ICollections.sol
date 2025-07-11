// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {INFTCollection} from '../interfaces/INFTCollection.sol';

interface ICollections {
	/// =========================
	/// ======== Structs ========
	/// =========================

	struct CollectionParams {
		string name;
		string symbol;
		string uri;
		uint256 supply;
		uint256 price;
		bool state;
	}

	struct Campaign {
		uint256 id;
		uint256 goal;
		uint256 fundsRaised;
		address owner;
		address[] collections;
		bool state;
	}

	/// =========================
	/// ======== Events =========
	/// =========================

	event CampaignCreated(
		address indexed creator,
		uint256 indexed campaignId,
		uint256 goal,
		bool state,
		address[] collections
	);

	event CampaignStatusUpdated(uint256 indexed campaignId, bool status);

	event CollectionCreated(
		address indexed owner,
		uint256 indexed campaignId,
		uint256 collectionId,
		address indexed collectionAddress,
		string name,
		string symbol,
		string uri,
		uint256 supply,
		uint256 price,
		bool state
	);

	event CollectionAdded(
		address indexed owner,
		uint256 indexed campaignId,
		uint256 collectionId,
		address indexed collectionAddress,
		string name,
		string symbol,
		string uri,
		uint256 supply,
		uint256 price,
		bool state
	);

	event CollectionBaseURIUpdated(
		uint256 indexed campaignId,
		address indexed collection,
		string baseURI
	);

	event CollectionPriceUpdated(
		uint256 indexed campaignId,
		address indexed collection,
		uint256 price
	);

	event CollectionStateUpdated(
		uint256 indexed campaignId,
		address indexed collection,
		bool state
	);

	event CollectionSupplyUpdated(
		uint256 indexed campaignId,
		address indexed collection,
		uint256 supply
	);

	event NftCollectionUpdated(address indexed collection);

	/// =========================
	/// ==== View Functions =====
	/// =========================

	function getNftCollection() external view returns (INFTCollection);

	function getCollectionCount() external view returns (uint256);

	function getNonces(address _account) external view returns (uint256);
}
