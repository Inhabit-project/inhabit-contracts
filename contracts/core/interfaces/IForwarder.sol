// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// third party
/// openzeppelin
import {ERC2771ForwarderUpgradeable} from '@openzeppelin/contracts-upgradeable/metatx/ERC2771ForwarderUpgradeable.sol';

/**
 * @title IInhabitForwarder Interface
 * @dev Interface for the InhabitForwarder contract that manages ERC2771 meta-transactions with relayer support
 * @notice This interface defines all external functions and events for forwarder management
 */
interface IForwarder {
	/// =========================
	/// ======== Events =========
	/// =========================

	/**
	 * @dev Event emitted when a relayer is added
	 * @param relayer Address of the relayer that was added
	 */
	event RelayerAdded(address indexed relayer);

	/**
	 * @dev Event emitted when a relayer is removed
	 * @param relayer Address of the relayer that was removed
	 */
	event RelayerRemoved(address indexed relayer);

	/// =========================
	/// ======= Getters =========
	/// =========================

	/**
	 * @dev Check if an address is a supported relayer
	 * @param _address Address to check
	 * @return bool True if the address is a supported relayer
	 */
	function isRelayerSupported(address _address) external view returns (bool);

	/// =========================
	/// ======= Setters =========
	/// =========================

	/**
	 * @dev Add a relayer address to the whitelist
	 * @param _relayer Address of the relayer to add
	 * @notice Only callable by addresses with ADMIN_ROLE
	 * @notice Reverts if relayer is already supported
	 */
	function addRelayer(address _relayer) external;

	/**
	 * @dev Remove a relayer address from the whitelist
	 * @param _relayer Address of the relayer to remove
	 * @notice Only callable by addresses with ADMIN_ROLE
	 * @notice Reverts if relayer is not supported
	 */
	function removeRelayer(address _relayer) external;

	/// ===============================
	/// = External / Public Functions =
	/// ===============================

	/**
	 * @dev Execute a single forward request
	 * @param request Forward request data to execute
	 * @notice Only callable by supported relayers
	 * @notice Forwards native tokens with the request
	 */
	function execute(
		ERC2771ForwarderUpgradeable.ForwardRequestData calldata request
	) external payable;

	/**
	 * @dev Execute multiple forward requests in a batch
	 * @param requests Array of forward request data to execute
	 * @param refundReceiver Address to receive refund for unused native tokens
	 * @notice Only callable by supported relayers
	 * @notice Forwards native tokens with the requests
	 */
	function executeBatch(
		ERC2771ForwarderUpgradeable.ForwardRequestData[] calldata requests,
		address payable refundReceiver
	) external payable;

	/**
	 * @dev Recover funds (native or ERC20) from the contract
	 * @param _token Token address (use NATIVE constant for native tokens)
	 * @param _to Address to send recovered funds to
	 * @notice Only callable by addresses with ADMIN_ROLE
	 */
	function recoverFunds(address _token, address _to) external;
}
