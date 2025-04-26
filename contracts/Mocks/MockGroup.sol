// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract MockGroup {
    function distribution(
        string calldata,
        uint256,
        bool,
        address
    ) external pure returns (bool) {
        return true;
    }
} 