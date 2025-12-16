// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// third party
/// openzeppelin
import {ERC2771ForwarderUpgradeable} from '@openzeppelin/contracts-upgradeable/metatx/ERC2771ForwarderUpgradeable.sol';
import {Initializable} from '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

/// solady
import {ERC20} from 'solady/src/tokens/ERC20.sol';

// local
/// library
import {Admin} from './Admin.sol';
import {Transfer} from './libraries/Transfer.sol';
/// interface
import {IForwarder} from './interfaces/IForwarder.sol';

contract Forwarder is
	Initializable,
	ERC2771ForwarderUpgradeable,
	Transfer,
	Admin,
	IForwarder
{
	/// =========================
	/// === Storage Variables ===
	/// =========================

	mapping(address => bool) private relayers;

	/// =========================
	/// ====== Modifiers ========
	/// =========================

	modifier onlyRelayer() {
		_checkOnlyRelayer(msg.sender);
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
		string memory _name,
		address _defaultAdmin
	) public initializer {
		if (_isZeroAddress(_defaultAdmin)) revert ZERO_ADDRESS();

		__ERC2771Forwarder_init(_name);
		__Admin_init(_defaultAdmin);
	}

	receive() external payable {}

	fallback() external payable {}

	/// =========================
	/// ======= Getters =========
	/// =========================

	function isRelayerSupported(address _address) external view returns (bool) {
		return _isRelayerSupported(_address);
	}

	/// =========================
	/// ======= Setters =========
	/// =========================

	function addRelayer(address _relayer) external onlyRole(ADMIN_ROLE) {
		if (_isRelayerSupported(_relayer)) revert RELAYER_ALREADY_SUPPORTED();
		relayers[_relayer] = true;
		emit RelayerAdded(_relayer);
	}

	function removeRelayer(address _relayer) external onlyRole(ADMIN_ROLE) {
		if (!_isRelayerSupported(_relayer)) revert RELAYER_NOT_SUPPORTED();
		relayers[_relayer] = false;
		emit RelayerRemoved(_relayer);
	}

	/// ===============================
	/// = External / Public Functions =
	/// ===============================

	function execute(
		ForwardRequestData calldata request
	)
		public
		payable
		override(ERC2771ForwarderUpgradeable, IForwarder)
		onlyRelayer
	{
		super.execute(request);
	}

	function executeBatch(
		ForwardRequestData[] calldata requests,
		address payable refundReceiver
	)
		public
		payable
		override(ERC2771ForwarderUpgradeable, IForwarder)
		onlyRelayer
	{
		super.executeBatch(requests, refundReceiver);
	}

	function recoverFunds(
		address _token,
		address _to
	) external onlyRole(ADMIN_ROLE) {
		uint256 amount = _token == NATIVE
			? address(this).balance
			: ERC20(_token).balanceOf(address(this));

		_transferAmount(_token, _to, amount);
	}

	/// =========================
	/// === Private Functions ===
	/// =========================

	function _checkOnlyRelayer(address _relayer) private view {
		if (!_isRelayerSupported(_relayer)) revert RELAYER_NOT_SUPPORTED();
	}

	function _isRelayerSupported(address _relayer) private view returns (bool) {
		return relayers[_relayer];
	}
}
