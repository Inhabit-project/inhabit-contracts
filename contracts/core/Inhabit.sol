// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// third party
/// chainlink
import {AggregatorV3Interface} from '@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol';

/// solady
import {ERC20} from 'solady/src/tokens/ERC20.sol';
import {ERC721} from 'solady/src/tokens/ERC721.sol';

/// openzeppelin
import {Initializable} from '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import {ReentrancyGuardUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';

// local
/// library
import {Admin} from './Admin.sol';
import {Collections} from './Collections.sol';
import {Errors} from './libraries/Errors.sol';
import {Groups} from './Groups.sol';
import {PriceFeed} from './PriceFeed.sol';

/// interface
import {IInhabit} from '../core/interfaces/IInhabit.sol';
import {ICollections} from './interfaces/ICollections.sol';
import {INFTCollection} from './interfaces/INFTCollection.sol';

import 'hardhat/console.sol';

contract Inhabit is
	IInhabit,
	Initializable,
	ReentrancyGuardUpgradeable,
	Admin,
	Groups,
	Collections,
	PriceFeed
{
	/// =========================
	/// === Storage Variables ===
	/// =========================

	address private treasury;
	uint256 private campaignCount;

	mapping(address => bool) private tokens;
	mapping(uint256 id => Campaign) private campaigns;

	/// =========================
	/// ====== Modifiers ========
	/// =========================

	modifier onlyCampaignOwner(uint256 _campaignId) {
		_checkOnlyCampaignOwner(_campaignId);
		_;
	}

	modifier ifCampaignExists(uint256 _campaignId) {
		_checkIfCampaignExists(_campaignId);
		_;
	}

	modifier ifCollectionExists(uint256 _campaignId, address _collection) {
		_checkIfCollectionExists(_campaignId, _collection);
		_;
	}

	/// =========================
	/// ===== Constructor =======
	/// =========================

	/// @custom:oz-upgrades-unsafe-allow constructor

	constructor() {
		_disableInitializers();
	}

	/// =========================
	/// ====== Initializer ======
	/// =========================

	function initialize(
		address _defaultAdmin,
		address _nftCollection,
		address _treasury
	) public initializer {
		__ReentrancyGuard_init();

		__Admin_init(_defaultAdmin);
		__Collections_init(_nftCollection);
		__Groups_init();
		__PriceFeed_init();

		treasury = _treasury;
	}

	/// =========================
	/// ======= Getters =========
	/// =========================

	function getTreasury() external view returns (address) {
		return treasury;
	}

	function getCampaignCount() external view returns (uint256) {
		return campaignCount;
	}

	function getCampaign(
		uint256 _id
	) public view returns (ICollections.Campaign memory) {
		return campaigns[_id];
	}

	function getCampaigns()
		external
		view
		override
		returns (ICollections.Campaign[] memory)
	{
		ICollections.Campaign[] memory allCampaigns = new ICollections.Campaign[](
			campaignCount
		);

		console.log('campaignCount', campaignCount);
		for (uint256 i = 1; i <= campaignCount; ) {
			allCampaigns[i - 1] = campaigns[i];

			unchecked {
				++i;
			}
		}

		return allCampaigns;
	}

	function isTokenSupported(address _token) external view returns (bool) {
		return tokens[_token];
	}

	/// =========================
	/// ======= Setters =========
	/// =========================

	function setTreasury(address _treasury) external onlyRole(ADMIN_ROLE) {
		if (treasury == _treasury) revert SAME_ADDRESS();
		treasury = _treasury;

		emit TreasuryUpdated(treasury, _treasury);
	}

	function addToToken(address _token) external onlyRole(ADMIN_ROLE) {
		if (tokens[_token]) revert TOKEN_ALREADY_EXISTS();
		tokens[_token] = true;

		emit TokenAdded(_token);
	}

	function removeFromTokens(address _token) external onlyRole(ADMIN_ROLE) {
		if (!tokens[_token]) revert TOKEN_NOT_FOUND();
		tokens[_token] = false;

		emit TokenRemoved(_token);
	}

	function setCampaignOwner(
		uint256 _campaignId,
		address _newOwner
	) external onlyCampaignOwner(_campaignId) {
		Campaign storage campaign = campaigns[_campaignId];

		if (_newOwner == address(0)) revert INVALID_ADDRESS();
		if (campaign.owner == _newOwner) revert SAME_ADDRESS();
		campaign.owner = _newOwner;

		emit CampaignOwnershipTransferred(_campaignId, msg.sender, _newOwner);
	}

	function setCampaignStatus(
		uint256 _campaignId,
		bool _status
	) external onlyRole(USER_ROLE) onlyCampaignOwner(_campaignId) {
		Campaign storage campaign = campaigns[_campaignId];

		if (campaign.state == _status) revert SAME_STATE();
		campaign.state = _status;

		emit CampaignStatusUpdated(_campaignId, campaign.state, _status);
	}

	// the following setters of Groups

	function setGroupReferral(
		uint256 _campaignId,
		bytes32 _referral
	) external onlyRole(ADMIN_ROLE) ifCampaignExists(_campaignId) {
		_setGroupReferral(_campaignId, _referral);
	}

	function setGroupStatus(
		uint256 _campaignId,
		bytes32 _referral,
		bool _status
	) external onlyRole(ADMIN_ROLE) ifCampaignExists(_campaignId) {
		_setGroupStatus(_campaignId, _referral, _status);
	}

	function setAmbassador(
		uint256 _campaignId,
		bytes32 _referral,
		Ambassador calldata _ambassador
	) external onlyRole(ADMIN_ROLE) ifCampaignExists(_campaignId) {
		_setAmbassador(_campaignId, _referral, _ambassador);
	}

	function addAmbassadors(
		uint256 _campaignId,
		bytes32 _referral,
		Ambassador[] calldata _ambassadors
	) external onlyRole(ADMIN_ROLE) ifCampaignExists(_campaignId) {
		_addAmbassadors(_campaignId, _referral, _ambassadors);
	}

	function removeAmbassador(
		uint256 _campaignId,
		bytes32 _referral,
		address _ambassador
	) external onlyRole(ADMIN_ROLE) ifCampaignExists(_campaignId) {
		_removeAmbassador(_campaignId, _referral, _ambassador);
	}

	// the following setters of Collections

	function setNFTCollection(
		address _nftCollection
	) external onlyRole(ADMIN_ROLE) {
		if (_nftCollection == address(0)) revert ZERO_ADDRESS();
		if (_nftCollection == address(nftCollection)) revert SAME_ADDRESS();
		_setNftCollection(_nftCollection);
	}

	function setCollectionSupply(
		uint256 _campaignId,
		address _collection,
		uint256 _supply
	)
		external
		onlyRole(USER_ROLE)
		ifCollectionExists(_campaignId, _collection)
		onlyCampaignOwner(_campaignId)
	{
		_setCollectionSupply(_collection, _supply);
	}

	function setCollectionPrice(
		uint256 _campaignId,
		address _collection,
		uint256 _price
	)
		external
		onlyRole(USER_ROLE)
		ifCollectionExists(_campaignId, _collection)
		onlyCampaignOwner(_campaignId)
	{
		_setCollectionPrice(_collection, _price);
	}

	function setCollectionState(
		uint256 _campaignId,
		address _collection,
		bool _state
	)
		external
		onlyRole(USER_ROLE)
		ifCollectionExists(_campaignId, _collection)
		onlyCampaignOwner(_campaignId)
	{
		_setCollectionState(_collection, _state);
	}

	function setCollectionBaseURI(
		uint256 _campaignId,
		address _collection,
		string calldata _baseURI
	)
		external
		onlyRole(USER_ROLE)
		ifCollectionExists(_campaignId, _collection)
		onlyCampaignOwner(_campaignId)
	{
		_setCollectionBaseURI(_collection, _baseURI);
	}

	// the following setters of PriceFeed

	function addAggregator(
		address _token,
		address _aggregator
	) external onlyRole(ADMIN_ROLE) {
		_addAggregator(_token, AggregatorV3Interface(_aggregator));
	}

	function removeAggregator(address _token) external onlyRole(ADMIN_ROLE) {
		_removeAggregator(_token);
	}

	function setUsdToken(address _usdToken) external onlyRole(ADMIN_ROLE) {
		_setUsdToken(_usdToken);
	}

	/// ==========================
	/// ===== View Functions =====
	/// ==========================

	function getCollectionInfo(
		uint256 _campaignId,
		address _collection
	)
		external
		view
		ifCollectionExists(_campaignId, _collection)
		returns (INFTCollection.NFTCollectionInfo memory)
	{
		return _getCollectionInfo(_collection);
	}

	function getActiveBalance(
		uint256 _campaignId,
		address _collection,
		address _token
	)
		external
		view
		ifCollectionExists(_campaignId, _collection)
		returns (uint256)
	{
		return _collectionActiveBalance(_collection, _token);
	}

	function getCampaignInfo(
		uint256 _campaignId
	) public view ifCampaignExists(_campaignId) returns (CampaignInfo memory) {
		Campaign storage campaign = campaigns[_campaignId];

		INFTCollection.NFTCollectionInfo[]
			memory collectionsInfo = new INFTCollection.NFTCollectionInfo[](
				campaign.collections.length
			);

		for (uint256 i; i < collectionsInfo.length; ) {
			collectionsInfo[i] = _getCollectionInfo(campaign.collections[i]);

			unchecked {
				++i;
			}
		}

		return
			CampaignInfo({
				owner: campaign.owner,
				id: campaign.id,
				goal: campaign.goal,
				fundsRaised: campaign.fundsRaised,
				state: campaign.state,
				collectionsInfo: collectionsInfo
			});
	}

	function getCampaignsInfo() external view returns (CampaignInfo[] memory) {
		CampaignInfo[] memory allCampaignsInfo = new CampaignInfo[](campaignCount);
		for (uint256 i = 1; i <= campaignCount; ) {
			allCampaignsInfo[i - 1] = getCampaignInfo(i);

			unchecked {
				++i;
			}
		}

		return allCampaignsInfo;
	}

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
	) external nonReentrant ifCollectionExists(_campaignId, _collection) {
		if (_isZeroAddress(_to) || _isZeroAddress(_paymentToken))
			revert INVALID_ADDRESS();

		if (_paymentAmount == 0) revert INVALID_AMOUNT();

		Campaign memory campaign = getCampaign(_campaignId);
		if (!campaign.state) revert CAMPAIGN_NOT_ACTIVE();

		uint256 price = _getPrice(_collection, _paymentToken, _paymentAmount);

		if (ERC20(_paymentToken).balanceOf(msg.sender) < _paymentAmount)
			revert INSUFFICIENT_FUNDS();

		if (
			ERC20(_paymentToken).allowance(msg.sender, address(this)) < _paymentAmount
		) revert INSUFFICIENT_ALLOWANCE();

		_transferAmountFrom(
			_paymentToken,
			TransferData({
				from: msg.sender,
				to: address(this),
				amount: _paymentAmount
			})
		);

		uint256 referralFee = _distribution(
			_campaignId,
			_referral,
			_paymentToken,
			_paymentAmount
		);

		_transferAmount(_paymentToken, treasury, _paymentAmount - referralFee);

		uint256 tokenId = _safeMint(_collection, _to);

		campaigns[_campaignId].fundsRaised += price;

		emit NFTPurchased(
			_campaignId,
			_collection,
			_to,
			_paymentToken,
			_paymentAmount,
			tokenId,
			block.timestamp
		);
	}

	/// @notice Group functions

	function createGroup(
		uint256 _campaignId,
		GroupParams calldata _groupParams
	) external onlyRole(ADMIN_ROLE) ifCampaignExists(_campaignId) {
		_createGroup(_campaignId, _groupParams);
	}

	function recoverFunds(
		address _token,
		address _to
	) external onlyRole(ADMIN_ROLE) {
		_recoverFunds(_token, _to);
	}

	/// @notice Collection functions

	function createCampaign(
		uint256 _goal,
		CollectionParams[] calldata _collectionsParams
	) external override onlyRole(USER_ROLE) {
		Campaign memory campaign = _createCampaign(
			msg.sender,
			++campaignCount,
			_goal,
			_collectionsParams
		);

		campaigns[campaign.id] = campaign;

		emit CampaignCreated(
			campaign.owner,
			campaign.id,
			campaign.goal,
			campaign.state,
			campaign.collections
		);
	}

	function addCollection(
		uint256 _campaignId,
		INFTCollection.NFTCollectionParams calldata _p
	) external override onlyRole(USER_ROLE) onlyCampaignOwner(_campaignId) {
		CollectionParams memory p = CollectionParams(
			_p.paymentToken,
			_p.name,
			_p.symbol,
			_p.uri,
			_p.supply,
			_p.price,
			_p.state
		);
		_addCollection(campaigns[_campaignId], p);
	}

	function recoverCollectionFunds(
		uint256 _campaignId,
		address _collection,
		address _token,
		address _to
	)
		external
		onlyRole(USER_ROLE)
		ifCollectionExists(_campaignId, _collection)
		onlyCampaignOwner(_campaignId)
	{
		_recoverCollectionFunds(_collection, _token, _to);
	}

	/// =========================
	/// === Helper Functions ====
	/// =========================

	function _getPrice(
		address _collection,
		address _paymentToken,
		uint256 _paymentAmount
	) private view returns (uint256) {
		INFTCollection.NFTCollectionInfo memory info = _getCollectionInfo(
			_collection
		);

		if (tokens[_paymentToken]) {
			if (_paymentAmount < info.price) revert INVALID_AMOUNT();
			else return info.price;
		}

		uint256 paymentAmountInUsd = PriceFeed.getPriceInUsdToken(
			_paymentToken,
			_paymentAmount
		);

		uint256 collectionTokenPriceInUsd = PriceFeed.getPriceInUsdToken(
			info.paymentToken,
			info.price
		);

		if (paymentAmountInUsd < collectionTokenPriceInUsd)
			revert INSUFFICIENT_USD_VALUE(_paymentToken, _paymentAmount);

		return info.price;
	}

	/// =========================
	/// === Private Functions ===
	/// =========================

	function _isTokenSupported(address _token) private view returns (bool) {
		return tokens[_token];
	}

	function _isCampaign(uint256 _id) private view returns (bool) {
		return _id == 0 || _id > campaignCount ? false : true;
	}

	function _isCollection(
		uint256 _campaignId,
		address _collection
	) private view returns (bool) {
		if (!_isCampaign(_campaignId)) return false;

		Campaign storage campaign = campaigns[_campaignId];
		for (uint256 i; i < campaign.collections.length; ) {
			if (campaign.collections[i] == _collection) return true;

			unchecked {
				++i;
			}
		}

		return false;
	}

	function _checkOnlyCampaignOwner(uint256 _id) private view {
		if (campaigns[_id].owner != msg.sender) revert UNAUTHORIZED();
	}

	function _checkIfCampaignExists(uint256 _id) private view {
		if (!_isCampaign(_id)) revert CAMPAIGN_NOT_FOUND();
	}

	function _checkIfCollectionExists(
		uint256 _campaignId,
		address _collection
	) private view {
		if (!_isCollection(_campaignId, _collection)) revert COLLECTION_NOT_FOUND();
	}
}
