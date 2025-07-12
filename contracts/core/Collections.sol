// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {INFTCollection} from './interfaces/INFTCollection.sol';
import {ICollections} from './interfaces/ICollections.sol';
import {Errors} from './libraries/Errors.sol';
import {Clone} from './libraries/Clone.sol';

import 'hardhat/console.sol';

abstract contract Collections is ICollections, Errors {
	/// =========================
	/// === Storage Variables ===
	/// =========================

	INFTCollection private nftCollection;
	uint256 private collectionCount;

	mapping(address account => uint256) private nonces;

	/// =========================
	/// ====== Initializer ======
	/// =========================

	function __Collections_init(address _nftCollection) internal {
		// check if nft collection address is not initialized already, if it is, revert
		if (address(nftCollection) != address(0)) revert UNAUTHORIZED();

		// check if collection address is valid and not zero (0), if it is, revert
		if (_nftCollection == address(0)) revert INVALID_ADDRESS();

		nftCollection = INFTCollection(_nftCollection);
	}

	/// =========================
	/// ======= Getters =========
	/// =========================

	function getNftCollection() external view returns (INFTCollection) {
		return nftCollection;
	}

	function getCollectionCount() external view returns (uint256) {
		return collectionCount;
	}

	function getNonces(address _account) external view returns (uint256) {
		return nonces[_account];
	}

	// the following functions are getters of NFTCollection

	/// =========================
	/// ======= Setters =========
	/// =========================

	function _setNftCollection(address _nftCollection) internal {
		if (_nftCollection == address(0)) revert ZERO_ADDRESS();
		if (address(nftCollection) == _nftCollection) revert SAME_ADDRESS();
		nftCollection = INFTCollection(_nftCollection);

		emit NftCollectionUpdated(_nftCollection);
	}

	// the following functions are setters of NFTCollection

	function _setCollectionSupply(address _collection, uint256 _supply) internal {
		INFTCollection(_collection).setSupply(_supply);
	}

	function _setCollectionPrice(address _collection, uint256 _price) internal {
		INFTCollection(_collection).setPrice(_price);
	}

	function _setCollectionState(address _collection, bool _state) internal {
		INFTCollection(_collection).setState(_state);
	}

	function _setCollectionBaseURI(
		address _collection,
		string calldata _baseURI
	) internal {
		INFTCollection(_collection).setBaseURI(_baseURI);
	}

	/// =========================
	/// == Internal Functions ===
	/// =========================

	function _createCampaign(
		address _owner,
		uint256 _campaignId,
		uint256 _goal,
		CollectionParams[] memory _collectionsParams
	) internal returns (Campaign memory) {
		if (_goal == 0) revert INVALID_GOAL();
		if (_collectionsParams.length == 0) revert EMPTY_ARRAY();

		address[] memory collections = new address[](_collectionsParams.length);

		for (uint256 i; i < _collectionsParams.length; ++i) {
			CollectionParams memory params = _collectionsParams[i];
			if (params.supply == 0) revert INVALID_SUPPLY();
			if (params.price == 0) revert INVALID_PRICE();

			address newCollection = Clone.createClone(
				address(nftCollection),
				_owner,
				nonces[_owner]++
			);

			collectionCount++;

			INFTCollection.NFTCollectionParams memory init = INFTCollection
				.NFTCollectionParams({
					campaignId: _campaignId,
					collectionId: collectionCount,
					name: params.name,
					symbol: params.symbol,
					uri: params.uri,
					supply: params.supply,
					price: params.price,
					state: params.state
				});

			INFTCollection(newCollection).initialize(init);
			collections[i] = newCollection;

			emit CollectionCreated(
				_owner,
				_campaignId,
				collectionCount,
				newCollection,
				params.name,
				params.symbol,
				params.uri,
				params.supply,
				params.price,
				params.state
			);
		}

		Campaign memory campaign = Campaign({
			owner: _owner,
			id: _campaignId,
			goal: _goal,
			fundsRaised: 0,
			state: true,
			collections: collections
		});

		return campaign;
	}

	function _addCollection(
		Campaign storage _campaign,
		CollectionParams memory _params
	) internal {
		if (_params.supply == 0) revert INVALID_SUPPLY();
		if (_params.price == 0) revert INVALID_PRICE();

		address newCollection = Clone.createClone(
			address(nftCollection),
			_campaign.owner,
			nonces[_campaign.owner]++
		);

		collectionCount++;
		INFTCollection.NFTCollectionParams memory initParams = INFTCollection
			.NFTCollectionParams({
				campaignId: _campaign.id,
				collectionId: collectionCount,
				name: _params.name,
				symbol: _params.symbol,
				uri: _params.uri,
				supply: _params.supply,
				price: _params.price,
				state: _params.state
			});

		INFTCollection(newCollection).initialize(initParams);

		_campaign.collections.push(newCollection);

		emit CollectionAdded(
			_campaign.owner,
			_campaign.id,
			collectionCount,
			address(newCollection),
			_params.name,
			_params.symbol,
			_params.uri,
			_params.supply,
			_params.price,
			_params.state
		);
	}

	// the following functions are internal of NFTCollection

	function _getCollectionInfo(
		address _collection
	) internal view returns (INFTCollection.NFTCollectionInfo memory) {
		return INFTCollection(_collection).getCollectionInfo();
	}

	function _collectionActiveBalance(
		address _collection,
		address _token
	) internal view returns (uint256) {
		return INFTCollection(_collection).activeBalance(_token);
	}

	function _safeMint(
		address _collection,
		address _to
	) internal returns (uint256) {
		return INFTCollection(_collection).safeMint(_to);
	}

	function _recoverCollectionFunds(
		address _collection,
		address _token,
		address _to
	) internal {
		INFTCollection(_collection).recoverFunds(_token, _to);
	}
}
