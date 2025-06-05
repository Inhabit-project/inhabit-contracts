// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import {ReentrancyGuard} '@openzeppelin/contracts/security/ReentrancyGuard.sol';

import {RoleManager} from './RoleManager.sol';
import {Groups} from './Groups.sol';
import {Collections} from './Collections.sol';
import {Transfer} from './libraries/Transfer.sol';
import {Errors} from './libraries/Errors.sol';

contract Inhabit is
	ReentrancyGuard, 
	Transfer,
	RoleManager,
	Groups,
	Collections,
	Errors
{
	mapping(address => bool) private tokens;

	// TODO: Buy NFTs, return investments, etc

	 function addToTokens(address[] _tokens) external onlyRole(ADMIN_ROLE) {
		_isEmptyArray(_token);
    
		for (uint256 i = 0; i < _token.length; i++) {
			_isZeroAddress(_token[i]);
      tokens[_token] = true;

			unchecked {
				++i;
			}
				
		} 
		   }

		function removeFromTokens(address _token) external onlyRole(ADMIN_ROLE) {
			_isZeroAddress(_token);
			tokens[_token] = false;
		}

		function recoverFunds(address _token, address _to) external onlyRole(ADMIN_ROLE) {
		_isZeroAddress(_to);

		uint256 amount = _token == NATIVE
			? address(this).balance
			: ERC20(_token).balanceOf(address(this));

		_transferAmount(_token, _to, amount);
	}

	receive() external payable {}
}
