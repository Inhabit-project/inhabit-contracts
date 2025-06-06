// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721Upgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
import {ERC721URIStorageUpgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol';
import {Initializable} from '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

import {BaseStrategy} from '../../strategies/BaseStrategy.sol';

contract NFTCollection is
	Initializable,
	ERC721Upgradeable,
	ERC721URIStorageUpgradeable,
	OwnableUpgradeable,
	BaseStrategy
{
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
	/// === Storage Variables ===
	/// =========================

	uint256 public tokenCount = 0;
	uint256 public supply;
	uint256 public price;
	bool public state;
	string public baseURI;

	/// =========================
	/// ======== Events =========
	/// =========================

	event BaseURIUpdated(string newBaseURI);
	event PriceUpdated(uint256 newPrice);
	event StateUpdated(bool newState);
	event SupplyUpdated(uint256 newSupply);

	/// =========================
	/// ====== Constructor ======
	/// =========================

	constructor() {
		_disableInitializers();
	}

	/// =========================
	/// ====== Initializer ======
	/// =========================

	function initialize(
		CollectionParams calldata _params,
		address _initialOwner
	) public initializer {
		__Ownable_init(_initialOwner);
		__ERC721_init(_params.name, _params.symbol);
		__ERC721URIStorage_init();
		__BaseStrategy_init(_params.id, msg.sender);

		supply = _params.supply;
		price = _params.price;
		state = _params.state;
		baseURI = _params.uri;
	}

	/// =================================
	/// == External / Public Functions ==
	/// =================================

	function safeMint(address _to) external onlyOwner /*returns (uint256)*/ {
		_isZeroAddress(_to);
		if (supply > tokenCount) revert INVALID_SUPPLY();
		if (!state) revert COLLECTION_NOT_ACTIVE();

		_safeMint(_to, ++tokenCount);
		//return tokenCount;
	}

	function setBaseURI(string calldata uri) external onlyOwner {
		_isEmptyString(uri);
		baseURI = uri;

		emit BaseURIUpdated(uri);
	}

	function setPrice(uint256 _price) external onlyOwner {
		if (_price == 0) revert INVALID_PRICE();
		price = _price;

		emit PriceUpdated(_price);
	}

	function setState(bool _state) external onlyOwner {
		if (state == _state) revert SAME_STATE();
		state = _state;

		emit StateUpdated(_state);
	}

	function setSupply(uint256 _supply) external onlyOwner {
		if (_supply < tokenCount) revert INVALID_SUPPLY();
		supply = _supply;

		emit SupplyUpdated(_supply);
	}

	/// =========================
	/// ===== View Functions ====
	/// =========================

	function _baseURI() internal view override returns (string memory) {
		return baseURI;
	}

	// The following functions are overrides required by Solidity.

	function tokenURI(
		uint256 tokenId
	)
		public
		view
		override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
		returns (string memory)
	{
		return super.tokenURI(tokenId);
	}

	function supportsInterface(
		bytes4 interfaceId
	)
		public
		view
		override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
		returns (bool)
	{
		return super.supportsInterface(interfaceId);
	}
}
