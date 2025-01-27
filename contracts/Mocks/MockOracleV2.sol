// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;


import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../factories/WhiteListTokenV2.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockOracleV2 is WhiteListTokenV2 {

    /// @dev SafeMath library
    using SafeMath for uint256;

    uint256 price = 0;

    function setPrice(uint256 _price) public {
        price = _price;
    }


    /**
     * @dev Parse amount token from USD
     * @param _amount                                               Amount in USD (WEI)
     * @param _token                                                Token address   
     * @return uint256                                              Amount in tokens
     */
    function parseUSDtoToken(
        uint256 _amount,
        address _token,
        bool _isNative
    ) public view returns (uint256) {
        uint256 unitaryPrice = _amount.mul(1 ether).div(getUSDPrice(_token));
        uint256 decimals = (_isNative) ? 18 : ERC20(_token).decimals();
        return parseToToken(unitaryPrice, decimals);
    }

    /**
     * @dev Get USD Price of token
     * @param _addr                                                Token address
     * @return uint256                                              USD Price of token on WEI
     */
    function getUSDPrice(address _addr) public view returns (uint256) {
        require(isToken(_addr), "Token is not whitelisted");

        ERC20List memory token = getTokenByAddr(_addr);

        return price * 10**token.orcDecimals;
    }

    /**
     * @notice Parse amount to token decimals
     * @dev Parse amount to token decimals
     * @param _amount                           Amount on WEI 
     * @param _decimals                         Decimals of token
     */
    function parseToToken(
        uint256 _amount, 
        uint256 _decimals
    ) internal pure returns (uint256) {
        if (_decimals == 18) {
            return _amount;
        } else {
            uint256 dcmLeft = 18 - _decimals;
            return _amount.div(10**dcmLeft);
        }
    }

    /**
     * @notice Calculate percentage
     * @dev Calculate percentage
     * @param _amount                           Amount to calculate
     * @param _percentage                       Percentage to calculate
     * @return fee                          Percentage calculated
     */
    function calculatePercentage(
        uint256 _amount, 
        uint256 _percentage
    ) public pure returns (uint256 fee){
        return (_amount * _percentage) / 10000;
    }

    // @dev Returns the latest price
    function getLatestPrice(
        address _oracle, 
        uint256 _decimal
    ) public view returns (uint256) {
        require(_oracle != address(0), "Invalid oracle address");

 
        return price * 10**_decimal;
    }

    /**
     * @notice Parse amount to 18 decimals
     * @dev Parse amount to 18 decimals
     * @param _amount                           Amount to convert   
     * @param _decimal                          Decimal of token
     */
    function parseToWei(
        uint256 _amount, 
        uint256 _decimal
    ) internal pure returns (uint256) {
        if (_decimal == 18) {
            return _amount;
        } else {
            uint256 diff = 18 - _decimal;
            return _amount.mul(10**diff);
        }
    }
}
