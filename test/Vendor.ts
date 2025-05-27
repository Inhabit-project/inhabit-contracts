import { expect } from 'chai'
import hre, { viem } from 'hardhat'
import { Address, GetContractReturnType, zeroAddress } from 'viem'

import { ABIS } from '@/config/abi'
import { TEST_TOKEN_ONE, TEST_TOKEN_TWO } from '@/config/constants'
import { TokenStruct } from '@/models'

interface FixtureReturn {
	deployer: string
	luca: string
	juan: string
	santiago: string
	mockcUSD: GetContractReturnType<typeof ABIS.MockErc20>
	dataFeeds: GetContractReturnType<typeof ABIS.MockOracleV2>
	vendorV2: GetContractReturnType<typeof ABIS.VendorV2>
}

describe('VendorV2', function () {
	async function deployFixture(): Promise<FixtureReturn> {
		const { deployments, getNamedAccounts } = hre
		const { deployer, luca, juan, santiago } = await getNamedAccounts()

		await deployments.fixture(['all'])

		const vendorV2Address = (await deployments.get('VendorV2'))
			.address as Address

		const mockErc20Address = (await deployments.get('MockErc20'))
			.address as Address

		const mockOracleAddress = (await deployments.get('MockOracleV2'))
			.address as Address

		const mockcUSD = (await viem.getContractAt(
			'MockErc20',
			mockErc20Address
		)) as unknown as GetContractReturnType<typeof ABIS.MockErc20>

		const dataFeeds = (await viem.getContractAt(
			'MockOracleV2',
			mockOracleAddress
		)) as unknown as GetContractReturnType<typeof ABIS.MockOracleV2>

		const vendorV2 = (await viem.getContractAt(
			'VendorV2',
			vendorV2Address
		)) as unknown as GetContractReturnType<typeof ABIS.VendorV2>

		return { deployer, luca, juan, santiago, mockcUSD, dataFeeds, vendorV2 }
	}

	describe.skip('Administered', function () {
		beforeEach(async function () {
			const fixture = await deployFixture()
			this.vendorV2 = fixture.vendorV2
			this.mockcUSD = fixture.mockcUSD
			this.dataFeeds = fixture.dataFeeds
			this.deployer = fixture.deployer
			this.luca = fixture.luca
			this.juan = fixture.juan
			this.santiago = fixture.santiago
		})

		it('Should revert if non-admin tries to add an admin', async function () {
			await expect(
				this.vendorV2.write.addAdmin([this.juan], { account: this.luca })
			).to.be.rejectedWith('Restricted to admins.')
		})

		it('Should allow admin to add another admin', async function () {
			await this.vendorV2.write.addAdmin([this.juan], {
				account: this.deployer
			})

			const isAdmin = await this.vendorV2.read.isAdmin([this.juan])
			expect(isAdmin).to.be.true
		})

		it('Should revert if non-admin tries to add a user', async function () {
			await expect(
				this.vendorV2.write.addUser([this.juan], { account: this.luca })
			).to.be.rejectedWith('Restricted to admins.')
		})

		it('Should allow admin to add a user', async function () {
			await this.vendorV2.write.addUser([this.juan], {
				account: this.deployer
			})

			const isUser = await this.vendorV2.read.isUser([this.juan])
			expect(isUser).to.be.true
		})

		it('Should revert if non-admin tries to remove a user', async function () {
			await expect(
				this.vendorV2.write.removeUser([this.juan], { account: this.luca })
			).to.be.rejectedWith('Restricted to admins.')
		})

		it('Should allow admin to remove a user', async function () {
			await this.vendorV2.write.addUser([this.juan], {
				account: this.deployer
			})

			await this.vendorV2.write.removeUser([this.juan], {
				account: this.deployer
			})

			const isUserAfter = await this.vendorV2.read.isUser([this.juan])
			expect(isUserAfter).to.be.false
		})

		it('Should renounce admin role', async function () {
			await this.vendorV2.write.addUser([this.juan], {
				account: this.deployer
			})

			await this.vendorV2.write.renounceAdmin([], {
				account: this.juan
			})

			const isAdminAfter = await this.vendorV2.read.isAdmin([this.juan])
			expect(isAdminAfter).to.be.false
		})
	})

	describe.skip('WhiteListTokenV2', function () {
		beforeEach(async function () {
			const fixture = await deployFixture()
			this.vendorV2 = fixture.vendorV2
			this.mockcUSD = fixture.mockcUSD
			this.dataFeeds = fixture.dataFeeds
			this.deployer = fixture.deployer
			this.luca = fixture.luca
			this.juan = fixture.juan
			this.santiago = fixture.santiago

			await this.vendorV2.write.addUser([this.luca], {
				account: this.deployer
			})

			await this.vendorV2.write.addUser([this.juan], {
				account: this.deployer
			})
		})

		describe('tokenList', function () {
			it('Should show tokens list', async function () {
				const tokens = await this.vendorV2.read.tokensList()
				expect(tokens).to.be.an('array').that.is.not.empty
			})
		})

		describe('addToken', function () {
			it('Should revert if non-user tries to add a token', async function () {
				await expect(
					this.vendorV2.write.addToken(
						[this.mockcUSD.address, this.dataFeeds.address, 8, true, false],
						{ account: this.santiago }
					)
				).to.be.rejectedWith('Restricted to users.')
			})

			it('Should revert if user tries to add an zero address', async function () {
				await expect(
					this.vendorV2.write.addToken(
						[zeroAddress, this.dataFeeds.address, 8, true, false],
						{ account: this.luca }
					)
				).to.be.rejectedWith('Token already exist')
			})

			it('Should revert if user tries to add a existing token', async function () {
				await expect(
					this.vendorV2.write.addToken(
						[this.mockcUSD.address, this.dataFeeds.address, 8, true, false],
						{ account: this.luca }
					)
				).to.be.rejectedWith('Token already exist')
			})

			// TODO: Add test to add a token.
		})

		describe('updateToken', function () {
			it('Should revert if user tries to update a token with id that does not exist', async function () {
				await expect(
					this.vendorV2.write.updateToken([666, 1, TEST_TOKEN_ONE, 0, false], {
						account: this.luca
					})
				).to.be.rejectedWith('Invalid Token')
			})

			it('Should revert if user tries to update with an error type', async function () {
				await expect(
					this.vendorV2.write.updateToken([1, 0, TEST_TOKEN_ONE, 0, false], {
						account: this.juan
					})
				).to.be.rejectedWith('Error type')
			})

			it('Should revert if user tries to update a token that does not exist', async function () {
				await expect(
					this.vendorV2.write.updateToken([1, 1, TEST_TOKEN_TWO, 0, false], {
						account: this.juan
					})
				).to.be.rejectedWith('Invalid Token')
			})

			// TODO: Add test to update a token.
		})

		describe('getTokenByAddr', function () {
			it('Should revert if token does not exist', async function () {
				await expect(
					this.vendorV2.read.getTokenByAddr([zeroAddress])
				).to.be.rejectedWith('Invalid Token')

				await expect(
					this.vendorV2.read.getTokenByAddr([TEST_TOKEN_TWO])
				).to.be.rejectedWith('Invalid Token')
			})

			it('Should return token by saved token address', async function () {
				const token: TokenStruct = await this.vendorV2.read.getTokenByAddr([
					this.mockcUSD.address
				])

				expect(token).to.be.an('object')
				expect(token.addr).to.equal(this.mockcUSD.address)
			})
		})
	})

	describe.skip('CollectioV2', function () {
		const price: bigint = 500000000n // $5.00 USD
		const newPrice: bigint = 600000000n // $6.00 USD

		beforeEach(async function () {
			const fixture = await deployFixture()
			this.vendorV2 = fixture.vendorV2
			this.mockcUSD = fixture.mockcUSD
			this.dataFeeds = fixture.dataFeeds
			this.deployer = fixture.deployer
			this.luca = fixture.luca
			this.juan = fixture.juan
			this.santiago = fixture.santiago

			await this.vendorV2.write.addUser([this.luca], {
				account: this.deployer
			})

			await this.vendorV2.write.addUser([this.juan], {
				account: this.deployer
			})
		})

		describe('addCollection', function () {
			it('Should revert if user tries to add a collection existing', async function () {
				await this.vendorV2.write.addCollection(
					[this.mockcUSD.address, price, true],
					{ account: this.luca }
				)

				await expect(
					this.vendorV2.write.addCollection(
						[this.mockcUSD.address, price, true],
						{ account: this.luca }
					)
				).to.be.rejectedWith('Collection already stored')
			})

			it('Should revert if user tries to add a collection with zero address', async function () {
				await expect(
					this.vendorV2.write.addCollection([zeroAddress, price, true], {
						account: this.luca
					})
				).to.be.rejectedWith('Invalid collection address')
			})

			it('Should revert if user tries to add a collection with zero price', async function () {
				await expect(
					this.vendorV2.write.addCollection([this.mockcUSD.address, 0n, true], {
						account: this.luca
					})
				).to.be.rejectedWith('Price must be greater than zero')
			})

			it('Should allow user to add a collection', async function () {
				await this.vendorV2.write.addCollection(
					[this.mockcUSD.address, price, true],
					{ account: this.luca }
				)

				const collection = await this.vendorV2.read.getCollectionByAddr([
					this.mockcUSD.address
				])

				expect(collection).to.be.an('object')
				expect(collection.addr).to.equal(this.mockcUSD.address)
				expect(collection.price).to.equal(price)
				expect(collection.active).to.be.true
			})
		})

		describe('add collection to test next functions', function () {
			beforeEach(async function () {
				await this.vendorV2.write.addCollection(
					[this.mockcUSD.address, price, true],
					{ account: this.luca }
				)
			})

			describe('updateCollection', function () {
				it('Should revert if user tries to update a collection with id that does not exist', async function () {
					await expect(
						this.vendorV2.write.updateCollection(
							[666, 1, TEST_TOKEN_ONE, price, true],
							{
								account: this.luca
							}
						)
					).to.be.rejectedWith('Invalid collection address')
				})

				it('Should revert if user tries to update with an error type', async function () {
					await expect(
						this.vendorV2.write.updateCollection(
							[1, 0, TEST_TOKEN_ONE, price, true],
							{
								account: this.juan
							}
						)
					).to.be.rejectedWith('Error type')
				})

				it('Should revert if user tries to update a collection that does not exist', async function () {
					await expect(
						this.vendorV2.write.updateCollection(
							[1, 1, zeroAddress, price, true],
							{
								account: this.luca
							}
						)
					).to.be.rejectedWith('Invalid collection address')

					await expect(
						this.vendorV2.write.updateCollection(
							[1, 1, TEST_TOKEN_TWO, price, true],
							{
								account: this.luca
							}
						)
					).to.be.rejectedWith('Invalid collection address')
				})

				it('Should allow user to update a collection', async function () {
					await this.vendorV2.write.updateCollection(
						[0, 1, TEST_TOKEN_ONE, newPrice, false],
						{ account: this.luca }
					)

					await this.vendorV2.write.updateCollection(
						[0, 2, TEST_TOKEN_ONE, newPrice, false],
						{ account: this.luca }
					)

					await this.vendorV2.write.updateCollection(
						[0, 3, TEST_TOKEN_ONE, newPrice, false],
						{ account: this.luca }
					)

					const updated = await this.vendorV2.read.getCollectionByAddr([
						this.mockcUSD.address
					])

					expect(updated.price).to.equal(newPrice)
					expect(updated.addr).to.equal(TEST_TOKEN_ONE)
					expect(updated.active).to.be.false
				})
			})

			describe('collectionList', function () {
				it('Should show collections list', async function () {
					const collections = await this.vendorV2.read.collectionList()
					expect(collections).to.be.an('array').that.is.not.empty
				})
			})

			describe('getCollectionByAddr', function () {
				it('Should revert if collection does not exist', async function () {
					await expect(
						this.vendorV2.read.getCollectionByAddr([zeroAddress])
					).to.be.rejectedWith('Invalid Collection')

					await expect(
						this.vendorV2.read.getCollectionByAddr([TEST_TOKEN_TWO])
					).to.be.rejectedWith('Invalid Collection')
				})

				it('Should return collection by saved collection address', async function () {
					const collection = await this.vendorV2.read.getCollectionByAddr([
						this.mockcUSD.address
					])

					expect(collection).to.be.an('object')
					expect(collection.addr).to.equal(this.mockcUSD.address)
				})
			})
		})
	})

	describe.skip('WithdrawV2', function () {
		const cUSDAmount: bigint = 1000000000n // 10 cUSD
		const ethAmount: bigint = 1000000000n // 0.000000001 ETH

		beforeEach(async function () {
			const fixture = await deployFixture()
			this.vendorV2 = fixture.vendorV2
			this.mockcUSD = fixture.mockcUSD
			this.dataFeeds = fixture.dataFeeds
			this.deployer = fixture.deployer
			this.luca = fixture.luca
			this.juan = fixture.juan
			this.santiago = fixture.santiago

			await this.vendorV2.write.addAdmin([this.luca], {
				account: this.deployer
			})

			await this.vendorV2.write.addAdmin([this.juan], {
				account: this.deployer
			})

			await this.mockcUSD.write.transfer([this.vendorV2.address, cUSDAmount], {
				account: this.deployer
			})

			const wallet = await viem.getWalletClient(this.deployer)

			await wallet.sendTransaction({
				to: this.vendorV2.address,
				value: ethAmount
			})
		})

		describe('withdraw', function () {
			it('Should revert if admin tries to withdraw with zero address', async function () {
				await expect(
					this.vendorV2.write.withdraw([ethAmount, zeroAddress], {
						account: this.luca
					})
				).to.be.rejectedWith('Invalid address')
			})

			it('Should revert if admin tries to withdrarw with zero amount', async function () {
				await expect(
					this.vendorV2.write.withdraw([0n, this.luca], {
						account: this.luca
					})
				).to.be.rejectedWith('Amount must be greater than zero')
			})

			it('Should revert if admin tries to withdraw more than balance', async function () {
				await expect(
					this.vendorV2.write.withdraw([cUSDAmount, this.luca], {
						account: this.luca
					})
				).to.be.rejectedWith('Insufficient balance')
			})

			// TODO: Add test to test request: "Failed to withdraw contract fee" only if gas is set low

			it('Should allow admin to withdraw ETH', async function () {
				const publicClient = await viem.getPublicClient()

				const initialBalance: bigint = await publicClient.getBalance({
					address: this.luca,
					blockTag: 'latest'
				})

				await this.vendorV2.write.withdraw([ethAmount, this.luca], {
					account: this.deployer
				})

				const finalBalance: bigint = await publicClient.getBalance({
					address: this.luca,
					blockTag: 'latest'
				})

				expect(finalBalance).to.equal(initialBalance + ethAmount)
			})

			it('Should decrease contract balance after withdraw', async function () {
				const publicClient = await viem.getPublicClient()

				const balanceBefore: bigint = await publicClient.getBalance({
					address: this.vendorV2.address
				})

				await this.vendorV2.write.withdraw([ethAmount, this.luca], {
					account: this.deployer
				})

				const balanceAfter: bigint = await publicClient.getBalance({
					address: this.vendorV2.address
				})

				expect(balanceAfter).to.equal(balanceBefore - ethAmount)
			})
		})

		describe('withdrawToken', function () {
			it('Should revert if admin tries to withdraw token with zero address', async function () {
				await expect(
					this.vendorV2.write.withdrawToken(
						[this.mockcUSD.address, cUSDAmount, zeroAddress],
						{
							account: this.luca
						}
					)
				).to.be.rejected
			})

			it('Should revert if admin tries to withdraw zero amount', async function () {
				await expect(
					this.vendorV2.write.withdrawToken(
						[this.mockcUSD.address, 0n, this.luca],
						{
							account: this.luca
						}
					)
				).to.be.rejected
			})

			it('Should revert if admin tries to withdraw more than token balance', async function () {
				const tooMuch = cUSDAmount + 1_000_000n
				await expect(
					this.vendorV2.write.withdrawToken(
						[this.mockcUSD.address, tooMuch, this.luca],
						{
							account: this.luca
						}
					)
				).to.be.rejectedWith('Failed to withdraw contract fee')
			})

			it('Should allow admin to withdraw token', async function () {
				const initialBalance = await this.mockcUSD.read.balanceOf([this.luca])

				await this.vendorV2.write.withdrawToken(
					[this.mockcUSD.address, cUSDAmount, this.luca],
					{
						account: this.luca
					}
				)

				const finalBalance = await this.mockcUSD.read.balanceOf([this.luca])
				expect(finalBalance).to.equal(initialBalance + cUSDAmount)
			})

			it('Should decrease token balance in contract after withdrawal', async function () {
				const balanceBefore = await this.mockcUSD.read.balanceOf([
					this.vendorV2.address
				])

				await this.vendorV2.write.withdrawToken(
					[this.mockcUSD.address, cUSDAmount, this.luca],
					{
						account: this.luca
					}
				)

				const balanceAfter = await this.mockcUSD.read.balanceOf([
					this.vendorV2.address
				])
				expect(balanceAfter).to.equal(balanceBefore - cUSDAmount)
			})

			it('Should revert if called by non-admin', async function () {
				await expect(
					this.vendorV2.write.withdrawToken(
						[this.mockcUSD.address, cUSDAmount, this.luca],
						{
							account: this.santiago
						}
					)
				).to.be.rejectedWith('Restricted to admins.')
			})
		})
	})
})
