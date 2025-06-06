// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import {AccessControlUpgradeable} from '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import {ReentrancyGuard} from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import {Groups} from './Groups.sol';
import {Collections} from './Collections.sol';

contract Inhabit is
	Initializable,
	AccessControlUpgradeable,
	ReentrancyGuard,
	Groups,
	Collections
{
	/// =========================
	/// === Storage Variables ===
	/// =========================

	bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');
	bytes32 public constant USER_ROLE = keccak256('USER_ROLE');

	/// @custom:oz-upgrades-unsafe-allow constructor

	constructor() {
		_disableInitializers();
	}

	/// =========================
	/// ====== Initializer ======
	/// =========================

	function initialize(address _defaultAdmin) public initializer {
		__AccessControl_init();

		_grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
		_grantRole(ADMIN_ROLE, _defaultAdmin);
		_grantRole(USER_ROLE, _defaultAdmin);
	}

	/// =================================
	/// == External / Public Functions ==
	/// =================================

	/// @notice Group functions

	function createGroup(
		string calldata _referral,
		bool _state,
		Embassador[] calldata _embassadors
	) external onlyRole(ADMIN_ROLE) {
		_createGroup(_referral, _state, _embassadors);
	}

	function updateGroupStatus(
		string calldata _referral,
		bool _status
	) external onlyRole(ADMIN_ROLE) {
		_updateGroupStatus(_referral, _status);
	}

	function addEmbassadors(
		string calldata _referral,
		Embassador[] calldata _embassadors
	) external onlyRole(ADMIN_ROLE) {
		_addEmbassadors(_referral, _embassadors);
	}

	function updateEmbassadors(
		string calldata _referral,
		Embassador[] calldata _embassadors
	) external onlyRole(ADMIN_ROLE) {
		_updateEmbassadors(_referral, _embassadors);
	}

	function removeEmbassadors(
		string calldata _referral,
		address[] calldata _accounts
	) external onlyRole(ADMIN_ROLE) {
		_removeEmbassadors(_referral, _accounts);
	}

	function addToTokens(
		address[] calldata _tokens
	) external onlyRole(ADMIN_ROLE) {
		_addToTokens(_tokens);
	}

	function removeFromTokens(address _token) external onlyRole(ADMIN_ROLE) {
		_removeFromTokens(_token);
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
		CollectionParams[] memory _collectionsParams
	) external onlyRole(USER_ROLE) {
		_createCampaign(_goal, _collectionsParams);
	}

	function updateCampaignStatus(
		uint256 _campaignId,
		bool _status
	) external onlyRole(USER_ROLE) {
		_updateCampaignStatus(_campaignId, _status);
	}

	function setCollectionBaseURI(
		uint256 _campaignId,
		address _collection,
		string calldata _baseURI
	) external onlyRole(USER_ROLE) {
		_setCollectionBaseURI(_campaignId, _collection, _baseURI);
	}

	function setCollectionPrice(
		uint256 _campaignId,
		address _collection,
		uint256 _price
	) external onlyRole(USER_ROLE) {
		_setCollectionPrice(_campaignId, _collection, _price);
	}

	function setCollectionState(
		uint256 _campaignId,
		address _collection,
		bool _state
	) external onlyRole(USER_ROLE) {
		_setCollectionState(_campaignId, _collection, _state);
	}

	function setCollectionSupply(
		uint256 _campaignId,
		address _collection,
		uint256 _supply
	) external onlyRole(USER_ROLE) {
		_setCollectionSupply(_campaignId, _collection, _supply);
	}

	function setNFTCollection(
		address _nftCollection
	) external onlyRole(USER_ROLE) {
		_setNFTCollection(_nftCollection);
	}

	function recoverCollectionFunds(
		uint256 _campaignId,
		address _collectionAddress,
		address _token,
		address _to
	) external onlyRole(USER_ROLE) {
		_recoverCollectionFunds(_campaignId, _collectionAddress, _token, _to);
	}
}
