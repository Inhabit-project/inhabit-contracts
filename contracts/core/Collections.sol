// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {INFTCollection} from './interfaces/INFTCollection.sol';
import {ICollections} from './interfaces/ICollections.sol';
import {Errors} from './libraries/Errors.sol';
import {Clone} from './libraries/Clone.sol';

contract Collections is ICollections, Errors {
	/// =========================
	/// === Storage Variables ===
	/// =========================

	mapping(address => uint256) private nonces;
	mapping(uint256 => Campaign) private campaigns;

	INFTCollection public nftCollection;
	uint256 public campaignCount = 0;

	/// =========================
	/// ====== Modifiers ========
	/// =========================

	modifier onlyCampaignCreator(uint256 _campaignId) {
		_invalidCampaignId(_campaignId);

		if (campaigns[_campaignId].creator != msg.sender) revert UNAUTHORIZED();
		_;
	}

	/// =========================
	/// === View Functions ======
	/// =========================

	function getCampaign(
		uint256 _campaignId
	) internal view returns (Campaign memory) {
		_invalidCampaignId(_campaignId);
		return campaigns[_campaignId];
	}

	function getNonce(address _account) internal view returns (uint256) {
		return nonces[_account];
	}

	/// =========================
	/// == Internal Functions ===
	/// =========================

	function _createCampaign(
		uint256 _goal,
		CollectionParams[] memory _collectionsParams
	) internal {
		if (_goal == 0) revert INVALID_GOAL();
		if (_collectionsParams.length == 0) revert EMPTY_ARRAY();

		Campaign storage campaign = campaigns[++campaignCount];
		campaign.state = true;
		campaign.creator = msg.sender;
		campaign.goal = _goal;
		campaign.fundsRaised = 0;

		for (uint256 i; i < _collectionsParams.length; ) {
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

	function _updateCampaignStatus(
		uint256 _campaignId,
		bool _status
	) internal onlyCampaignCreator(_campaignId) {
		_invalidCampaignId(_campaignId);

		Campaign storage campaign = campaigns[_campaignId];

		if (campaign.creator != msg.sender) revert UNAUTHORIZED();
		if (campaign.state == _status) revert SAME_STATE();

		campaign.state = _status;
		emit CampaignStatusUpdated(_campaignId, _status);
	}

	function _setCollectionBaseURI(
		uint256 _campaignId,
		address _collection,
		string calldata _baseURI
	) internal onlyCampaignCreator(_campaignId) {
		_isZeroAddress(_collection);

		for (uint256 i; i < campaigns[_campaignId].collections.length; ) {
			if (campaigns[_campaignId].collections[i] == _collection) {
				INFTCollection(_collection).setBaseURI(_baseURI);
				emit CollectionBaseURIUpdated(_campaignId, _collection, _baseURI);
				break;
			}

			unchecked {
				++i;
			}
		}
	}

	function _setCollectionPrice(
		uint256 _campaignId,
		address _collection,
		uint256 _price
	) internal onlyCampaignCreator(_campaignId) {
		_isZeroAddress(_collection);
		if (_price == 0) revert INVALID_PRICE();

		for (uint256 i; i < campaigns[_campaignId].collections.length; ) {
			if (campaigns[_campaignId].collections[i] == _collection) {
				INFTCollection(_collection).setPrice(_price);
				emit CollectionPriceUpdated(_campaignId, _collection, _price);
				break;
			}

			unchecked {
				++i;
			}
		}
	}

	function _setCollectionState(
		uint256 _campaignId,
		address _collection,
		bool _state
	) internal onlyCampaignCreator(_campaignId) {
		_isZeroAddress(_collection);

		for (uint256 i; i < campaigns[_campaignId].collections.length; ) {
			if (campaigns[_campaignId].collections[i] == _collection) {
				INFTCollection(_collection).setState(_state);
				emit CollectionStateUpdated(_campaignId, _collection, _state);
				break;
			}

			unchecked {
				++i;
			}
		}
	}

	function _setCollectionSupply(
		uint256 _campaignId,
		address _collection,
		uint256 _supply
	) internal onlyCampaignCreator(_campaignId) {
		_isZeroAddress(_collection);
		if (_supply == 0) revert INVALID_SUPPLY();

		for (uint256 i; i < campaigns[_campaignId].collections.length; ) {
			if (campaigns[_campaignId].collections[i] == _collection) {
				INFTCollection(_collection).setSupply(_supply);
				emit CollectionSupplyUpdated(_campaignId, _collection, _supply);
				break;
			}

			unchecked {
				++i;
			}
		}
	}

	function _setNFTCollection(address _nftCollection) internal {
		_isZeroAddress(_nftCollection);
		nftCollection = INFTCollection(_nftCollection);
		emit NftCollectionSet(_nftCollection);
	}

	function _recoverCollectionFunds(
		uint256 _campaignId,
		address _collectionAddress,
		address _token,
		address _to
	) internal {
		_invalidCampaignId(_campaignId);
		Campaign storage campaign = campaigns[_campaignId];

		if (msg.sender != campaign.creator) revert UNAUTHORIZED();

		for (uint256 i; i < campaign.collections.length; ) {
			if (_collectionAddress == campaign.collections[i]) {
				INFTCollection findedNftCollection = INFTCollection(
					campaign.collections[i]
				);

				findedNftCollection.recoverFunds(_token, _to);
				break;
			}

			unchecked {
				++i;
			}
		}
	}

	/// =========================
	/// === Private Functions ===
	/// =========================

	function _invalidCampaignId(uint256 _campaignId) private view {
		if (_campaignId == 0 || _campaignId > campaignCount)
			revert INVALID_CAMPAIGN_ID();
	}
}
