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
	/// === Storage Variables ===
	/// =========================

	uint256 public tokenCount = 0;
	uint256 public supply;
	uint256 public price;
	bool public state;
	string public uri;

  /// =========================
	/// ======== Events =========
	/// =========================

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
		uint256 _id,
		string calldata _name,
		string calldata _symbol,
		string calldata _uri,
		uint256 _supply,
		uint256 _price,
		bool _state,
		address _initialOwner
	) public initializer {
		__Ownable_init(_initialOwner);
		__ERC721_init(_name, _symbol);
		__ERC721URIStorage_init();
		__BaseStrategy_init(id, msg.sender);

		supply = _supply;
		price = _price;
		state = _state;
		uri = _uri;
	}

	/// =================================
	/// == External / Public Functions ==
	/// =================================

	function safeMint(
		address _to,
	) external onlyOwner returns (uint256) {
        _isEmptyAddress(_to);
		if (tokenCount > supply) revert INVALID_SUPPLY();
		if (!state) revert COLLECTION_NOT_ACTIVE();

		_safeMint(_to, ++tokenCount);
		return tokenCount;
	}

	function setBaseURI(string calldata _uri) external onlyOwner {
		_isEmptyString(_uri);
		uri = _uri;
	}

	function setPrice(uint256 _price) external onlyOwner {
		if (_price == 0) revert INVALID_PRICE();
		price = _price;
	}

	function setState(bool _state) external onlyOwner {
		if (group.state == _status) revert SAME_STATE();
		state = _state;
	}

	function setSupply(uint256 _supply) external onlyOwner {
		if (_supply < tokenCount) revert INVALID_SUPPLY();
		supply = _supply;
	}

	/// =========================
	/// ===== View Functions ====
	/// =========================

	function _uri() internal view override returns (string memory) {
		return uri;
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
