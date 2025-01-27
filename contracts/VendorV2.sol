// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/// @dev open source tokenity vendor contract
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @dev security
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./security/Administered.sol";

/// @dev standard contract
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/// @dev factory
import "./factories/CollectionV2.sol";

/// @dev helpers
import "./helpers/OracleV2.sol";
import "./helpers/WithdrawV2.sol";
import "./Interfaces/INFTCollection.sol";

/// @dev partner
import "./patners/Group.sol";

contract VendorV2 is
    Administered,
    WithdrawV2,
    ReentrancyGuard,
    CollectionV2,
    OracleV2,
    Group
{
    /// @dev Mapeo para registrar las compras
    mapping(address => mapping(address => uint256)) private investments;
    mapping(address => bool) private refundEnabled;

    /// @dev Variable para controlar el estado de la función de reembolso
    bool public refundActive = false;

    /// @notice Transfer token reserved
    /// @dev Transfer a token to a user only if the user is in the user role
    /// @param _idx                              Id of the pair
    /// @param _addr                              Address of the wallet destination
    /// @param _qty                             Id of the token to transfer
    function transferReserved(
        uint256 _idx,
        address _addr,
        uint256 _qty
    ) external onlyUser nonReentrant {
        CollectionStruct storage c = collections[_idx];
        require(c.active, "Collection is not active");
        _sendNFTs(c.addr, _addr, _qty);
    }

    /// @notice Buy token
    /// @dev Buy NFT and pay with custom token
    /// @param _cIdx                              Id of the Collection
    /// @param _token                               Address of the token to pay
    /// @param _amount                        Amount of tokens to buy
    function buyWithToken(
        string calldata _group,
        address _token,
        uint256 _cIdx,
        uint256 _amount
    ) external nonReentrant {
        require(_amount > 0, "Amount of token greater than zero");

        CollectionStruct storage c = collections[_cIdx];
        require(c.active, "Collection is not active");
        require(isToken(_token), "Invalid token");

        ERC20List memory tk = getTokenByAddr(_token);
        require(tk.active && !tk.isNative, "Token is not available");

        /** Amount to Pay */
        uint256 _atp = parseUSDtoToken((c.price * _amount), _token, false);

        require(
            IERC20(_token).allowance(_msgSender(), address(this)) >= _atp,
            "Token approval is required to continue"
        );

        require(
            IERC20(_token).balanceOf(_msgSender()) >= _atp,
            "You don't have enough tokens to buy"
        );

        require(
            IERC20(_token).transferFrom(_msgSender(), address(this), _atp),
            "Error transferring tokens from user to vendor"
        );

        // Registra la inversión del usuario
        investments[_msgSender()][_token] += _atp;

        /// @dev distribution of tokens a group
        distribution(_group, _atp, false, _token);

        _sendNFTs(c.addr, _msgSender(), _amount);
    }

    /**
     * @dev Buy NFT and pay with native token
     * @param _cIdx                              Id of the Collection
     * @param _token                              Address of the token to pay
     * @param _amount                        Amount of tokens to buy
     */
    function buyNative(
        string calldata _group,
        uint256 _cIdx,
        address _token,
        uint256 _amount
    ) external payable nonReentrant {
        require(_amount > 0, "Amount of token greater than zero");
        require(msg.value > 0, "No amount sent");

        CollectionStruct storage c = collections[_cIdx];
        require(c.active, "Collection is not active");
        require(isToken(_token), "Invalid token");

        ERC20List memory tk = getTokenByAddr(_token);
        require(tk.active && tk.isNative, "Token is not available");

        /** Amount to Pay */
        uint256 _atp = parseUSDtoToken((c.price * _amount), _token, true);
        require(msg.value >= _atp, "You don't have enough tokens to buy");

        // Registra la inversión del usuario
        investments[_msgSender()][_token] += msg.value;

        /// @dev distribution of tokens a group
        distribution(_group, _atp, true, _token);

        _sendNFTs(c.addr, _msgSender(), _amount);
    }

    /**
     * @dev Send NFTs to a user
     * @param _token Address of the NFT
     * @param _to Address of the user
     * @param _qty Amount of NFTs to send
     */
    function _sendNFTs(address _token, address _to, uint256 _qty) private {
        INFTCollection(_token).mintReserved(_to, _qty);
    }

    /// @notice Activa o desactiva la opción de devolución para una wallet específica
    /// @param _wallet Dirección de la wallet
    /// @param _enabled Estado de la devolución (true para activar, false para desactivar)
    function setRefundEnabled(
        address _wallet,
        bool _enabled
    ) external onlyAdmin {
        refundEnabled[_wallet] = _enabled;
    }

    /// @notice Activa o desactiva la función global de reembolso
    /// @param _active Estado de la función de reembolso (true para activar, false para desactivar)
    function setRefundActive(bool _active) external onlyAdmin {
        refundActive = _active;
    }

    /// @notice Devuelve la inversión al usuario en el mismo token que usó para comprar
    /// @param _cIdx ID de la colección (para validar el contrato del NFT)
    /// @param _token Dirección del token usado para la compra (puede ser el token ERC20 o el nativo)
    /// @param _nftId ID del NFT que el usuario quiere devolver
    function refundInvestment(
        uint256 _cIdx,
        address _token,
        uint256 _nftId
    ) external nonReentrant {
        require(refundActive, "Refund functionality is not active");
        require(
            refundEnabled[_msgSender()],
            "Refund not enabled for this wallet"
        );

        CollectionStruct storage c = collections[_cIdx];
        uint256 investedAmount = investments[_msgSender()][_token];
        require(investedAmount > 0, "No investment found for this token");

        // Verifica que el usuario sea el dueño del NFT
        require(
            IERC721(c.addr).ownerOf(_nftId) == _msgSender(),
            "You do not own this NFT"
        );

        // Transfiere el NFT de vuelta al contrato antes de realizar el reembolso
        IERC721(c.addr).transferFrom(_msgSender(), address(this), _nftId);

        // Resetea la inversión para evitar múltiples devoluciones
        investments[_msgSender()][_token] = 0;

        ERC20List memory tk = getTokenByAddr(_token);

        if (tk.isNative) {
            // Reembolso en token nativo (ETH)
            require(
                address(this).balance >= investedAmount,
                "Contract balance is insufficient"
            );
            (bool success, ) = _msgSender().call{value: investedAmount}("");
            require(success, "Refund failed");
        } else {
            // Reembolso en tokens ERC20
            require(
                IERC20(_token).balanceOf(address(this)) >= investedAmount,
                "Contract balance is insufficient"
            );
            require(
                IERC20(_token).transfer(_msgSender(), investedAmount),
                "Refund token transfer failed"
            );
        }
    }

    /// @notice Permite al administrador retirar un NFT del contrato
    /// @param _nftAddress Dirección del contrato del NFT
    /// @param _nftId ID del NFT que se va a retirar
    /// @param _to Dirección a la que se enviará el NFT
    function withdrawNFT(
        address _nftAddress,
        uint256 _nftId,
        address _to
    ) external onlyAdmin {
        IERC721(_nftAddress).transferFrom(address(this), _to, _nftId);
    }

    // Permite recibir Celo directamente sin llamar a una función específica
    receive() external payable {}
}
