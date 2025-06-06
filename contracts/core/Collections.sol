// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {INFTCollection} from './interfaces/INFTCollection.sol';
import {Errors} from './libraries/Errors.sol';
import {Clone} from './libraries/Clone.sol';

contract Collections is Errors {
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

	struct Collection {
		string name;
		string symbol;
		string uri;
		uint256 supply;
		uint256 price;
		bool state;
		address creator;
		uint256 tokenCount;
	}

	struct Campaign {
		address[] collections;
		bool state;
		address creator;
	}

	/// =========================
	/// === Storage Variables ===
	/// =========================

	mapping(address => uint256) public nonces;
	mapping(uint256 => Campaign) public campaigns;

	INFTCollection public nftCollection;
	uint256 public campaignCount = 0;

	/// =========================
	/// ======== Events =========
	/// =========================

	event CampaignCreated(
		uint256 indexed campaignId,
		address indexed creator,
		CollectionParams[] collections
	);
	event CampaignStatusUpdated(uint256 indexed campaignId, bool status);
	event CollectionCreated(
		address indexed collection,
		address indexed creator,
		string name,
		string symbol,
		uint256 supply,
		uint256 price
	);

	/// =========================
	/// ====== Constructor ======
	/// =========================

	constructor() {
		// Constructor vacío, roles manejados por contrato padre
	}

	/// =========================
	/// === View Functions ======
	/// =========================

	function getCampaign(
		uint256 _campaignId
	) external view returns (Campaign memory) {
		_invalidCampaignId(_campaignId);
		return campaigns[_campaignId];
	}

	/// =================================
	/// == External / Public Functions ==
	/// =================================

	function createCampaign(
		CollectionParams[] memory _collectionsParams
	) external {
		if (_collectionsParams.length == 0) revert EMPTY_ARRAY();

		Campaign storage campaign = campaigns[++campaignCount];
		campaign.state = true;
		campaign.creator = msg.sender;

		for (uint256 i = 0; i < _collectionsParams.length; ) {
			CollectionParams memory params = _collectionsParams[i];

			_isEmptyString(params.name);
			_isEmptyString(params.symbol);
			_isEmptyString(params.uri);
			if (params.supply == 0) revert INVALID_SUPPLY();
			if (params.price == 0) revert INVALID_PRICE();

			address newCollection = Clone.createClone(
				address(nftCollection),
				msg.sender,
				nonces[msg.sender]++
			);

			INFTCollection(newCollection).initialize(
				params.name,
				params.symbol,
				params.uri,
				params.supply,
				params.price,
				params.state,
				msg.sender
			);

			campaign.collections.push(newCollection);

			emit CollectionCreated(
				newCollection,
				msg.sender,
				params.name,
				params.symbol,
				params.supply,
				params.price
			);

			unchecked {
				++i;
			}
		}

		emit CampaignCreated(campaignCount, msg.sender, _collectionsParams);
	}

	function setNFTCollection(INFTCollection _nftCollection) external {
		_isZeroAddress(address(_nftCollection));
		nftCollection = _nftCollection;
	}

	function recoverCollectionFunds(
		uint256 _campaignId,
		address _token,
		address _to
	) external {
		_invalidCampaignId(_campaignId);
		Campaign storage campaign = campaigns[_campaignId];

		if (msg.sender != campaign.creator) revert UNAUTHORIZED();

		INFTCollection selectedNftCollection = INFTCollection(_token);

		selectedNftCollection.recoverFunds(_token, _to);
	}

	/// =========================
	/// == Internal Functions ===
	/// =========================

	function _invalidCampaignId(uint256 _campaignId) internal view {
		if (_campaignId == 0 || _campaignId > campaignCount)
			revert INVALID_CAMPAIGN_ID();
	}
}
