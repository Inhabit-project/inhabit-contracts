# INHABIT Vendor NFT - Plataforma de Venta de NFTs

## 📋 Descripción General

INHABIT Vendor NFT es una plataforma descentralizada que permite la venta de NFTs de múltiples colecciones, aceptando pagos en diferentes tokens ERC20 y tokens nativos (como ETH, MATIC, CELO). La plataforma incluye funcionalidades avanzadas como distribución de ingresos, sistema de reembolsos y gestión de roles.

## 🚀 Características Principales

- **Venta de NFTs**: Compra de NFTs de diferentes colecciones
- **Múltiples Métodos de Pago**: Acepta tokens ERC20 y tokens nativos
- **Sistema de Reembolsos**: Opción de devolución de NFTs con reembolso
- **Distribución de Ingresos**: Reparto automático de ganancias entre grupos
- **Gestión de Roles**: Sistema de permisos para administradores y usuarios
- **Oracles de Precios**: Integración con Chainlink para precios en tiempo real

## 🏗️ Arquitectura del Proyecto

### Contratos Principales

1. **VendorV2.sol** - Contrato Principal
   - Gestiona la venta de NFTs
   - Funcionalidades:
     - Compra con tokens ERC20 (`buyWithToken`)
     - Compra con token nativo (`buyNative`)
     - Transferencia reservada (`transferReserved`)
     - Sistema de reembolsos (`refundInvestment`)
     - Retiro de NFTs (`withdrawNFT`)

2. **CollectionV2.sol** - Gestión de Colecciones
   - Estructura `CollectionStruct`:
     ```solidity
     struct CollectionStruct {
         address addr;    // Dirección del contrato NFT
         uint256 price;   // Precio en USD
         bool active;     // Estado de la colección
     }
     ```
   - Funciones principales:
     - `addCollection`: Añadir nueva colección
     - `updateCollection`: Actualizar colección existente
     - `getCollectionByAddr`: Obtener información de colección

3. **OracleV2.sol** - Gestión de Precios
   - Integración con Chainlink
   - Funciones principales:
     - `parseUSDtoToken`: Conversión USD a tokens
     - `getUSDPrice`: Obtener precio en USD
     - `calculatePercentage`: Cálculo de porcentajes

4. **Group.sol** - Distribución de Ingresos
   - Estructuras:
     ```solidity
     struct GroupStruct {
         string group;
         bool state;
         Shared[] arrayShared;
     }
     struct Shared {
         address addr;
         uint256 pcng;
     }
     ```
   - Funciones principales:
     - `addGroup`: Crear nuevo grupo
     - `distribution`: Distribuir fondos
     - `updateGroupStatus`: Actualizar estado

5. **Administered.sol** - Control de Acceso
   - Roles:
     - Admin: Permisos completos
     - User: Permisos limitados
   - Funciones principales:
     - `addAdmin`/`removeAdmin`
     - `addUser`/`removeUser`
     - `isAdmin`/`isUser`

6. **WithdrawV2.sol** - Gestión de Retiros
   - Funciones principales:
     - `withdraw`: Retiro de tokens nativos
     - `withdrawToken`: Retiro de tokens ERC20

## 🔧 Configuración Técnica

### Requisitos
- Node.js 14+
- Hardhat
- Dependencias:
  - OpenZeppelin Contracts
  - Chainlink Oracles

### Instalación
```bash
npm install
```

### Despliegue
```bash
npx hardhat run scripts/deploy.js --network <red>
```

## 📚 Guía de Uso

### Para Administradores
1. **Configurar Tokens Aceptados**
   ```solidity
   addToken(address token, address priceFeed, bool isNative)
   ```

2. **Gestionar Colecciones**
   ```solidity
   addCollection(address nftAddress, uint256 price)
   ```

3. **Configurar Grupos**
   ```solidity
   addGroup(string name, bool state, Shared[] memory groups)
   ```

### Para Usuarios
1. **Compra con Token ERC20**
   ```solidity
   buyWithToken(string group, address token, uint256 collectionId, uint256 amount)
   ```

2. **Compra con Token Nativo**
   ```solidity
   buyNative(string group, uint256 collectionId, address token, uint256 amount)
   ```

3. **Solicitar Reembolso**
   ```solidity
   refundInvestment(uint256 collectionId, address token, uint256 nftId)
   ```

## 🔒 Seguridad

- **ReentrancyGuard**: Protección contra ataques de reentrada
- **AccessControl**: Sistema de roles y permisos
- **Validaciones**: Comprobaciones de saldo y aprobaciones
- **SafeMath**: Operaciones matemáticas seguras

## 🧪 Testing

El proyecto incluye contratos mock para testing:
- `MockOracleV2.sol`: Simula oráculos de precios
- `MockErc20.sol`: Simula tokens ERC20

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama de características (`git checkout -b feature/AmazingFeature`)
3. Commit de cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Distribuido bajo la licencia MIT. Ver `LICENSE` para más información.

## 📞 Contacto

Para consultas técnicas o soporte, contactar al equipo de desarrollo.
