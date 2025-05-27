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

	describe.skip('WithdrawV2', function () {
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

			it('Should allow user to add a token', async function () {
				await this.vendorV2.write.addToken(
					[TEST_TOKEN_ONE, this.dataFeeds.address, 8, true, false],
					{ account: this.luca }
				)

				const tokens = await this.vendorV2.read.tokensList()

				expect(tokens.map((token: TokenStruct) => token.addr)).to.include(
					TEST_TOKEN_ONE
				)
			})
		})

		describe('updateToken', function () {
			it('Should revert if user tries to update a token with id that does not exist', async function () {
				await expect(
					this.vendorV2.write.updateToken([666, 0, zeroAddress, 0, false], {
						account: this.luca
					})
				).to.be.rejectedWith('Invalid Token')
			})

			it('Should revert if user tries to update with an error type', async function () {
				await expect(
					this.vendorV2.write.updateToken(
						[0, 0, this.mockcUSD.address, 0, false],
						{ account: this.juan }
					)
				).to.be.rejectedWith('Error type')
			})

			it('Should revert if user tries to update a token that does not exist', async function () {
				await expect(
					this.vendorV2.write.updateToken([0, 0, TEST_TOKEN_TWO, 0, false], {
						account: this.juan
					})
				).to.be.rejectedWith('Invalid Token')
			})
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
})
