// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {INFTCollection} from './interfaces/INFTCollection.sol';

import {RoleManager} from './RoleManager.sol';
import {Errors} from './libraries/Errors.sol';
import {Clone} from './libraries/Clone.sol';

contract Collections is RoleManager, Errors {
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
	/// ====== Modifiers ========
	/// =========================

	modifier onlyCampaignCreator(uint256 _campaignId) {
		_InvalidCampaignId(_campaignId);

		if (campaigns[_campaignId].creator != msg.sender) revert UNAUTHORIZED();
		_;
	}

	/// =========================
	/// === View Functions ======
	/// =========================

	function getCampaign(
		uint256 _campaignId
	) external view returns (Campaign memory) {
		_InvalidCampaignId(_campaignId);
		return campaigns[_campaignId];
	}

	function getCollection(
		uint256 _campaignId,
		uint256 _collectionIndex
	) external view returns (Collection memory) {
		_InvalidCampaignId(_campaignId);

		if (_collectionIndex >= campaigns[_campaignId].collections.length)
			revert INVALID_INDEX();

		address collectionAddress = campaigns[_campaignId].collections[
			_collectionIndex
		];

		INFTCollection collection = INFTCollection(collectionAddress);

		return
			Collection({
				name: collection.name(),
				symbol: collection.symbol(),
				uri: collection._baseTokenURI(),
				supply: collection.supply(),
				price: collection.price(),
				state: collection.state(),
				creator: campaigns[_campaignId].creator,
				tokenCount: collection.tokenCount()
			});
	}

	function getCollections(
		uint256 _campaignId
	) external view returns (Collection[] memory) {
		_InvalidCampaignId(_campaignId);

		Campaign storage campaign = campaigns[_campaignId];

		Collection[] memory collections = new Collection[](
			campaign.collections.length
		);

		for (uint256 i; i < campaign.collections.length; ) {
			address collectionAddress = campaign.collections[i];
			INFTCollection collection = INFTCollection(collectionAddress);

			collections[i] = Collection({
				name: collection.name(),
				symbol: collection.symbol(),
				uri: collection._baseTokenURI(),
				supply: collection.supply(),
				price: collection.price(),
				state: collection.state(),
				creator: campaign.creator,
				tokenCount: collection.tokenCount()
			});

			unchecked {
				++i;
			}
		}

		return collections;
	}

	/// =================================
	/// == External / Public Functions ==
	/// =================================

	function createCampaign(
		CollectionParams[] memory _collectionsParams
	) external onlyRole(USER_ROLE) {
		if (_collectionsParams.length == 0) revert EMPTY_ARRAY();

		Campaign storage campaign = campaigns[++campaignCount];
		campaign.state = true;
		campaign.creator = msg.sender;

		for (uint256 i; i < _collectionsParams.length; ) {
			CollectionParams memory params = _collectionsParams[i];

			_isEmptyString(params.name);
			_isEmptyString(params.symbol);
			_isEmptyString(params.uri);
			if (params.supply == 0) revert INVALID_SUPPLY();
			if (params.price == 0) revert INVALID_PRICE();

			address newCollection = Clone.createClone(
				nftCollection,
				msg.sender,
				nonces[msg.sender]++
			);

			INFTCollection(newCollection).initialize(
				params.name,
				params.symbol,
				params.uri,
				params.supply,
				params.price,
				params.state
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

	function updateCampaignStatus(
		uint256 _campaignId,
		bool _status
	) external onlyRole(USER_ROLE) onlyCampaignCreator(_campaignId) {
		_InvalidCampaignId(_campaignId);

		Campaign storage campaign = campaigns[_campaignId];

		if (campaign.creator != msg.sender) revert UNAUTHORIZED();
		if (campaign.state == _status) revert SAME_STATE();

		campaign.state = _status;
		emit CampaignStatusUpdated(_campaignId, _status);
	}

	function setCollectionBaseURI(
		uint256 _campaignId,
		address _collection,
		string calldata _baseURI
	) external onlyRole(USER_ROLE) onlyCampaignCreator(_campaignId) {
		_isZeroAddress(_collection);

		for (uint256 i; i < campaigns[_campaignId].collections.length; ) {
			if (campaigns[_campaignId].collections[i] == _collection) {
				INFTCollection(_collection).setBaseURI(_baseURI);
				return;
			}

			unchecked {
				++i;
			}
		}
	}

	function setCollectionPrice(
		uint256 _campaignId,
		address _collection,
		uint256 _price
	) external onlyRole(USER_ROLE) onlyCampaignCreator(_campaignId) {
		_isZeroAddress(_collection);
		if (_price == 0) revert INVALID_PRICE();

		for (uint256 i; i < campaigns[_campaignId].collections.length; ) {
			if (campaigns[_campaignId].collections[i] == _collection) {
				INFTCollection(_collection).setPrice(_price);
				return;
			}

			unchecked {
				++i;
			}
		}
	}

	function setCollectionState(
		uint256 _campaignId,
		address _collection,
		bool _state
	) external onlyRole(USER_ROLE) onlyCampaignCreator(_campaignId) {
		_isZeroAddress(_collection);

		for (uint256 i; i < campaigns[_campaignId].collections.length; ) {
			if (campaigns[_campaignId].collections[i] == _collection) {
				INFTCollection(_collection).setState(_state);
				return;
			}

			unchecked {
				++i;
			}
		}
	}

	function setCollectionSupply(
		uint256 _campaignId,
		address _collection,
		uint256 _supply
	) external onlyRole(USER_ROLE) onlyCampaignCreator(_campaignId) {
		_isZeroAddress(_collection);
		if (_supply == 0) revert INVALID_SUPPLY();

		for (uint256 i; i < campaigns[_campaignId].collections.length; ) {
			if (campaigns[_campaignId].collections[i] == _collection) {
				INFTCollection(_collection).setSupply(_supply);
				return;
			}

			unchecked {
				++i;
			}
		}
	}

	function setNFTCollection(
		INFTCollection _nftCollection
	) external onlyRole(ADMIN_ROLE) {
		_isZeroAddress(address(_nftCollection));
		nftCollection = _nftCollection;
	}

	function recoverFunds(
		address _token,
		address _recipient
	) external onlyRole(ADMIN_ROLE) {
		_isZeroAddress(_recipient);

		uint256 amount = _token == NATIVE
			? address(this).balance
			: ERC20(_token).balanceOf(address(this));

		_transferAmount(_token, _recipient, amount);
	}

	/// =========================
	/// == Internal Functions ===
	/// =========================

	function _InvalidCampaignId(uint256 _campaignId) internal pure {
		_InvalidCampaignId(_campaignId);
	}
}
