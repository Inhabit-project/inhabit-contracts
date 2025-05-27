// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "./security/ReEntrancyGuard.sol";
import "./security/SoftAdministered.sol";

/**
 * @title Inhabit
 * @dev Inhabit es un contrato ERC721A que incluye características de seguridad adicionales
 *      y una administración flexible utilizando roles. Ofrece funcionalidades para mintear tokens
 *      con un límite máximo definido y la capacidad de actualizar el URI base.
 */
contract Inhabit is SoftAdministered, ERC721A, ReEntrancyGuard {
    /// @dev Indica si la venta está activa. Controla si se puede mintear o no.
    bool public saleActive = true;

    /// @dev Límite máximo de tokens que pueden ser minteados en toda la vida del contrato.
    uint256 public maxSupply;

    /// @dev URI base que apunta a los metadatos (imágenes o videos) de los tokens.
    string public baseTokenURI = "#";

    /// @dev Evento que se emite cuando la URI base del token es modificada.
    event BaseURIChanged(string newBaseURI);

    /// @dev Evento que se emite cuando se modifica el límite máximo de supply.
    event MaxSupplyChanged(uint256 newMaxSupply);

    /// @dev Pausa general del contrato para todas las operaciones críticas.
    bool public paused = false;

    /**
     * @dev Modificador que asegura que la función solo se ejecute cuando el contrato no está pausado.
     */
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    /**
     * @dev Constructor del contrato Inhabit.
     * @param _name Nombre del token (ERC721A).
     * @param _symbol Símbolo del token (ERC721A).
     * @param _maxSupply Cantidad máxima de tokens que pueden ser minteados.
     * @param _baseTokenURI Enlace base que lleva a la imagen o video del token.
     * @param _scVendor Dirección del proveedor (vendor) que será añadido a la lista de administración.
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _maxSupply,
        string memory _baseTokenURI,
        address _scVendor
    ) ERC721A(_name, _symbol) {
        maxSupply = _maxSupply;
        baseTokenURI = _baseTokenURI;

        /// @dev Añade al proveedor (vendor) a la lista blanca.
        _addRole(_scVendor);
    }

    /**
     * @dev Función que permite mintear tokens reservados para una dirección específica.
     * @param _address Dirección que recibirá los tokens.
     * @param _amount Cantidad de tokens a mintear.
     */
    function mintReserved(
        address _address,
        uint256 _amount
    ) external onlyUserOrOwner whenNotPaused noReentrant {
        require(saleActive, "Sale isn't active");
        require(
            totalSupply() + _amount <= maxSupply,
            "Can't mint more than max supply"
        );

        _safeMint(_address, _amount);
    }

    /**
     * @dev Método interno que sobrescribe la función de OpenZeppelin para retornar la URI base.
     * @return La URI base para los tokens.
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    /**
     * @dev Establece una nueva URI base para los metadatos de los tokens.
     * @param _baseTokenURI Nuevo enlace base que apunta a la imagen o video de los tokens.
     */
    function setBaseURI(string memory _baseTokenURI) external onlyUserOrOwner {
        require(bytes(_baseTokenURI).length > 0, "Base URI cannot be empty");
        baseTokenURI = _baseTokenURI;
        emit BaseURIChanged(_baseTokenURI);
    }

    /**
     * @dev Activa o desactiva la venta de tokens.
     * @param val Valor booleano que activa (true) o desactiva (false) la venta.
     */
    function setSaleActive(bool val) external onlyUserOrOwner {
        saleActive = val;
    }

    /**
     * @dev Pausa o despausa el contrato. Cuando está pausado, no se pueden realizar operaciones críticas.
     * @param _paused Valor booleano que indica si el contrato debe pausarse (true) o no (false).
     */
    function setPaused(bool _paused) external onlyUserOrOwner {
        paused = _paused;
    }

    /**
     * @dev Permite actualizar el límite máximo de tokens que pueden ser minteados.
     * @param _newMaxSupply Nuevo límite máximo de tokens.
     */
    function setMaxSupply(uint256 _newMaxSupply) external onlyUserOrOwner {
        maxSupply = _newMaxSupply;
        emit MaxSupplyChanged(_newMaxSupply);
    }
}
