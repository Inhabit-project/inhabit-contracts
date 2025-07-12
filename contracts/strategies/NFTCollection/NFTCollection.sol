// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721Upgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
import {ERC721URIStorageUpgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol';
import {ERC721BurnableUpgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol';
import {Initializable} from '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

import {INFTCollection} from '../../core/interfaces/INFTCollection.sol';
import {BaseStrategy} from '../../strategies/BaseStrategy.sol';

contract NFTCollection is
	Initializable,
	ERC721Upgradeable,
	ERC721URIStorageUpgradeable,
	ERC721BurnableUpgradeable,
	BaseStrategy,
	INFTCollection
{
	/// =========================
	/// === Storage Variables ===
	/// =========================

	uint256 private tokenCount;
	uint256 private supply;
	uint256 private price;
	bool private state;
	string private baseURI;

	/// =========================
	/// ====== Constructor ======
	/// =========================

	constructor() {
		_disableInitializers();
	}

	/// =========================
	/// ====== Initializer ======
	/// =========================

	function initialize(NFTCollectionParams calldata _params) public initializer {
		__ERC721_init(_params.name, _params.symbol);
		__ERC721URIStorage_init();
		__ERC721Burnable_init();

		__BaseStrategy_init(_params.campaignId, _params.collectionId);

		supply = _params.supply;
		price = _params.price;
		state = _params.state;
		baseURI = _params.uri;
	}

	/// =========================
	/// ======= Getters =========
	/// =========================

	function getTokenCount() external view returns (uint256) {
		return tokenCount;
	}

	function getSupply() external view returns (uint256) {
		return supply;
	}

	function getPrice() external view returns (uint256) {
		return price;
	}

	function getState() external view returns (bool) {
		return state;
	}

	function getBaseURI() external view returns (string memory) {
		return baseURI;
	}

	// the following functions are overrides required by BaseStrategy

	function getInhabit()
		public
		view
		override(BaseStrategy, INFTCollection)
		returns (address)
	{
		return super.getInhabit();
	}

	function getCampaignId()
		public
		view
		override(BaseStrategy, INFTCollection)
		returns (uint256)
	{
		return super.getCampaignId();
	}

	function getCollectionId()
		public
		view
		override(BaseStrategy, INFTCollection)
		returns (uint256)
	{
		return super.getCollectionId();
	}

	/// =========================
	/// ======= Setters =========
	/// =========================

	function setSupply(uint256 _supply) external onlyInhabit {
		if (_supply < tokenCount) revert INVALID_SUPPLY();
		supply = _supply;

		emit SupplyUpdated(_supply);
	}

	function setPrice(uint256 _price) external onlyInhabit {
		if (_price == 0) revert INVALID_PRICE();
		price = _price;

		emit PriceUpdated(_price);
	}

	function setState(bool _state) external onlyInhabit {
		if (state == _state) revert SAME_STATE();
		state = _state;

		emit StateUpdated(_state);
	}

	function setBaseURI(string calldata _uri) external onlyInhabit {
		baseURI = _uri;

		emit BaseURIUpdated(_uri);
	}

	/// ==========================
	/// ===== View Functions =====
	/// ==========================

	function getCollectionInfo()
		external
		view
		returns (NFTCollectionInfo memory)
	{
		return
			NFTCollectionInfo({
				campaignId: getCampaignId(),
				collectionId: getCollectionId(),
				collectionAddress: address(this),
				name: name(),
				symbol: symbol(),
				tokenCount: tokenCount,
				supply: supply,
				price: price,
				state: state,
				baseURI: baseURI
			});
	}

	// the following functions are overrides required by BaseStrategy

	function activeBalance(
		address _token
	) public view override(BaseStrategy, INFTCollection) returns (uint256) {
		return super.activeBalance(_token);
	}

	/// =================================
	/// == External / Public Functions ==
	/// =================================

	function safeMint(address _to) external onlyInhabit returns (uint256) {
		if (!state) revert COLLECTION_NOT_ACTIVE();
		if (tokenCount > supply) revert INVALID_SUPPLY();

		_safeMint(_to, ++tokenCount);
		return tokenCount;
	}

	/// ==========================
	/// ======== Overrides =======
	/// ==========================

	function burn(
		uint256 tokenId
	) public override(ERC721BurnableUpgradeable, INFTCollection) onlyInhabit {
		_burn(tokenId);
	}

	function _baseURI() internal view override returns (string memory) {
		return baseURI;
	}

	// the following functions are overrides required by BaseStrategy

	function recoverFunds(
		address _token,
		address _to
	) public override(BaseStrategy, INFTCollection) onlyInhabit {
		super.recoverFunds(_token, _to);
	}

	// The following functions are overrides required by Solidity.

	function tokenURI(
		uint256 tokenId
	)
		public
		view
		override(ERC721Upgradeable, ERC721URIStorageUpgradeable, INFTCollection)
		returns (string memory)
	{
		return baseURI;
	}

	function supportsInterface(
		bytes4 interfaceId
	)
		public
		view
		override(ERC721Upgradeable, ERC721URIStorageUpgradeable, INFTCollection)
		returns (bool)
	{
		return super.supportsInterface(interfaceId);
	}
}
