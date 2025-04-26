// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    constructor() ERC721("MockNFT", "MNFT") {}

    function mintReserved(address to, uint256 amount) external {
        for (uint256 i = 0; i < amount; i++) {
            _safeMint(to, _tokenIdCounter);
            _tokenIdCounter++;
        }
    }
} 