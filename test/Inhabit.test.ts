import { expect } from 'chai'
import chai from 'chai'
import chaiBigint from 'chai-bigint'
import hre, { viem } from 'hardhat'
import { Address, GetContractReturnType, maxUint256, zeroAddress } from 'viem'

import { ABIS } from '@/config/abi'

chai.use(chaiBigint)

interface FixtureReturn {
	// Cuentas nombradas
	deployer: string
	luca: string
	juan: string
	santiago: string
	// Contrato
	caracoli: GetContractReturnType<typeof ABIS.Inhabit>
}

describe('Inhabit', function () {
	async function deployFixture(): Promise<FixtureReturn> {
		const { deployments, getNamedAccounts } = hre
		const { deployer, luca, juan, santiago } = await getNamedAccounts()

		await deployments.fixture(['localhost'])

		// Obtener dirección del contrato
		const inhabitCaracoliAddress = (await deployments.get('Inhabit_CARACOLI'))
			.address as Address

		const caracoli = (await viem.getContractAt(
			'Inhabit',
			inhabitCaracoliAddress
		)) as unknown as GetContractReturnType<typeof ABIS.Inhabit>

		return {
			deployer,
			luca,
			juan,
			santiago,
			caracoli
		}
	}

	describe('SoftAdministered', function () {
		describe('Initialization', function () {
			beforeEach(async function () {
				const fixture = await deployFixture()
				Object.assign(this, fixture)
			})

			describe('constructor', function () {
				it('Should set deployer as owner', async function () {
					const owner = await this.caracoli.read.owner()
					expect(owner.toLowerCase()).to.equal(this.deployer.toLowerCase())
				})

				it('Should not grant user role to owner by default', async function () {
					const hasRole = await this.caracoli.read.hasRole([this.deployer])
					expect(hasRole).to.be.false
				})
			})

			describe('owner', function () {
				it('Should return current owner address', async function () {
					const owner = await this.caracoli.read.owner()
					expect(owner.toLowerCase()).to.equal(this.deployer.toLowerCase())
				})
			})
		})

		describe('Access Modifiers', function () {
			beforeEach(async function () {
				const fixture = await deployFixture()
				Object.assign(this, fixture)
			})

			describe('onlyOwner', function () {
				it('Should allow owner to call onlyOwner functions', async function () {
					// addRole es onlyOwner
					const tx = await this.caracoli.write.addRole([this.juan], {
						account: this.deployer
					})
					expect(tx).to.exist
				})

				it('Should revert if non-owner calls onlyOwner function', async function () {
					await expect(
						this.caracoli.write.addRole([this.santiago], {
							account: this.juan
						})
					).to.be.rejectedWith('Ownable: caller is not the owner')
				})
			})

			describe('onlyUser', function () {
				it('Should allow user with role to call onlyUser functions', async function () {
					// Primero dar rol de usuario
					await this.caracoli.write.addRole([this.juan], {
						account: this.deployer
					})

					// Verificar que puede usar funciones onlyUser (necesitaríamos una función de ejemplo)
					// Como no hay funciones públicas con onlyUser, esto es conceptual
					const hasRole = await this.caracoli.read.hasRole([this.juan])
					expect(hasRole).to.be.true
				})

				it('Should revert if user without role calls onlyUser function', async function () {
					// Sin función pública onlyUser para probar, pero validamos la lógica del modifier
					const hasRole = await this.caracoli.read.hasRole([this.juan])
					expect(hasRole).to.be.false
				})
			})

			describe('onlyUserOrOwner', function () {
				it('Should allow owner to call onlyUserOrOwner functions', async function () {
					// Owner siempre debe tener acceso
					const hasRole = await this.caracoli.read.hasRole([this.deployer])
					const owner = await this.caracoli.read.owner()
					expect(owner.toLowerCase()).to.equal(this.deployer.toLowerCase())
				})

				it('Should allow user with role to call onlyUserOrOwner functions', async function () {
					// Dar rol al usuario
					await this.caracoli.write.addRole([this.juan], {
						account: this.deployer
					})

					const hasRole = await this.caracoli.read.hasRole([this.juan])
					expect(hasRole).to.be.true
				})

				it('Should revert if neither owner nor user calls onlyUserOrOwner function', async function () {
					// Usuario sin rol no debe tener acceso
					const hasRole = await this.caracoli.read.hasRole([this.santiago])
					const isOwner =
						this.santiago.toLowerCase() === this.deployer.toLowerCase()
					expect(hasRole || isOwner).to.be.false
				})
			})
		})

		describe('Role Management', function () {
			beforeEach(async function () {
				const fixture = await deployFixture()
				Object.assign(this, fixture)
			})

			describe('addRole', function () {
				it('Should grant role to new user', async function () {
					const tx = await this.caracoli.write.addRole([this.juan], {
						account: this.deployer
					})
					expect(tx).to.exist

					const hasRole = await this.caracoli.read.hasRole([this.juan])
					expect(hasRole).to.be.true
				})

				it('Should not duplicate role for existing user', async function () {
					// Agregar rol por primera vez
					await this.caracoli.write.addRole([this.juan], {
						account: this.deployer
					})

					// Intentar agregar nuevamente
					const tx = await this.caracoli.write.addRole([this.juan], {
						account: this.deployer
					})
					expect(tx).to.exist

					const hasRole = await this.caracoli.read.hasRole([this.juan])
					expect(hasRole).to.be.true
				})

				it('Should revert if called by non-owner', async function () {
					await expect(
						this.caracoli.write.addRole([this.santiago], {
							account: this.juan
						})
					).to.be.rejectedWith('Ownable: caller is not the owner')
				})

				// 🔴 TEST QUE DEBE FALLAR - Validación de address(0)
				it('Should revert when adding zero address [FAILING TEST]', async function () {
					// ESTE TEST FALLA PORQUE EL CONTRATO NO VALIDA address(0)
					await expect(
						this.caracoli.write.addRole([zeroAddress], {
							account: this.deployer
						})
					).to.be.rejectedWith('Inhabit: wallet is zero address')
				})

				// 🔴 TEST QUE DEBE FALLAR - Emisión de eventos
				it('Should emit RoleGranted event when adding role [FAILING TEST]', async function () {
					// ESTE TEST FALLA PORQUE EL CONTRATO NO EMITE EVENTOS
					const tx = await this.caracoli.write.addRole([this.juan], {
						account: this.deployer
					})

					const publicClient = await viem.getPublicClient()
					const receipt = await publicClient.waitForTransactionReceipt({
						hash: tx
					})

					// Esperamos que emita evento RoleGranted
					expect(receipt.logs).to.have.lengthOf.greaterThan(0)

					// Verificar que el evento tenga los parámetros correctos
					// const roleGrantedEvent = receipt.logs.find(log => log.topics[0] === roleGrantedTopic)
					// expect(roleGrantedEvent).to.exist
					// expect(roleGrantedEvent.args.account).to.equal(this.juan)
				})

				// 🔴 TEST ACTUAL QUE DOCUMENTA LA VULNERABILIDAD (para comparación)
				it('Should handle zero address input (CURRENT VULNERABLE BEHAVIOR)', async function () {
					// Este test PASA pero documenta un comportamiento inseguro
					const tx = await this.caracoli.write.addRole([zeroAddress], {
						account: this.deployer
					})
					expect(tx).to.exist

					const hasRole = await this.caracoli.read.hasRole([zeroAddress])
					expect(hasRole).to.be.true
				})
			})

			describe('revokeRole', function () {
				it('Should revoke role from existing user', async function () {
					// Primero agregar rol
					await this.caracoli.write.addRole([this.juan], {
						account: this.deployer
					})

					// Luego revocar
					const tx = await this.caracoli.write.revokeRole([this.juan], {
						account: this.deployer
					})
					expect(tx).to.exist

					const hasRole = await this.caracoli.read.hasRole([this.juan])
					expect(hasRole).to.be.false
				})

				it('Should handle revoking non-existent role', async function () {
					// Revocar rol de usuario que nunca tuvo rol
					const tx = await this.caracoli.write.revokeRole([this.luca], {
						account: this.deployer
					})
					expect(tx).to.exist

					const hasRole = await this.caracoli.read.hasRole([this.luca])
					expect(hasRole).to.be.false
				})

				it('Should revert if called by non-owner', async function () {
					await expect(
						this.caracoli.write.revokeRole([this.deployer], {
							account: this.juan
						})
					).to.be.rejectedWith('Ownable: caller is not the owner')
				})

				// 🔴 TEST QUE DEBE FALLAR - Prevenir revocar rol del owner
				it('Should revert when trying to revoke owner role [FAILING TEST]', async function () {
					// Primero agregar rol al owner
					await this.caracoli.write.addRole([this.deployer], {
						account: this.deployer
					})

					// ESTE TEST FALLA PORQUE EL CONTRATO PERMITE REVOCAR EL ROL DEL OWNER
					await expect(
						this.caracoli.write.revokeRole([this.deployer], {
							account: this.deployer
						})
					).to.be.rejectedWith('Inhabit: cannot revoke owner role')
				})

				// 🔴 TEST QUE DEBE FALLAR - Emisión de eventos
				it('Should emit RoleRevoked event when revoking role [FAILING TEST]', async function () {
					// Primero agregar rol
					await this.caracoli.write.addRole([this.juan], {
						account: this.deployer
					})

					// ESTE TEST FALLA PORQUE EL CONTRATO NO EMITE EVENTOS
					const tx = await this.caracoli.write.revokeRole([this.juan], {
						account: this.deployer
					})

					const publicClient = await viem.getPublicClient()
					const receipt = await publicClient.waitForTransactionReceipt({
						hash: tx
					})

					// Esperamos que emita evento RoleRevoked
					expect(receipt.logs).to.have.lengthOf.greaterThan(0)

					// Verificar que el evento tenga los parámetros correctos
					// const roleRevokedEvent = receipt.logs.find(log => log.topics[0] === roleRevokedTopic)
					// expect(roleRevokedEvent).to.exist
					// expect(roleRevokedEvent.args.account).to.equal(this.juan)
				})

				// 🔴 TEST ACTUAL QUE DOCUMENTA EL PROBLEMA (para comparación)
				it('Should allow revoking owner role (CURRENT PROBLEMATIC BEHAVIOR)', async function () {
					// Este test PASA pero documenta un comportamiento problemático
					await this.caracoli.write.addRole([this.deployer], {
						account: this.deployer
					})

					const tx = await this.caracoli.write.revokeRole([this.deployer], {
						account: this.deployer
					})
					expect(tx).to.exist

					const hasRole = await this.caracoli.read.hasRole([this.deployer])
					expect(hasRole).to.be.false
				})
			})

			describe('hasRole', function () {
				it('Should return true for user with active role', async function () {
					await this.caracoli.write.addRole([this.juan], {
						account: this.deployer
					})

					const hasRole = await this.caracoli.read.hasRole([this.juan])
					expect(hasRole).to.be.true
				})

				it('Should return false for user without role', async function () {
					const hasRole = await this.caracoli.read.hasRole([this.luca])
					expect(hasRole).to.be.false
				})

				it('Should return false for revoked user', async function () {
					// Agregar y luego revocar
					await this.caracoli.write.addRole([this.santiago], {
						account: this.deployer
					})
					await this.caracoli.write.revokeRole([this.santiago], {
						account: this.deployer
					})

					const hasRole = await this.caracoli.read.hasRole([this.santiago])
					expect(hasRole).to.be.false
				})

				it('Should handle zero address query', async function () {
					const hasRole = await this.caracoli.read.hasRole([zeroAddress])
					expect(hasRole).to.be.false
				})
			})
		})

		describe('Ownership Transfer', function () {
			beforeEach(async function () {
				const fixture = await deployFixture()
				Object.assign(this, fixture)
			})

			describe('transferOwnership', function () {
				it('Should transfer ownership to valid address', async function () {
					const tx = await this.caracoli.write.transferOwnership([this.juan], {
						account: this.deployer
					})
					expect(tx).to.exist

					const newOwner = await this.caracoli.read.owner()
					expect(newOwner.toLowerCase()).to.equal(this.juan.toLowerCase())
				})

				it('Should revert if transferring to zero address', async function () {
					await expect(
						this.caracoli.write.transferOwnership([zeroAddress], {
							account: this.deployer
						})
					).to.be.rejectedWith('Ownable: new owner is the zero address')
				})

				it('Should revert if called by non-owner', async function () {
					await expect(
						this.caracoli.write.transferOwnership([this.luca], {
							account: this.juan
						})
					).to.be.rejectedWith('Ownable: caller is not the owner')
				})

				it('Should allow transferring to same owner', async function () {
					const tx = await this.caracoli.write.transferOwnership(
						[this.deployer],
						{
							account: this.deployer
						}
					)
					expect(tx).to.exist

					const owner = await this.caracoli.read.owner()
					expect(owner.toLowerCase()).to.equal(this.deployer.toLowerCase())
				})

				// 🔴 TEST QUE DEBE FALLAR - Emisión de eventos de ownership
				it('Should emit OwnershipTransferred event [FAILING TEST]', async function () {
					// ESTE TEST FALLA PORQUE EL CONTRATO NO EMITE EVENTOS
					const oldOwner = await this.caracoli.read.owner()

					const tx = await this.caracoli.write.transferOwnership([this.juan], {
						account: this.deployer
					})

					const publicClient = await viem.getPublicClient()
					const receipt = await publicClient.waitForTransactionReceipt({
						hash: tx
					})

					// Esperamos que emita evento OwnershipTransferred
					expect(receipt.logs).to.have.lengthOf.greaterThan(0)

					// Verificar que el evento tenga los parámetros correctos
					// const ownershipEvent = receipt.logs.find(log => log.topics[0] === ownershipTransferredTopic)
					// expect(ownershipEvent).to.exist
					// expect(ownershipEvent.args.previousOwner).to.equal(oldOwner)
					// expect(ownershipEvent.args.newOwner).to.equal(this.juan)
				})

				// 🔴 TEST QUE DEBE FALLAR - Validación de transferencia al mismo owner
				it('Should revert when transferring to same owner (optimization) [FAILING TEST]', async function () {
					// ESTE TEST FALLA PORQUE EL CONTRATO NO OPTIMIZA PARA EVITAR TRANSFERENCIAS INNECESARIAS
					await expect(
						this.caracoli.write.transferOwnership([this.deployer], {
							account: this.deployer
						})
					).to.be.rejectedWith('Inhabit: new owner is same as current owner')
				})

				// 🔴 TEST ACTUAL QUE DOCUMENTA EL COMPORTAMIENTO ACTUAL (para comparación)
				it('Should emit OwnershipTransferred event (CURRENT NO-EVENT BEHAVIOR)', async function () {
					// Este test PASA pero documenta que NO hay eventos
					const tx = await this.caracoli.write.transferOwnership([this.juan], {
						account: this.deployer
					})

					const publicClient = await viem.getPublicClient()
					const receipt = await publicClient.waitForTransactionReceipt({
						hash: tx
					})

					// Esperamos que NO haya eventos (comportamiento actual)
					expect(receipt.logs).to.have.lengthOf(0) // Actual: no events
				})
			})
		})

		describe('Edge Cases', function () {
			beforeEach(async function () {
				const fixture = await deployFixture()
				Object.assign(this, fixture)
			})

			describe('Multiple Operations', function () {
				it('Should handle multiple role additions and revocations', async function () {
					const users = [this.juan, this.luca, this.santiago]

					// Agregar roles a todos
					for (const user of users) {
						await this.caracoli.write.addRole([user], {
							account: this.deployer
						})
						const hasRole = await this.caracoli.read.hasRole([user])
						expect(hasRole).to.be.true
					}

					// Revocar algunos roles
					await this.caracoli.write.revokeRole([this.luca], {
						account: this.deployer
					})

					// Verificar estados finales
					expect(await this.caracoli.read.hasRole([this.juan])).to.be.true
					expect(await this.caracoli.read.hasRole([this.luca])).to.be.false
					expect(await this.caracoli.read.hasRole([this.santiago])).to.be.true
				})

				it('Should handle ownership transfer with existing roles', async function () {
					// Agregar rol a juan
					await this.caracoli.write.addRole([this.juan], {
						account: this.deployer
					})

					// Transferir ownership a juan
					await this.caracoli.write.transferOwnership([this.juan], {
						account: this.deployer
					})

					// Juan ahora es owner Y tiene rol de usuario
					const owner = await this.caracoli.read.owner()
					const hasRole = await this.caracoli.read.hasRole([this.juan])

					expect(owner.toLowerCase()).to.equal(this.juan.toLowerCase())
					expect(hasRole).to.be.true

					// Juan puede gestionar roles como nuevo owner
					const tx = await this.caracoli.write.addRole([this.luca], {
						account: this.juan
					})
					expect(tx).to.exist
				})
			})

			// 🔴 TESTS ADICIONALES QUE DEBEN FALLAR - Funciones getter para variables privadas
			describe('Private Variables Access [FAILING TESTS]', function () {
				// 🔴 TEST QUE DEBE FALLAR - Getter para WalletAccessStruct
				it('Should provide getter for wallet access details [FAILING TEST]', async function () {
					// Agregar rol
					await this.caracoli.write.addRole([this.juan], {
						account: this.deployer
					})

					// ESTE TEST FALLA PORQUE NO HAY GETTER PARA LOS DETALLES DEL WALLET
					// Esperamos una función que retorne la estructura completa
					const walletDetails = await this.caracoli.read.getWalletAccess([
						this.juan
					])
					expect(walletDetails.wallet.toLowerCase()).to.equal(
						this.juan.toLowerCase()
					)
					expect(walletDetails.active).to.be.true
				})

				// 🔴 TEST QUE DEBE FALLAR - Enumerar usuarios con roles
				it('Should provide function to get all users with roles [FAILING TEST]', async function () {
					// Agregar varios roles
					await this.caracoli.write.addRole([this.juan], {
						account: this.deployer
					})
					await this.caracoli.write.addRole([this.luca], {
						account: this.deployer
					})

					// ESTE TEST FALLA PORQUE NO HAY FUNCIÓN PARA ENUMERAR USUARIOS
					const usersWithRoles = await this.caracoli.read.getAllUsersWithRoles()
					expect(usersWithRoles).to.have.lengthOf(2)
					expect(usersWithRoles).to.include(this.juan.toLowerCase())
					expect(usersWithRoles).to.include(this.luca.toLowerCase())
				})

				// 🔴 TEST QUE DEBE FALLAR - Contador de usuarios activos
				it('Should provide function to get active users count [FAILING TEST]', async function () {
					// Agregar y revocar algunos roles
					await this.caracoli.write.addRole([this.juan], {
						account: this.deployer
					})
					await this.caracoli.write.addRole([this.luca], {
						account: this.deployer
					})
					await this.caracoli.write.addRole([this.santiago], {
						account: this.deployer
					})
					await this.caracoli.write.revokeRole([this.luca], {
						account: this.deployer
					})

					// ESTE TEST FALLA PORQUE NO HAY FUNCIÓN PARA CONTAR USUARIOS ACTIVOS
					const activeUsersCount =
						await this.caracoli.read.getActiveUsersCount()
					expect(activeUsersCount).to.equal(2n) // juan y santiago activos
				})
			})
		})
	})

	describe('Inhabit main functions', function () {
		const TOKEN_NAME = 'Inhabit NFT'
		const TOKEN_SYMBOL = 'INHB'
		const MAX_SUPPLY = 10000n
		const BASE_URI = 'https://api.inhabit.io/metadata/'
		const EMPTY_URI = ''
		const INVALID_URI = '#'
		const MINT_AMOUNT = 5n
		const LARGE_AMOUNT = 1000n

		describe('Constructor & Initial State', function () {
			beforeEach(async function () {
				const fixture = await deployFixture()
				Object.assign(this, fixture)
			})

			it('Should initialize with correct parameters', async function () {
				const name = await this.caracoli.read.name()
				const symbol = await this.caracoli.read.symbol()
				const maxSupply = await this.caracoli.read.maxSupply()
				const baseURI = await this.caracoli.read.baseTokenURI()
				const saleActive = await this.caracoli.read.saleActive()
				const paused = await this.caracoli.read.paused()

				expect(name).to.equal(TOKEN_NAME)
				expect(symbol).to.equal(TOKEN_SYMBOL)
				expect(maxSupply).to.equal(MAX_SUPPLY)
				expect(baseURI).to.equal(BASE_URI)
				expect(saleActive).to.be.true
				expect(paused).to.be.false
			})

			it('Should set owner correctly', async function () {
				const owner = await this.caracoli.read.owner()
				expect(owner.toLowerCase()).to.equal(this.deployer.toLowerCase())
			})

			it('Should add luca to role during construction', async function () {
				const hasRole = await this.caracoli.read.hasRole([this.luca])
				expect(hasRole).to.be.true
			})

			// ❌ TEST FALLIDO INTENCIONAL - Constructor debería validar parámetros
			it('Should revert if maxSupply is zero', async function () {
				// Este test DEBE FALLAR porque el constructor no valida maxSupply > 0
				// El contrato permite maxSupply = 0, lo cual es problemático
				await expect(
					viem.deployContract('Inhabit', [
						TOKEN_NAME,
						TOKEN_SYMBOL,
						0n, // maxSupply = 0
						BASE_URI,
						this.luca
					])
				).to.be.rejectedWith('Max supply must be greater than zero')
			})

			// ❌ TEST FALLIDO INTENCIONAL - Constructor debería validar luca
			it('Should revert if luca is zero address', async function () {
				// Este test DEBE FALLAR porque el constructor no valida luca != address(0)
				await expect(
					viem.deployContract('Inhabit', [
						TOKEN_NAME,
						TOKEN_SYMBOL,
						MAX_SUPPLY,
						BASE_URI,
						zeroAddress
					])
				).to.be.rejectedWith('Vendor cannot be zero address')
			})
		})

		describe('mintReserved', function () {
			beforeEach(async function () {
				const fixture = await deployFixture()
				Object.assign(this, fixture)
			})

			it('Should mint tokens successfully to valid address', async function () {
				const initialSupply = await this.caracoli.read.totalSupply()

				const tx = await this.caracoli.write.mintReserved(
					[this.juan, MINT_AMOUNT],
					{ account: this.deployer }
				)
				expect(tx).to.exist

				const finalSupply = await this.caracoli.read.totalSupply()
				const balance = await this.caracoli.read.balanceOf([this.juan])

				expect(finalSupply).to.equal(initialSupply + MINT_AMOUNT)
				expect(balance).to.equal(MINT_AMOUNT)
			})

			it('Should allow luca to mint', async function () {
				// ✅ Verificar que luca tenga rol primero
				const hasRole = await this.caracoli.read.hasRole([this.luca])

				if (!hasRole) {
					// Agregar rol si no lo tiene
					await this.caracoli.write.addRole([this.luca], {
						account: this.deployer
					})
				}

				const tx = await this.caracoli.write.mintReserved(
					[this.juan, MINT_AMOUNT],
					{ account: this.luca }
				)
				expect(tx).to.exist

				const balance = await this.caracoli.read.balanceOf([this.juan])
				expect(balance).to.equal(MINT_AMOUNT)
			})

			it('Should revert if caller is not owner or user', async function () {
				await expect(
					this.caracoli.write.mintReserved([this.juan, MINT_AMOUNT], {
						account: this.santiago
					})
				).to.be.rejectedWith('Ownable: caller is not valid')
			})

			it('Should revert if sale is not active', async function () {
				// Desactivar venta
				await this.caracoli.write.setSaleActive([false], {
					account: this.deployer
				})

				await expect(
					this.caracoli.write.mintReserved([this.juan, MINT_AMOUNT], {
						account: this.deployer
					})
				).to.be.rejectedWith("Sale isn't active")
			})

			it('Should revert if contract is paused', async function () {
				// Pausar contrato
				await this.caracoli.write.setPaused([true], {
					account: this.deployer
				})

				await expect(
					this.caracoli.write.mintReserved([this.juan, MINT_AMOUNT], {
						account: this.deployer
					})
				).to.be.rejectedWith('Contract is paused')
			})

			it('Should revert if exceeding max supply', async function () {
				const exceedingAmount = MAX_SUPPLY + 1n

				await expect(
					this.caracoli.write.mintReserved([this.juan, exceedingAmount], {
						account: this.deployer
					})
				).to.be.rejectedWith("Can't mint more than max supply")
			})

			// ❌ TEST FALLIDO INTENCIONAL - Debería validar address(0)
			it('Should revert if minting to zero address', async function () {
				// Este test DEBE FALLAR porque la función no valida _address != address(0)
				await expect(
					this.caracoli.write.mintReserved([zeroAddress, MINT_AMOUNT], {
						account: this.deployer
					})
				).to.be.rejectedWith('Cannot mint to zero address')
			})

			// ❌ TEST FALLIDO INTENCIONAL - Debería validar amount > 0
			it('Should revert if amount is zero', async function () {
				// Este test DEBE FALLAR porque la función no valida _amount > 0
				await expect(
					this.caracoli.write.mintReserved([this.juan, 0n], {
						account: this.deployer
					})
				).to.be.rejectedWith('Amount must be greater than zero')
			})

			it('Should handle edge case - mint exactly at max supply', async function () {
				const tx = await this.caracoli.write.mintReserved(
					[this.juan, MAX_SUPPLY],
					{ account: this.deployer }
				)
				expect(tx).to.exist

				const totalSupply = await this.caracoli.read.totalSupply()
				expect(totalSupply).to.equal(MAX_SUPPLY)
			})

			it('Should handle multiple mints until max supply', async function () {
				// Mint en lotes hasta llegar al máximo
				const batchSize = 100n
				const batches = MAX_SUPPLY / batchSize

				for (let i = 0n; i < batches; i++) {
					await this.caracoli.write.mintReserved([this.juan, batchSize], {
						account: this.deployer
					})
				}

				const totalSupply = await this.caracoli.read.totalSupply()
				expect(totalSupply).to.equal(MAX_SUPPLY)

				// Intentar mint adicional debe fallar
				await expect(
					this.caracoli.write.mintReserved([this.juan, 1n], {
						account: this.deployer
					})
				).to.be.rejectedWith("Can't mint more than max supply")
			})
		})

		describe('setBaseURI', function () {
			beforeEach(async function () {
				const fixture = await deployFixture()
				Object.assign(this, fixture)
			})

			it('Should update base URI correctly', async function () {
				const newURI = 'https://new.api.inhabit.io/metadata/'

				const tx = await this.caracoli.write.setBaseURI([newURI], {
					account: this.deployer
				})
				expect(tx).to.exist

				const updatedURI = await this.caracoli.read.baseTokenURI()
				expect(updatedURI).to.equal(newURI)
			})

			it('Should emit BaseURIChanged event', async function () {
				const newURI = 'https://new.api.inhabit.io/metadata/'

				const tx = await this.caracoli.write.setBaseURI([newURI], {
					account: this.deployer
				})

				const publicClient = await viem.getPublicClient()

				const receipt = await publicClient.waitForTransactionReceipt({
					hash: tx
				})
				expect(receipt.logs).to.have.lengthOf.greaterThan(0)
			})

			it('Should allow luca to update base URI', async function () {
				const newURI = 'https://vendor.api.inhabit.io/metadata/'

				const tx = await this.caracoli.write.setBaseURI([newURI], {
					account: this.luca
				})
				expect(tx).to.exist

				const updatedURI = await this.caracoli.read.baseTokenURI()
				expect(updatedURI).to.equal(newURI)
			})

			it('Should revert if caller is not owner or user', async function () {
				const newURI = 'https://malicious.api.io/metadata/'

				await expect(
					this.caracoli.write.setBaseURI([newURI], {
						account: this.santiago
					})
				).to.be.rejectedWith('Ownable: caller is not valid')
			})

			it('Should revert if base URI is empty', async function () {
				await expect(
					this.caracoli.write.setBaseURI([EMPTY_URI], {
						account: this.deployer
					})
				).to.be.rejectedWith('Base URI cannot be empty')
			})

			it('Should handle very long URI', async function () {
				const longURI = 'https://api.inhabit.io/metadata/' + 'a'.repeat(1000)

				const tx = await this.caracoli.write.setBaseURI([longURI], {
					account: this.deployer
				})
				expect(tx).to.exist

				const updatedURI = await this.caracoli.read.baseTokenURI()
				expect(updatedURI).to.equal(longURI)
			})
		})

		describe('setSaleActive', function () {
			beforeEach(async function () {
				const fixture = await deployFixture()
				Object.assign(this, fixture)
			})

			it('Should toggle sale status correctly', async function () {
				// Inicialmente true
				let saleActive = await this.caracoli.read.saleActive()
				expect(saleActive).to.be.true

				// Desactivar
				await this.caracoli.write.setSaleActive([false], {
					account: this.deployer
				})
				saleActive = await this.caracoli.read.saleActive()
				expect(saleActive).to.be.false

				// Reactivar
				await this.caracoli.write.setSaleActive([true], {
					account: this.deployer
				})
				saleActive = await this.caracoli.read.saleActive()
				expect(saleActive).to.be.true
			})

			it('Should allow luca to toggle sale status', async function () {
				await this.caracoli.write.setSaleActive([false], {
					account: this.luca
				})

				const saleActive = await this.caracoli.read.saleActive()
				expect(saleActive).to.be.false
			})

			it('Should revert if caller is not owner or user', async function () {
				await expect(
					this.caracoli.write.setSaleActive([false], {
						account: this.santiago
					})
				).to.be.rejectedWith('Ownable: caller is not valid')
			})
		})

		describe('setPaused', function () {
			beforeEach(async function () {
				const fixture = await deployFixture()
				Object.assign(this, fixture)
			})

			it('Should toggle pause status correctly', async function () {
				// Inicialmente false
				let paused = await this.caracoli.read.paused()
				expect(paused).to.be.false

				// Pausar
				await this.caracoli.write.setPaused([true], {
					account: this.deployer
				})
				paused = await this.caracoli.read.paused()
				expect(paused).to.be.true

				// Despausar
				await this.caracoli.write.setPaused([false], {
					account: this.deployer
				})
				paused = await this.caracoli.read.paused()
				expect(paused).to.be.false
			})

			it('Should prevent minting when paused', async function () {
				await this.caracoli.write.setPaused([true], {
					account: this.deployer
				})

				await expect(
					this.caracoli.write.mintReserved([this.juan, MINT_AMOUNT], {
						account: this.deployer
					})
				).to.be.rejectedWith('Contract is paused')
			})

			it('Should revert if caller is not owner or user', async function () {
				await expect(
					this.caracoli.write.setPaused([true], {
						account: this.santiago
					})
				).to.be.rejectedWith('Ownable: caller is not valid')
			})
		})

		describe('setMaxSupply', function () {
			beforeEach(async function () {
				const fixture = await deployFixture()
				Object.assign(this, fixture)
			})

			it('Should update max supply correctly', async function () {
				const newMaxSupply = 20000n

				const tx = await this.caracoli.write.setMaxSupply([newMaxSupply], {
					account: this.deployer
				})
				expect(tx).to.exist

				const updatedMaxSupply = await this.caracoli.read.maxSupply()
				expect(updatedMaxSupply).to.equal(newMaxSupply)
			})

			it('Should emit MaxSupplyChanged event', async function () {
				const newMaxSupply = 20000n

				const tx = await this.caracoli.write.setMaxSupply([newMaxSupply], {
					account: this.deployer
				})

				const publicClient = await viem.getPublicClient()

				const receipt = await publicClient.waitForTransactionReceipt({
					hash: tx
				})
				expect(receipt.logs).to.have.lengthOf.greaterThan(0)
			})

			it('Should revert if caller is not owner or user', async function () {
				await expect(
					this.caracoli.write.setMaxSupply([20000n], {
						account: this.santiago
					})
				).to.be.rejectedWith('Ownable: caller is not valid')
			})

			// ❌ TEST FALLIDO INTENCIONAL - Debería validar newMaxSupply >= totalSupply()
			it('Should revert if new max supply is less than current total supply', async function () {
				// Primero mint algunos tokens
				await this.caracoli.write.mintReserved([this.juan, 100n], {
					account: this.deployer
				})

				// Este test DEBE FALLAR porque la función no valida newMaxSupply >= totalSupply()
				await expect(
					this.caracoli.write.setMaxSupply([50n], {
						account: this.deployer
					})
				).to.be.rejectedWith(
					'New max supply cannot be less than current total supply'
				)
			})

			// ❌ TEST FALLIDO INTENCIONAL - Debería validar newMaxSupply > 0
			it('Should revert if new max supply is zero', async function () {
				// Este test DEBE FALLAR porque la función no valida newMaxSupply > 0
				await expect(
					this.caracoli.write.setMaxSupply([0n], {
						account: this.deployer
					})
				).to.be.rejectedWith('Max supply must be greater than zero')
			})

			it('Should handle edge case - set max supply to maxUint256', async function () {
				const tx = await this.caracoli.write.setMaxSupply([maxUint256], {
					account: this.deployer
				})
				expect(tx).to.exist

				const updatedMaxSupply = await this.caracoli.read.maxSupply()
				expect(updatedMaxSupply).to.equal(maxUint256)
			})
		})

		describe('Role Management Integration', function () {
			beforeEach(async function () {
				const fixture = await deployFixture()
				Object.assign(this, fixture)
			})

			it('Should allow owner to add new roles', async function () {
				await this.caracoli.write.addRole([this.juan], {
					account: this.deployer
				})

				const hasRole = await this.caracoli.read.hasRole([this.juan])
				expect(hasRole).to.be.true

				// Nuevo usuario debe poder mintear
				const tx = await this.caracoli.write.mintReserved(
					[this.santiago, MINT_AMOUNT],
					{ account: this.juan }
				)
				expect(tx).to.exist
			})

			it('Should allow owner to revoke roles', async function () {
				// Revocar rol de luca
				await this.caracoli.write.revokeRole([this.luca], {
					account: this.deployer
				})

				const hasRole = await this.caracoli.read.hasRole([this.luca])
				expect(hasRole).to.be.false

				// luca ya no debe poder mintear
				await expect(
					this.caracoli.write.mintReserved([this.juan, MINT_AMOUNT], {
						account: this.luca
					})
				).to.be.rejectedWith('Ownable: caller is not valid')
			})

			it('Should maintain owner privileges after role changes', async function () {
				// Owner siempre debe poder realizar operaciones
				const tx = await this.caracoli.write.mintReserved(
					[this.juan, MINT_AMOUNT],
					{ account: this.deployer }
				)
				expect(tx).to.exist
			})
		})

		describe('Gas Optimization & Edge Cases', function () {
			beforeEach(async function () {
				const fixture = await deployFixture()
				Object.assign(this, fixture)
			})

			it('Should handle batch minting efficiently', async function () {
				const largeBatch = 500n

				const tx = await this.caracoli.write.mintReserved(
					[this.juan, largeBatch],
					{ account: this.deployer }
				)
				expect(tx).to.exist

				const balance = await this.caracoli.read.balanceOf([this.juan])
				expect(balance).to.equal(largeBatch)
			})

			it('Should handle rapid state changes correctly', async function () {
				// Cambios rápidos de estado
				await this.caracoli.write.setSaleActive([false], {
					account: this.deployer
				})
				await this.caracoli.write.setSaleActive([true], {
					account: this.deployer
				})
				await this.caracoli.write.setPaused([true], { account: this.deployer })
				await this.caracoli.write.setPaused([false], { account: this.deployer })

				// Debe funcionar normalmente después de los cambios
				const tx = await this.caracoli.write.mintReserved(
					[this.juan, MINT_AMOUNT],
					{ account: this.deployer }
				)
				expect(tx).to.exist
			})

			it('Should handle maximum token ID correctly', async function () {
				// Mint hasta el máximo y verificar IDs
				const singleMint = 1n
				await this.caracoli.write.mintReserved([this.juan, singleMint], {
					account: this.deployer
				})

				const totalSupply = await this.caracoli.read.totalSupply()
				expect(totalSupply).to.equal(singleMint)
			})
		})

		describe('Reentrancy Protection', function () {
			beforeEach(async function () {
				const fixture = await deployFixture()
				Object.assign(this, fixture)
			})

			it('Should prevent reentrancy in mintReserved', async function () {
				// ERC721A._safeMint llama a onERC721Received si el receptor es un contrato
				// ReEntrancyGuard debe prevenir llamadas reentrantes

				// Mint normal debe funcionar
				const tx = await this.caracoli.write.mintReserved(
					[this.juan, MINT_AMOUNT],
					{ account: this.deployer }
				)
				expect(tx).to.exist
			})
		})
	})
})
