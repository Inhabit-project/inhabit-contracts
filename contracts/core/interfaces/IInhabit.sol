// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IGroups} from './IGroups.sol';
import {ICollections} from './ICollections.sol';
import {INFTCollection} from './INFTCollection.sol';

interface IInhabit {
	/// =========================
	/// ======== Structs ========
	/// =========================

	struct CampaignInfo {
		address owner;
		uint256 id;
		uint256 goal;
		uint256 fundsRaised;
		bool state;
		INFTCollection.NFTCollectionInfo[] collectionsInfo;
	}

	/// =========================
	/// ======== Events =========
	/// =========================

	event TokenAdded(address token);

	event TokenRemoved(address token);

	event NFTPurchased(
		uint256 indexed campaignId,
		address indexed collectionId,
		address indexed buyer,
		address paymentToken,
		uint256 price,
		uint256 tokenId,
		uint256 purchaseTimestamp
	);

	event RefundEstablished(
		uint256 indexed campaignId,
		address indexed collectionId,
		address paymentToken,
		uint256 amountPerNFT,
		uint256 totalRefundAmount,
		uint256 totalNFTsSold
	);

	event RefundClaimed(
		uint256 indexed campaignId,
		address indexed collectionId,
		uint256 tokenId,
		address indexed claimer,
		address paymentToken,
		uint256 amount
	);

	event TreasuryUpdated(
		address indexed oldTreasury,
		address indexed newTreasury
	);

	event CampaignOwnershipTransferred(
		uint256 indexed campaignId,
		address indexed oldOwner,
		address indexed newOwner
	);

	event CampaignStatusUpdated(
		uint256 indexed campaignId,
		bool oldState,
		bool newState
	);

	/// =========================
	/// ======= Getters =========
	/// =========================

	function getTreasury() external view returns (address);

	function getCampaignCount() external view returns (uint256);

	function getCampaign(
		uint256 _id
	) external view returns (ICollections.Campaign memory);

	function getCampaigns()
		external
		view
		returns (ICollections.Campaign[] memory);

	function isTokenSupported(address _token) external view returns (bool);

	/// =========================
	/// ======= Setters =========
	/// =========================

	function setTreasury(address _newTreasury) external;

	function addToToken(address _token) external;

	function removeFromTokens(address _token) external;

	function setCampaignOwner(uint256 _campaignId, address _newOwner) external;

	function setCampaignStatus(uint256 _campaignId, bool _status) external;

	// the following setters of Groups

	function setGroupReferral(uint256 _campaignId, bytes32 _referral) external;

	function setGroupStatus(
		uint256 _campaignId,
		bytes32 _referral,
		bool _status
	) external;

	function setAmbassador(
		uint256 _campaignId,
		bytes32 _referral,
		IGroups.Ambassador calldata _ambassador
	) external;

	function addAmbassadors(
		uint256 _campaignId,
		bytes32 _referral,
		IGroups.Ambassador[] calldata _ambassadors
	) external;

	function removeAmbassador(
		uint256 _campaignId,
		bytes32 _referral,
		address _ambassador
	) external;

	// the following setters of Collections

	function setNFTCollection(
		uint256 _campaignId,
		address _nftCollection
	) external;

	function setCollectionSupply(
		uint256 _campaignId,
		address _collection,
		uint256 _supply
	) external;

	function setCollectionPrice(
		uint256 _campaignId,
		address _collection,
		uint256 _price
	) external;

	function setCollectionState(
		uint256 _campaignId,
		address _collection,
		bool _state
	) external;

	function setCollectionBaseURI(
		uint256 _campaignId,
		address _collection,
		string calldata _baseURI
	) external;

	// the following setters of PriceFeed

	function addAggregator(address _token, address _aggregator) external;

	function removeAggregator(address _token) external;

	function setUsdToken(address _usdToken) external;

	/// ==========================
	/// ===== View Functions =====
	/// ==========================

	function getCollectionInfo(
		uint256 _campaignId,
		address _collection
	) external view returns (INFTCollection.NFTCollectionInfo memory);

	function getActiveBalance(
		uint256 _campaignId,
		address _collection,
		address _token
	) external view returns (uint256);

	function getCampaignInfo(
		uint256 _campaignId
	) external view returns (CampaignInfo memory);

	function getCampaignsInfo() external view returns (CampaignInfo[] memory);

	/// =================================
	/// == External / Public Functions ==
	/// =================================

	function buyNFT(
		address _to,
		uint256 _campaignId,
		address _collection,
		bytes32 _referral,
		address _paymentToken,
		uint256 _paymentAmount
	) external;

	/// @notice Group functions

	function createGroup(
		uint256 _campaignId,
		IGroups.GroupParams calldata _params
	) external;

	function recoverFunds(address _token, address _to) external;

	/// @notice Collection functions

	function createCampaign(
		uint256 _goal,
		ICollections.CollectionParams[] calldata _collectionsParams
	) external;

	function addCollection(
		uint256 _campaignId,
		INFTCollection.NFTCollectionParams calldata _params
	) external;

	function recoverCollectionFunds(
		uint256 _campaignId,
		address _collection,
		address _token,
		address _to
	) external;
}
