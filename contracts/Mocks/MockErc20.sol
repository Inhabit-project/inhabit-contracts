// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockErc20 is ERC20 {
    constructor() ERC20("MockErc20", "MTK") {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
     function mintReserved(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function nativeTokenBalance (address who) public view returns(uint256){
        return (who).balance;
    }
}