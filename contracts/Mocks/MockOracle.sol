// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract MockOracle {
    uint256 public constant PRICE = 1000000; // 1 USD = 1000000 wei

    function getLatestPrice() external pure returns (uint256) {
        return PRICE;
    }
} 