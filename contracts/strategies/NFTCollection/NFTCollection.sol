// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721Upgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
import {ERC721URIStorageUpgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol';
import {ERC721BurnableUpgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol';
import {ERC2771ContextUpgradeable} from '@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol';
import {Initializable} from '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import {ContextUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';

import {INFTCollection} from '../../core/interfaces/INFTCollection.sol';
import {BaseStrategy} from '../../strategies/BaseStrategy.sol';

contract NFTCollection is
	Initializable,
	ERC721Upgradeable,
	ERC721URIStorageUpgradeable,
	ERC721BurnableUpgradeable,
	ERC2771ContextUpgradeable,
	BaseStrategy,
	INFTCollection
{
	/// =========================
	/// === Storage Variables ===
	/// =========================

	address private paymentToken;
	uint256 private tokenCount;
	uint256 private supply;
	uint256 private price;
	bool private state;
	string private baseURI;

	/// =========================
	/// ====== Constructor ======
	/// =========================

	constructor(
		address _trustedForwarder
	) ERC2771ContextUpgradeable(_trustedForwarder) {
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

		paymentToken = _params.paymentToken;
		supply = _params.supply;
		price = _params.price;
		state = _params.state;
		baseURI = _params.uri;
	}

	/// =========================
	/// ======= Getters =========
	/// =========================

	function getPaymentToken() external view returns (address) {
		return paymentToken;
	}

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

	function setPaymentToken(address _paymentToken) external onlyInhabit {
		if (_paymentToken == paymentToken || _isZeroAddress(_paymentToken))
			revert INVALID_ADDRESS();

		paymentToken = _paymentToken;

		emit PaymentTokenUpdated(_paymentToken);
	}

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
				paymentToken: paymentToken,
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

	function metaTransferFrom(
		address from,
		address to,
		uint256 tokenId
	) external {
		address sender = _msgSender();

		if (sender != from) revert NOT_NFT_OWNER();

		_transfer(from, to, tokenId);
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

	function _msgSender()
		internal
		view
		override(ContextUpgradeable, ERC2771ContextUpgradeable)
		returns (address sender)
	{
		return ERC2771ContextUpgradeable._msgSender();
	}

	function _msgData()
		internal
		view
		override(ContextUpgradeable, ERC2771ContextUpgradeable)
		returns (bytes calldata)
	{
		return ERC2771ContextUpgradeable._msgData();
	}

	function _contextSuffixLength()
		internal
		view
		override(ContextUpgradeable, ERC2771ContextUpgradeable)
		returns (uint256)
	{
		return ERC2771ContextUpgradeable._contextSuffixLength();
	}
}
