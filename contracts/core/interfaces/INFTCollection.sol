// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface INFTCollection {interfaces
	/// =========================
	/// ===== View Functions ====
	/// =========================

	/**
	 * @dev Get current token count
	 * @return Current number of minted tokens
	 */
	function tokenCount() external view returns (uint256);

	/**
	 * @dev Get maximum supply of the collection
	 * @return Maximum number of tokens that can be minted
	 */
	function supply() external view returns (uint256);

	/**
	 * @dev Get price per token in wei
	 * @return Price of each token
	 */
	function price() external view returns (uint256);

	/**
	 * @dev Get collection state (active/inactive)
	 * @return true if collection is active, false otherwise
	 */
	function state() external view returns (bool);

	/**
	 * @dev Get base URI for token metadata
	 * @return Base URI string
	 */
	function _baseTokenURI() external view returns (string memory);

	/**
	 * @dev Get token URI for a specific token
	 * @param tokenId Token ID to get URI for
	 * @return Complete URI for the token metadata
	 */
	function tokenURI(uint256 tokenId) external view returns (string memory);

	/**
	 * @dev Check if contract supports a specific interface
	 * @param interfaceId Interface identifier to check
	 * @return true if interface is supported
	 */
	function supportsInterface(bytes4 interfaceId) external view returns (bool);

	/**
	 * @dev Get owner of the contract
	 * @return Address of the contract owner
	 */
	function owner() external view returns (address);

	/**
	 * @dev Get owner of a specific token
	 * @param tokenId Token ID to check ownership
	 * @return Address of the token owner
	 */
	function ownerOf(uint256 tokenId) external view returns (address);

	/**
	 * @dev Get balance of tokens for an address
	 * @param owner Address to check balance for
	 * @return Number of tokens owned by the address
	 */
	function balanceOf(address owner) external view returns (uint256);

	/// =========================
	/// == External Functions ===
	/// =========================

	/**
	 * @dev Initialize the NFT collection (proxy pattern)
	 * @param _name Name of the NFT collection
	 * @param _symbol Symbol of the NFT collection
	 * @param _baseURI Base URI for token metadata
	 * @param _supply Maximum supply of tokens
	 * @param _price Price per token in wei
	 * @param _state Initial state of the collection
	 * @param _initialOwner Address of the initial owner
	 */
	function initialize(
		string calldata _name,
		string calldata _symbol,
		string calldata _baseURI,
		uint256 _supply,
		uint256 _price,
		bool _state,
		address _initialOwner
	) external;

	/**
	 * @dev Mint a new token to a specific address
	 * @param _to Address to mint the token to
	 * @return tokenId ID of the newly minted token
	 */
	function safeMint(address _to) external returns (uint256);

	/**
	 * @dev Update the base URI for all tokens
	 * @param _baseURI New base URI string
	 */
	function setBaseURI(string calldata _baseURI) external;

	/**
	 * @dev Update the price per token
	 * @param _price New price in wei
	 */
	function setPrice(uint256 _price) external;

	/**
	 * @dev Update the collection state (active/inactive)
	 * @param _state New state for the collection
	 */
	function setState(bool _state) external;

	/**
	 * @dev Update the maximum supply
	 * @param _supply New maximum supply (must be >= current token count)
	 */
	function setSupply(uint256 _supply) external;

	/**
	 * @dev Transfer ownership of the contract
	 * @param newOwner Address of the new owner
	 */
	function transferOwnership(address newOwner) external;

	/**
	 * @dev Renounce ownership of the contract
	 */
	function renounceOwnership() external;

	/**
	 * @dev Standard ERC721 transfer function
	 * @param from Address sending the token
	 * @param to Address receiving the token
	 * @param tokenId ID of the token to transfer
	 */
	function transferFrom(address from, address to, uint256 tokenId) external;

	/**
	 * @dev Safe transfer function with data
	 * @param from Address sending the token
	 * @param to Address receiving the token
	 * @param tokenId ID of the token to transfer
	 * @param data Additional data to send with transfer
	 */
	function safeTransferFrom(
		address from,
		address to,
		uint256 tokenId,
		bytes calldata data
	) external;

	/**
	 * @dev Safe transfer function without data
	 * @param from Address sending the token
	 * @param to Address receiving the token
	 * @param tokenId ID of the token to transfer
	 */
	function safeTransferFrom(address from, address to, uint256 tokenId) external;

	/**
	 * @dev Approve another address to transfer a specific token
	 * @param to Address to approve
	 * @param tokenId ID of the token to approve
	 */
	function approve(address to, uint256 tokenId) external;

	/**
	 * @dev Set approval for all tokens
	 * @param operator Address to set approval for
	 * @param approved Whether to approve or revoke approval
	 */
	function setApprovalForAll(address operator, bool approved) external;

	/**
	 * @dev Get approved address for a specific token
	 * @param tokenId Token ID to check approval for
	 * @return Address approved to transfer the token
	 */
	function getApproved(uint256 tokenId) external view returns (address);

	/**
	 * @dev Check if an operator is approved for all tokens of an owner
	 * @param owner Token owner address
	 * @param operator Operator address to check
	 * @return true if operator is approved for all tokens
	 */
	function isApprovedForAll(
		address owner,
		address operator
	) external view returns (bool);

	/// =========================
	/// ======== Events =========
	/// =========================

	/**
	 * @dev Emitted when base URI is updated
	 * @param oldBaseURI Previous base URI
	 * @param newBaseURI New base URI
	 */
	event BaseURIUpdated(string oldBaseURI, string newBaseURI);

	/**
	 * @dev Emitted when collection state is updated
	 * @param oldState Previous state
	 * @param newState New state
	 */
	event StateUpdated(bool oldState, bool newState);

	/**
	 * @dev Emitted when price is updated
	 * @param oldPrice Previous price
	 * @param newPrice New price
	 */
	event PriceUpdated(uint256 oldPrice, uint256 newPrice);

	/**
	 * @dev Emitted when supply is updated
	 * @param oldSupply Previous supply
	 * @param newSupply New supply
	 */
	event SupplyUpdated(uint256 oldSupply, uint256 newSupply);

	/**
	 * @dev Emitted when a token is minted
	 * @param to Address that received the token
	 * @param tokenId ID of the minted token
	 */
	event TokenMinted(address indexed to, uint256 indexed tokenId);
}
