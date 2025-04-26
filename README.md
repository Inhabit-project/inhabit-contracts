# Sample Hardhat Project

## Setup

- node 14

- - -

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```

---

## Contrato Inteligente: VendorV2 - Documentación Detallada

**Propósito General:**

El contrato `VendorV2` actúa como una plataforma centralizada para la venta de NFTs de diversas colecciones. Permite a los usuarios comprar estos NFTs utilizando tokens ERC20 específicos o el token nativo de la blockchain (ej. ETH, MATIC, CELO). Incorpora funcionalidades robustas para la administración de colecciones, gestión de tokens aceptados, oráculo de precios, distribución de ingresos a grupos, sistema de roles, retiro de fondos y un mecanismo de reembolso opcional.

**Módulos Heredados y Funcionalidad:**

El contrato `VendorV2` hereda funcionalidades de varios otros contratos y librerías para lograr sus objetivos:

1.  **`Administered` (`./security/Administered.sol`):**
    *   Implementa un sistema de control de acceso basado en roles.
    *   Define dos roles principales: `Admin` (administrador) y `User` (usuario).
    *   El desplegador inicial obtiene el rol `Admin`.
    *   **Funciones Clave (heredadas):** `addAdmin`, `removeAdmin`, `isAdmin`, `addUser`, `removeUser`, `isUser`. Estas funciones permiten gestionar quién puede ejecutar acciones privilegiadas.
2.  **`WithdrawV2` (`./helpers/WithdrawV2.sol`):**
    *   Proporciona la lógica para que el administrador retire los fondos acumulados en el contrato.
    *   **Funciones Clave (heredadas):** `withdrawToken` (para tokens ERC20), `withdrawNative` (para el token nativo).
3.  **`ReentrancyGuard` (`@openzeppelin/contracts/security/ReentrancyGuard.sol`):**
    *   Un modificador estándar de OpenZeppelin (`nonReentrant`) para prevenir ataques de reentrada en funciones críticas que involucran transferencias de valor o cambios de estado externos. Se aplica a las funciones de compra, transferencia reservada y reembolso.
4.  **`CollectionV2` (`./factories/CollectionV2.sol`):**
    *   Permite gestionar las colecciones de NFT que se venderán a través del vendor.
    *   Cada colección (`CollectionStruct`) almacena la dirección del contrato NFT (`addr`), su precio en USD (`price`) y su estado (`active`).
    *   **Funciones Clave (heredadas):** `addCollection`, `updateCollection`, `setActiveCollection`, `getCollection`.
5.  **`OracleV2` (`./helpers/OracleV2.sol`):**
    *   Gestiona la lista de tokens aceptados como pago (ERC20 y nativo) y obtiene sus precios en USD utilizando oráculos de Chainlink.
    *   Define la estructura `ERC20List` para almacenar información del token (dirección, feed de precio, estado, si es nativo).
    *   **Funciones Clave (heredadas):** `addToken`, `updateToken`, `setActiveToken`, `updateFeed`, `isToken`, `getTokenByAddr`, `parseUSDtoToken` (convierte un monto en USD a la cantidad equivalente en un token específico).
6.  **`Group` (`./patners/Group.sol`):**
    *   Implementa un sistema para distribuir un porcentaje de los ingresos de las ventas a grupos predefinidos de direcciones (socios, afiliados, etc.).
    *   **Funciones Clave (heredadas):** `addGroup`, `updateGroup`, `addMember`, `removeMember`, `distribution` (llamada internamente durante las compras para repartir los fondos según la configuración del grupo).

**Variables de Estado Principales:**

*   `investments (mapping(address => mapping(address => uint256)))`: Almacena la cantidad total invertida por cada usuario (`address`) para cada token (`address`) utilizado en las compras. Se usa principalmente para la lógica de reembolso.
*   `refundEnabled (mapping(address => bool))`: Indica si una dirección de usuario específica tiene permitido solicitar reembolsos. Controlado por el administrador.
*   `refundActive (bool public)`: Un interruptor global para activar o desactivar la funcionalidad de reembolso en todo el contrato. Controlado por el administrador.

**Funciones Principales del Contrato `VendorV2`:**

*   **`transferReserved(uint256 _idx, address _addr, uint256 _qty)`:**
    *   **Propósito:** Permite a una entidad con rol `User` mintear (transferir) una cantidad (`_qty`) de NFTs de una colección activa (`_idx`) directamente a una dirección (`_addr`).
    *   **Restricciones:** Solo puede ser llamada por una dirección con rol `User` (`onlyUser`). Protegida contra reentrada (`nonReentrant`). La colección debe estar activa.
    *   **Lógica:** Llama a la función interna `_sendNFTs`.
*   **`buyWithToken(string calldata _group, address _token, uint256 _cIdx, uint256 _amount)`:**
    *   **Propósito:** Permite a cualquier usuario comprar una cantidad (`_amount`) de NFTs de una colección activa (`_cIdx`) pagando con un token ERC20 (`_token`) previamente configurado y activo.
    *   **Restricciones:** Protegida contra reentrada (`nonReentrant`). La colección debe estar activa. El token debe ser un ERC20 válido, activo y no nativo. El usuario debe tener suficiente balance del token y haber aprobado al contrato `VendorV2` para gastar la cantidad necesaria.
    *   **Lógica:**
        1.  Valida las entradas y estados.
        2.  Calcula el costo total en el token ERC20 usando `parseUSDtoToken` (precio colección \* cantidad).
        3.  Verifica el balance y la aprobación (`allowance`) del usuario.
        4.  Transfiere los tokens ERC20 desde el usuario al contrato (`transferFrom`).
        5.  Registra la cantidad pagada en `investments`.
        6.  Llama a `distribution` del módulo `Group` para distribuir una parte de los fondos si se especifica un grupo (`_group`).
        7.  Llama a `_sendNFTs` para mintear los NFTs al comprador (`_msgSender()`).
*   **`buyNative(string calldata _group, uint256 _cIdx, address _token, uint256 _amount)`:**
    *   **Propósito:** Permite a cualquier usuario comprar una cantidad (`_amount`) de NFTs de una colección activa (`_cIdx`) pagando con el token nativo de la blockchain (e.g., ETH). El parámetro `_token` debe ser la dirección del token nativo configurado en `OracleV2`.
    *   **Restricciones:** Protegida contra reentrada (`nonReentrant`). La colección debe estar activa. El token debe ser el nativo configurado y activo. El usuario debe enviar suficiente valor (`msg.value`) junto con la transacción.
    *   **Lógica:**
        1.  Valida las entradas y estados (incluyendo `msg.value`).
        2.  Calcula el costo total en el token nativo usando `parseUSDtoToken`.
        3.  Verifica que `msg.value` sea suficiente.
        4.  Registra la cantidad pagada (`msg.value`) en `investments`.
        5.  Llama a `distribution` del módulo `Group` para distribuir una parte de los fondos si se especifica un grupo (`_group`).
        6.  Llama a `_sendNFTs` para mintear los NFTs al comprador (`_msgSender()`).
*   **`_sendNFTs(address _token, address _to, uint256 _qty)` (privada):**
    *   **Propósito:** Función interna responsable de interactuar con el contrato de la colección NFT para mintear la cantidad (`_qty`) de tokens a la dirección del comprador (`_to`).
    *   **Lógica:** Llama a la función `mintReserved` en el contrato NFT (`_token`) especificado (asume que el contrato NFT implementa la interfaz `INFTCollection` con esa función). *Nota: Requiere que el contrato `VendorV2` tenga permisos para llamar a `mintReserved` en el contrato NFT.*

**Funciones de Reembolso:**

*   **`setRefundEnabled(address _wallet, bool _enabled)`:**
    *   **Propósito:** Permite al administrador (`onlyAdmin`) habilitar o deshabilitar la capacidad de una wallet específica (`_wallet`) para solicitar reembolsos.
*   **`setRefundActive(bool _active)`:**
    *   **Propósito:** Permite al administrador (`onlyAdmin`) activar o desactivar globalmente la funcionalidad de reembolso para todo el contrato.
*   **`refundInvestment(uint256 _cIdx, address _token, uint256 _nftId)`:**
    *   **Propósito:** Permite a un usuario (si `refundActive` es true y `refundEnabled` es true para su wallet) devolver un NFT (`_nftId`) de una colección (`_cIdx`) y recibir de vuelta la cantidad original que invirtió (`investments`) en el token específico (`_token`, sea ERC20 o nativo) que usó para comprarlo.
    *   **Restricciones:** Protegida contra reentrada (`nonReentrant`). `refundActive` debe ser true. `refundEnabled[_msgSender()]` debe ser true. El usuario debe tener una inversión registrada (`investments`) para ese token. El usuario (`_msgSender()`) debe ser el propietario actual del NFT (`_nftId`) según el contrato de la colección.
    *   **Lógica:**
        1.  Verifica todas las condiciones.
        2.  Transfiere el NFT desde el usuario de vuelta al contrato `VendorV2` (`transferFrom` en el contrato NFT).
        3.  Pone a cero la inversión registrada (`investments`) para ese usuario y token para prevenir reembolsos dobles.
        4.  Verifica si el token de reembolso es nativo o ERC20.
        5.  Verifica si el contrato `VendorV2` tiene suficiente balance del token a reembolsar.
        6.  Transfiere la cantidad invertida de vuelta al usuario (usando `call{value: ...}` para nativo o `transfer` para ERC20).
*   **`withdrawNFT(address _nftAddress, uint256 _nftId, address _to)`:**
    *   **Propósito:** Permite al administrador (`onlyAdmin`) retirar un NFT específico (`_nftId`) que esté en posesión del contrato `VendorV2` (por ejemplo, después de un reembolso) y enviarlo a otra dirección (`_to`).
    *   **Lógica:** Llama a `transferFrom` en el contrato NFT (`_nftAddress`).

**Función `receive()`:**

*   `receive() external payable {}`: Una función especial que permite al contrato recibir directamente el token nativo (ej. ETH, CELO) sin necesidad de llamar a una función específica. Esencial para que `buyNative` funcione correctamente cuando los usuarios envían fondos.

**Configuración del Contrato (Pasos Post-Despliegue):**

Una vez desplegado el contrato `VendorV2`, el administrador (la cuenta desplegadora) debe realizar las siguientes configuraciones para que sea funcional:

1.  **Añadir Tokens Aceptados:**
    *   Para cada token ERC20 que se aceptará como pago: Llamar a `addToken`, proporcionando la dirección del token, la dirección del feed de precios de Chainlink correspondiente (ej. TOKEN/USD), y si es nativo (false para ERC20).
    *   Para el token nativo (ej. ETH): Llamar a `addToken`, proporcionando una dirección representativa (puede ser una dirección predefinida como WETH o una dirección zero/placeholder si el oráculo soporta ETH/USD directamente), la dirección del feed de precios (ej. ETH/USD), y marcar `isNative` como `true`.
    *   Activar los tokens añadidos usando `setActiveToken`.
2.  **Añadir Colecciones NFT:**
    *   Para cada colección NFT que se venderá: Llamar a `addCollection`, proporcionando la dirección del contrato NFT, y el precio de cada NFT en USD (como un entero, ej. 1000 para $10.00 USD si se asumen 2 decimales implícitos - verificar cómo `parseUSDtoToken` maneja los decimales).
    *   Activar las colecciones usando `setActiveCollection`.
    *   **Importante:** Asegurarse de que el contrato `VendorV2` tenga los permisos necesarios (ej. rol de minter) en cada contrato de colección NFT para poder llamar a `mintReserved` (o la función equivalente de minting).
3.  **Configurar Grupos (Opcional):**
    *   Si se usará la distribución de ingresos:
        *   Crear grupos usando `addGroup`, especificando un nombre y el porcentaje de distribución.
        *   Añadir miembros a cada grupo usando `addMember`.
4.  **Gestionar Roles (Opcional):**
    *   Añadir otras direcciones como administradores usando `addAdmin` si es necesario.
    *   Añadir direcciones como usuarios (`User`) usando `addUser` si se va a utilizar la función `transferReserved`.
5.  **Configurar Reembolsos (Opcional):**
    *   Si se desea habilitar los reembolsos:
        *   Activar globalmente con `setRefundActive(true)`.
        *   Habilitar wallets específicas para reembolsos con `setRefundEnabled(walletAddress, true)`.

**Despliegue del Contrato:**

*   El despliegue se realiza utilizando un framework como Hardhat o Truffle.
*   Se necesita un script de despliegue (como el `scripts/deploy.js` mencionado en el `README` inicial) que:
    1.  Compile el contrato `VendorV2` y sus dependencias.
    2.  Despliegue el contrato a la red deseada (local, testnet, mainnet).
    3.  La dirección que ejecuta el script de despliegue se convertirá automáticamente en el primer `Admin`.
*   Es crucial pasar los argumentos correctos al constructor del contrato si los tuviera (aunque `VendorV2` parece no tener argumentos en su constructor directo, los contratos heredados como `Administered` establecen al desplegador como admin).
*   Después del despliegue, se debe proceder con los pasos de configuración mencionados anteriormente.

---
