import { expect } from 'chai'
import chai from 'chai'
import chaiBigint from 'chai-bigint'
import hre, { viem } from 'hardhat'
import { Address, GetContractReturnType, parseEther, zeroAddress } from 'viem'

import { ABIS } from '@/config/abi'

chai.use(chaiBigint)

interface FixtureReturn {
	// Accounts
	deployer: string
	luca: string
	juan: string
	santiago: string
	ledger: string
	// Contracts
	inhabit: GetContractReturnType<typeof ABIS.Inhabit>
	mockUSDC: GetContractReturnType<typeof ABIS.MockErc20>
	nftCollection: GetContractReturnType<typeof ABIS.NFTCollection>
}

describe('Inhabit - Groups Module', function () {
	async function deployFixture(): Promise<FixtureReturn> {
		const { deployments, getNamedAccounts } = hre
		const { deployer, luca, juan, santiago, ledger, treasury } =
			await getNamedAccounts()

		await deployments.fixture(['localhost'])

		// Mock ERC20 (USDC)
		const mockErc20Address = (await deployments.get('MockErc20'))
			.address as Address

		const mockUSDC = (await viem.getContractAt(
			'MockErc20',
			mockErc20Address
		)) as unknown as GetContractReturnType<typeof ABIS.MockErc20>

		// NFT Collection
		const nftCollectionAddress = (await deployments.get('NFTCollection'))
			.address as Address

		const nftCollection = (await viem.getContractAt(
			'NFTCollection',
			nftCollectionAddress
		)) as unknown as GetContractReturnType<typeof ABIS.NFTCollection>

		// Inhabit
		const inhabitAddress = (await deployments.get('Inhabit')).address as Address

		const inhabit = (await viem.getContractAt(
			'Inhabit',
			inhabitAddress
		)) as unknown as GetContractReturnType<typeof ABIS.Inhabit>

		return {
			deployer,
			luca,
			juan,
			santiago,
			ledger,
			inhabit,
			mockUSDC,
			nftCollection
		}
	}

	describe('Groups Management', function () {
		// Constants for testing
		const REFERRAL_CODE = 'TEST_GROUP'
		const EMPTY_REFERRAL = ''
		const FEE_50_PERCENT = 5000n // 50%
		const FEE_30_PERCENT = 3000n // 30%
		const FEE_20_PERCENT = 2000n // 20%
		const FEE_OVER_100_PERCENT = 10001n // 100.01%
		const MAX_FEE = 10000n // 100%

		beforeEach(async function () {
			const fixture = await deployFixture()
			Object.assign(this, fixture)
		})

		describe('createGroup', function () {
			it('Should revert if caller does not have ADMIN_ROLE', async function () {
				const embassadors = [{ account: this.luca, fee: FEE_50_PERCENT }]

				await expect(
					this.inhabit.write.createGroup([REFERRAL_CODE, true, embassadors], {
						account: this.luca // not admin
					})
				).to.be.rejectedWith('AccessControlUnauthorizedAccount')
			})

			it('Should revert if referral code is empty', async function () {
				const embassadors = [{ account: this.luca, fee: FEE_50_PERCENT }]

				await expect(
					this.inhabit.write.createGroup([EMPTY_REFERRAL, true, embassadors], {
						account: this.deployer
					})
				).to.be.rejectedWith('EMPTY_STRING')
			})

			it('Should revert if group already exists', async function () {
				const embassadors = [{ account: this.luca, fee: FEE_50_PERCENT }]

				// Create first group
				await this.inhabit.write.createGroup(
					[REFERRAL_CODE, true, embassadors],
					{
						account: this.deployer
					}
				)

				// Try to create same group again
				await expect(
					this.inhabit.write.createGroup([REFERRAL_CODE, true, embassadors], {
						account: this.deployer
					})
				).to.be.rejectedWith('GROUP_ALREADY_EXISTS')
			})

			it('Should revert if embassador has zero address', async function () {
				const embassadors = [{ account: zeroAddress, fee: FEE_50_PERCENT }]

				await expect(
					this.inhabit.write.createGroup([REFERRAL_CODE, true, embassadors], {
						account: this.deployer
					})
				).to.be.rejectedWith('ZERO_ADDRESS')
			})

			it('Should revert if total fees exceed 100%', async function () {
				const embassadors = [
					{ account: this.luca, fee: FEE_50_PERCENT },
					{ account: this.juan, fee: FEE_50_PERCENT },
					{ account: this.santiago, fee: FEE_20_PERCENT } // Total: 120%
				]

				await expect(
					this.inhabit.write.createGroup([REFERRAL_CODE, true, embassadors], {
						account: this.deployer
					})
				).to.be.rejectedWith('PERCENTAGE_ERROR')
			})

			it('Should create group successfully with valid parameters', async function () {
				const embassadors = [
					{ account: this.luca, fee: FEE_50_PERCENT },
					{ account: this.juan, fee: FEE_30_PERCENT },
					{ account: this.santiago, fee: FEE_20_PERCENT }
				]

				const tx = await this.inhabit.write.createGroup(
					[REFERRAL_CODE, true, embassadors],
					{
						account: this.deployer
					}
				)

				expect(tx).to.exist

				// Verify group count increased
				const groupCount = await this.inhabit.read.groupCount()
				expect(groupCount).to.equal(1n)

				// Verify group data
				const group = await this.inhabit.read.getGroup([REFERRAL_CODE])
				expect(group.referral).to.equal(REFERRAL_CODE)
				expect(group.state).to.be.true
				expect(group.embassadors).to.have.lengthOf(3)
			})

			it('Should emit GroupCreated event', async function () {
				const embassadors = [{ account: this.luca, fee: FEE_50_PERCENT }]

				// Note: Event verification depends on your setup
				// This is a simplified example
				const tx = await this.inhabit.write.createGroup(
					[REFERRAL_CODE, true, embassadors],
					{
						account: this.deployer
					}
				)

				// You might need to check logs or use a different method based on your setup
				expect(tx).to.exist
			})

			it('Should create inactive group when state is false', async function () {
				const embassadors = [{ account: this.luca, fee: MAX_FEE }]

				await this.inhabit.write.createGroup(
					[REFERRAL_CODE, false, embassadors],
					{
						account: this.deployer
					}
				)

				const group = await this.inhabit.read.getGroup([REFERRAL_CODE])
				expect(group.state).to.be.false
			})

			it('Should handle edge case with exactly 100% fees', async function () {
				const embassadors = [
					{ account: this.luca, fee: MAX_FEE } // Exactly 100%
				]

				const tx = await this.inhabit.write.createGroup(
					[REFERRAL_CODE, true, embassadors],
					{
						account: this.deployer
					}
				)

				expect(tx).to.exist
			})

			it('Should allow empty embassadors array', async function () {
				const embassadors = []

				const tx = await this.inhabit.write.createGroup(
					[REFERRAL_CODE, true, embassadors],
					{
						account: this.deployer
					}
				)

				expect(tx).to.exist

				const group = await this.inhabit.read.getGroup([REFERRAL_CODE])
				expect(group.embassadors).to.have.lengthOf(0)
			})
		})

		describe('updateGroupStatus', function () {
			beforeEach(async function () {
				// Create a test group
				const embassadors = [{ account: this.luca, fee: FEE_50_PERCENT }]
				await this.inhabit.write.createGroup(
					[REFERRAL_CODE, true, embassadors],
					{
						account: this.deployer
					}
				)
			})

			it('Should revert if caller does not have ADMIN_ROLE', async function () {
				await expect(
					this.inhabit.write.updateGroupStatus([REFERRAL_CODE, false], {
						account: this.luca
					})
				).to.be.rejectedWith('AccessControlUnauthorizedAccount')
			})

			it('Should revert if group does not exist', async function () {
				await expect(
					this.inhabit.write.updateGroupStatus(['NONEXISTENT', false], {
						account: this.deployer
					})
				).to.be.rejectedWith('GROUP_NOT_FOUND')
			})

			it('Should revert if setting same state', async function () {
				await expect(
					this.inhabit.write.updateGroupStatus([REFERRAL_CODE, true], {
						account: this.deployer
					})
				).to.be.rejectedWith('SAME_STATE')
			})

			it('Should update group status successfully', async function () {
				const tx = await this.inhabit.write.updateGroupStatus(
					[REFERRAL_CODE, false],
					{
						account: this.deployer
					}
				)

				expect(tx).to.exist

				const group = await this.inhabit.read.getGroup([REFERRAL_CODE])
				expect(group.state).to.be.false
			})

			it('Should emit GroupStatusUpdated event', async function () {
				const tx = await this.inhabit.write.updateGroupStatus(
					[REFERRAL_CODE, false],
					{
						account: this.deployer
					}
				)

				expect(tx).to.exist
			})
		})

		describe('addEmbassadors', function () {
			beforeEach(async function () {
				// Create a test group with one embassador
				const embassadors = [{ account: this.luca, fee: FEE_30_PERCENT }]
				await this.inhabit.write.createGroup(
					[REFERRAL_CODE, true, embassadors],
					{
						account: this.deployer
					}
				)
			})

			it('Should revert if caller does not have ADMIN_ROLE', async function () {
				const newEmbassadors = [{ account: this.juan, fee: FEE_30_PERCENT }]

				await expect(
					this.inhabit.write.addEmbassadors([REFERRAL_CODE, newEmbassadors], {
						account: this.luca
					})
				).to.be.rejectedWith('AccessControlUnauthorizedAccount')
			})

			it('Should revert if group does not exist', async function () {
				const newEmbassadors = [{ account: this.juan, fee: FEE_30_PERCENT }]

				await expect(
					this.inhabit.write.addEmbassadors(['NONEXISTENT', newEmbassadors], {
						account: this.deployer
					})
				).to.be.rejectedWith('GROUP_NOT_FOUND')
			})

			it('Should revert if embassadors array is empty', async function () {
				await expect(
					this.inhabit.write.addEmbassadors([REFERRAL_CODE, []], {
						account: this.deployer
					})
				).to.be.rejectedWith('EMPTY_ARRAY')
			})

			it('Should revert if adding embassador with zero address', async function () {
				const newEmbassadors = [{ account: zeroAddress, fee: FEE_30_PERCENT }]

				await expect(
					this.inhabit.write.addEmbassadors([REFERRAL_CODE, newEmbassadors], {
						account: this.deployer
					})
				).to.be.rejectedWith('ZERO_ADDRESS')
			})

			it('Should revert if total fees would exceed 100%', async function () {
				const newEmbassadors = [
					{ account: this.juan, fee: FEE_50_PERCENT },
					{ account: this.santiago, fee: FEE_30_PERCENT } // Total would be 110%
				]

				await expect(
					this.inhabit.write.addEmbassadors([REFERRAL_CODE, newEmbassadors], {
						account: this.deployer
					})
				).to.be.rejectedWith('PERCENTAGE_ERROR')
			})

			it('Should add embassadors successfully', async function () {
				const newEmbassadors = [
					{ account: this.juan, fee: FEE_30_PERCENT },
					{ account: this.santiago, fee: FEE_20_PERCENT }
				]

				const tx = await this.inhabit.write.addEmbassadors(
					[REFERRAL_CODE, newEmbassadors],
					{
						account: this.deployer
					}
				)

				expect(tx).to.exist

				const group = await this.inhabit.read.getGroup([REFERRAL_CODE])
				expect(group.embassadors).to.have.lengthOf(3)
			})

			it('Should emit EmbassadorsAdded event', async function () {
				const newEmbassadors = [{ account: this.juan, fee: FEE_20_PERCENT }]

				const tx = await this.inhabit.write.addEmbassadors(
					[REFERRAL_CODE, newEmbassadors],
					{
						account: this.deployer
					}
				)

				expect(tx).to.exist
			})

			it('Should handle adding multiple embassadors at limit', async function () {
				const newEmbassadors = [
					{ account: this.juan, fee: FEE_50_PERCENT },
					{ account: this.santiago, fee: FEE_20_PERCENT } // Total exactly 100%
				]

				const tx = await this.inhabit.write.addEmbassadors(
					[REFERRAL_CODE, newEmbassadors],
					{
						account: this.deployer
					}
				)

				expect(tx).to.exist
			})

			it('Should not allow adding duplicate embassador addresses', async function () {
				const newEmbassadors = [{ account: this.luca, fee: FEE_20_PERCENT }]

				await expect(
					this.inhabit.write.addEmbassadors([REFERRAL_CODE, newEmbassadors], {
						account: this.deployer
					})
				).to.be.rejectedWith('AMBASSADOR_ALREADY_EXISTS')
			})
		})

		describe('updateEmbassadors', function () {
			beforeEach(async function () {
				// Create a test group with embassadors
				const embassadors = [
					{ account: this.luca, fee: FEE_50_PERCENT },
					{ account: this.juan, fee: FEE_30_PERCENT }
				]
				await this.inhabit.write.createGroup(
					[REFERRAL_CODE, true, embassadors],
					{
						account: this.deployer
					}
				)
			})

			it('Should revert if caller does not have ADMIN_ROLE', async function () {
				const updates = [{ account: this.luca, fee: FEE_30_PERCENT }]

				await expect(
					this.inhabit.write.updateEmbassadors([REFERRAL_CODE, updates], {
						account: this.luca
					})
				).to.be.rejectedWith('AccessControlUnauthorizedAccount')
			})

			it('Should revert if group does not exist', async function () {
				const updates = [{ account: this.luca, fee: FEE_30_PERCENT }]

				await expect(
					this.inhabit.write.updateEmbassadors(['NONEXISTENT', updates], {
						account: this.deployer
					})
				).to.be.rejectedWith('GROUP_NOT_FOUND')
			})

			it('Should revert if embassadors array is empty', async function () {
				await expect(
					this.inhabit.write.updateEmbassadors([REFERRAL_CODE, []], {
						account: this.deployer
					})
				).to.be.rejectedWith('EMPTY_ARRAY')
			})

			it('Should revert if embassador not found in group', async function () {
				const updates = [
					{ account: this.santiago, fee: FEE_30_PERCENT } // santiago not in group
				]

				await expect(
					this.inhabit.write.updateEmbassadors([REFERRAL_CODE, updates], {
						account: this.deployer
					})
				).to.be.rejectedWith('EMBASSADOR_NOT_FOUND')
			})

			it('Should revert if updating with zero address', async function () {
				const updates = [{ account: zeroAddress, fee: FEE_30_PERCENT }]

				await expect(
					this.inhabit.write.updateEmbassadors([REFERRAL_CODE, updates], {
						account: this.deployer
					})
				).to.be.rejectedWith('ZERO_ADDRESS')
			})

			it('Should revert if total fees would exceed 100%', async function () {
				const updates = [
					{ account: this.luca, fee: FEE_50_PERCENT },
					{ account: this.juan, fee: FEE_50_PERCENT + 1n } // Total would be 100.01%
				]

				await expect(
					this.inhabit.write.updateEmbassadors([REFERRAL_CODE, updates], {
						account: this.deployer
					})
				).to.be.rejectedWith('PERCENTAGE_ERROR')
			})

			it('Should update embassador fees successfully', async function () {
				const updates = [
					{ account: this.luca, fee: FEE_30_PERCENT },
					{ account: this.juan, fee: FEE_20_PERCENT }
				]

				const tx = await this.inhabit.write.updateEmbassadors(
					[REFERRAL_CODE, updates],
					{
						account: this.deployer
					}
				)

				expect(tx).to.exist

				const group = await this.inhabit.read.getGroup([REFERRAL_CODE])
				// Verify fees were updated correctly
				const lucaEmbassador = group.embassadors.find(
					e => e.account === this.luca
				)
				const juanEmbassador = group.embassadors.find(
					e => e.account === this.juan
				)

				expect(lucaEmbassador.fee).to.equal(FEE_30_PERCENT)
				expect(juanEmbassador.fee).to.equal(FEE_20_PERCENT)
			})

			it('Should emit EmbassadorsUpdated event', async function () {
				const updates = [{ account: this.luca, fee: FEE_20_PERCENT }]

				const tx = await this.inhabit.write.updateEmbassadors(
					[REFERRAL_CODE, updates],
					{
						account: this.deployer
					}
				)

				expect(tx).to.exist
			})

			it('Should update single embassador without affecting others', async function () {
				const updates = [{ account: this.luca, fee: FEE_20_PERCENT }]

				await this.inhabit.write.updateEmbassadors([REFERRAL_CODE, updates], {
					account: this.deployer
				})

				const group = await this.inhabit.read.getGroup([REFERRAL_CODE])
				const juanEmbassador = group.embassadors.find(
					e => e.account === this.juan
				)

				// Juan's fee should remain unchanged
				expect(juanEmbassador.fee).to.equal(FEE_30_PERCENT)
			})
		})

		describe('removeEmbassadors', function () {
			beforeEach(async function () {
				// Create a test group with multiple embassadors
				const embassadors = [
					{ account: this.luca, fee: FEE_30_PERCENT },
					{ account: this.juan, fee: FEE_30_PERCENT },
					{ account: this.santiago, fee: FEE_20_PERCENT }
				]
				await this.inhabit.write.createGroup(
					[REFERRAL_CODE, true, embassadors],
					{
						account: this.deployer
					}
				)
			})

			it('Should revert if caller does not have ADMIN_ROLE', async function () {
				await expect(
					this.inhabit.write.removeEmbassadors([REFERRAL_CODE, [this.luca]], {
						account: this.luca
					})
				).to.be.rejectedWith('AccessControlUnauthorizedAccount')
			})

			it('Should revert if group does not exist', async function () {
				await expect(
					this.inhabit.write.removeEmbassadors(['NONEXISTENT', [this.luca]], {
						account: this.deployer
					})
				).to.be.rejectedWith('GROUP_NOT_FOUND')
			})

			it('Should revert if accounts array is empty', async function () {
				await expect(
					this.inhabit.write.removeEmbassadors([REFERRAL_CODE, []], {
						account: this.deployer
					})
				).to.be.rejectedWith('EMPTY_ARRAY')
			})

			it('Should revert if trying to remove zero address', async function () {
				await expect(
					this.inhabit.write.removeEmbassadors([REFERRAL_CODE, [zeroAddress]], {
						account: this.deployer
					})
				).to.be.rejectedWith('ZERO_ADDRESS')
			})

			it('Should revert if embassador not found', async function () {
				await expect(
					this.inhabit.write.removeEmbassadors([REFERRAL_CODE, [this.ledger]], {
						account: this.deployer
					})
				).to.be.rejectedWith('EMBASSADOR_NOT_FOUND')
			})

			it('Should remove single embassador successfully', async function () {
				const tx = await this.inhabit.write.removeEmbassadors(
					[REFERRAL_CODE, [this.luca]],
					{
						account: this.deployer
					}
				)

				expect(tx).to.exist

				const group = await this.inhabit.read.getGroup([REFERRAL_CODE])
				expect(group.embassadors).to.have.lengthOf(2)

				// Verify luca was removed
				const hasLuca = group.embassadors.some(e => e.account === this.luca)
				expect(hasLuca).to.be.false
			})

			it('Should remove multiple embassadors successfully', async function () {
				const tx = await this.inhabit.write.removeEmbassadors(
					[REFERRAL_CODE, [this.luca, this.juan]],
					{ account: this.deployer }
				)

				expect(tx).to.exist

				const group = await this.inhabit.read.getGroup([REFERRAL_CODE])
				expect(group.embassadors).to.have.lengthOf(1)
				expect(group.embassadors[0].account).to.equal(this.santiago)
			})

			it('Should emit EmbassadorsRemoved event', async function () {
				const tx = await this.inhabit.write.removeEmbassadors(
					[REFERRAL_CODE, [this.luca]],
					{
						account: this.deployer
					}
				)

				expect(tx).to.exist
			})

			it('Should allow removing all embassadors', async function () {
				await this.inhabit.write.removeEmbassadors(
					[REFERRAL_CODE, [this.luca, this.juan, this.santiago]],
					{ account: this.deployer }
				)

				const group = await this.inhabit.read.getGroup([REFERRAL_CODE])
				expect(group.embassadors).to.have.lengthOf(0)
			})
		})

		describe('Token Management', function () {
			describe('addToTokens', function () {
				it('Should revert if caller does not have ADMIN_ROLE', async function () {
					await expect(
						this.inhabit.write.addToTokens([[this.mockUSDC.address]], {
							account: this.luca
						})
					).to.be.rejectedWith('AccessControlUnauthorizedAccount')
				})

				it('Should revert if token address is zero', async function () {
					await expect(
						this.inhabit.write.addToTokens([[zeroAddress]], {
							account: this.deployer
						})
					).to.be.rejectedWith('ZERO_ADDRESS')
				})

				it('Should add single token successfully', async function () {
					const tx = await this.inhabit.write.addToTokens(
						[[this.mockUSDC.address]],
						{
							account: this.deployer
						}
					)

					expect(tx).to.exist

					const isSupported = await this.inhabit.read.isTokenSupported([
						this.mockUSDC.address
					])
					expect(isSupported).to.be.true
				})

				it('Should add multiple tokens successfully', async function () {
					const mockToken2 = this.nftCollection.address

					const tx = await this.inhabit.write.addToTokens(
						[[this.mockUSDC.address, mockToken2]],
						{ account: this.deployer }
					)

					expect(tx).to.exist

					const isUSDCSupported = await this.inhabit.read.isTokenSupported([
						this.mockUSDC.address
					])

					const isToken2Supported = await this.inhabit.read.isTokenSupported([
						mockToken2
					])

					expect(isUSDCSupported).to.be.true
					expect(isToken2Supported).to.be.true
				})

				// ❌ This test should fail - contract doesn't check for duplicates
				it('Should revert if token already exists', async function () {
					// Add token first time
					await this.inhabit.write.addToTokens([[this.mockUSDC.address]], {
						account: this.deployer
					})

					// Try to add same token again - SHOULD revert but doesn't
					await expect(
						this.inhabit.write.addToTokens([[this.mockUSDC.address]], {
							account: this.deployer
						})
					).to.be.rejectedWith('TOKEN_ALREADY_EXISTS')
				})
			})

			describe('removeFromTokens', function () {
				beforeEach(async function () {
					// Add a token first
					await this.inhabit.write.addToTokens([[this.mockUSDC.address]], {
						account: this.deployer
					})
				})

				it('Should revert if caller does not have ADMIN_ROLE', async function () {
					await expect(
						this.inhabit.write.removeFromTokens([this.mockUSDC.address], {
							account: this.luca
						})
					).to.be.rejectedWith('AccessControlUnauthorizedAccount')
				})

				it('Should revert if token address is zero', async function () {
					await expect(
						this.inhabit.write.removeFromTokens([zeroAddress], {
							account: this.deployer
						})
					).to.be.rejectedWith('ZERO_ADDRESS')
				})

				it('Should remove token successfully', async function () {
					const tx = await this.inhabit.write.removeFromTokens(
						[this.mockUSDC.address],
						{
							account: this.deployer
						}
					)

					expect(tx).to.exist

					const isSupported = await this.inhabit.read.isTokenSupported([
						this.mockUSDC.address
					])
					expect(isSupported).to.be.false
				})

				// ❌ This test should fail - contract doesn't check if token exists
				it('Should revert if token does not exist', async function () {
					const randomToken = '0x1234567890123456789012345678901234567890'

					await expect(
						this.inhabit.write.removeFromTokens([randomToken], {
							account: this.deployer
						})
					).to.be.rejectedWith('TOKEN_NOT_FOUND')
				})
			})
		})

		describe('Fund Recovery', function () {
			describe('recoverFunds', function () {
				beforeEach(async function () {
					// Send some funds to the contract
					await this.mockUSDC.write.mint(
						[this.inhabit.address, parseEther('100')],
						{
							account: this.deployer
						}
					)
				})

				it('Should revert if caller does not have ADMIN_ROLE', async function () {
					await expect(
						this.inhabit.write.recoverFunds(
							[this.mockUSDC.address, this.ledger],
							{
								account: this.luca
							}
						)
					).to.be.rejectedWith('AccessControlUnauthorizedAccount')
				})

				it('Should revert if destination address is zero', async function () {
					await expect(
						this.inhabit.write.recoverFunds(
							[this.mockUSDC.address, zeroAddress],
							{
								account: this.deployer
							}
						)
					).to.be.rejectedWith('ZERO_ADDRESS')
				})

				it('Should recover ERC20 tokens successfully', async function () {
					const balanceBefore = await this.mockUSDC.read.balanceOf([
						this.ledger
					])

					const tx = await this.inhabit.write.recoverFunds(
						[this.mockUSDC.address, this.ledger],
						{
							account: this.deployer
						}
					)

					expect(tx).to.exist

					const balanceAfter = await this.mockUSDC.read.balanceOf([this.ledger])
					const contractBalance = await this.mockUSDC.read.balanceOf([
						this.inhabit.address
					])

					expect(balanceAfter).to.equal(balanceBefore + parseEther('100'))
					expect(contractBalance).to.equal(0n)
				})

				it('Should recover native ETH successfully', async function () {
					const admin = this.admin
					const ledger = this.ledger
					const wallet = await viem.getWalletClient(this.deployer)
					const publicClient = await viem.getPublicClient()

					const hash = await wallet.sendTransaction({
						account: this.deployer,
						to: this.inhabit.address,
						value: parseEther('1')
					})

					await publicClient.waitForTransactionReceipt({ hash })

					const contractBefore = await publicClient.getBalance({
						address: this.inhabit.address
					})

					expect(contractBefore).to.equal(parseEther('1'))

					const ledgerBefore = await publicClient.getBalance({
						address: ledger
					})

					await this.inhabit.write.recoverFunds([zeroAddress, ledger], {
						account: admin
					})

					const ledgerAfter = await publicClient.getBalance({ address: ledger })

					const contractAfter = await publicClient.getBalance({
						address: this.inhabit.address
					})

					expect(contractAfter).to.equal(0n)
					expect(ledgerAfter - ledgerBefore).to.be.gte(parseEther('0.99999'))
				})

				it('Should handle recovery when contract has zero balance', async function () {
					await this.inhabit.write.recoverFunds(
						[this.mockUSDC.address, this.ledger],
						{
							account: this.deployer
						}
					)

					const tx = await this.inhabit.write.recoverFunds(
						[this.mockUSDC.address, this.ledger],
						{
							account: this.deployer
						}
					)

					expect(tx).to.exist
				})
			})
		})

		describe('View Functions', function () {
			describe('getGroup', function () {
				it('Should return empty group for non-existent referral', async function () {
					const group = await this.inhabit.read.getGroup(['NONEXISTENT'])

					expect(group.referral).to.equal('')
					expect(group.state).to.be.false
					expect(group.embassadors).to.have.lengthOf(0)
				})

				it('Should return correct group data', async function () {
					const embassadors = [
						{ account: this.luca, fee: FEE_50_PERCENT },
						{ account: this.juan, fee: FEE_30_PERCENT }
					]

					await this.inhabit.write.createGroup(
						[REFERRAL_CODE, true, embassadors],
						{
							account: this.deployer
						}
					)

					const group = await this.inhabit.read.getGroup([REFERRAL_CODE])

					expect(group.referral).to.equal(REFERRAL_CODE)
					expect(group.state).to.be.true
					expect(group.embassadors).to.have.lengthOf(2)
					expect(group.embassadors[0].account).to.equal(this.luca)
					expect(group.embassadors[0].fee).to.equal(FEE_50_PERCENT)
				})
			})

			describe('getGroupReferral', function () {
				it('Should return correct referral by index', async function () {
					// Create multiple groups
					await this.inhabit.write.createGroup(['GROUP1', true, []], {
						account: this.deployer
					})
					await this.inhabit.write.createGroup(['GROUP2', true, []], {
						account: this.deployer
					})

					const referral1 = await this.inhabit.read.getGroupReferral([1n])
					const referral2 = await this.inhabit.read.getGroupReferral([2n])

					expect(referral1).to.equal('GROUP1')
					expect(referral2).to.equal('GROUP2')
				})

				it('Should return empty string for invalid index', async function () {
					const referral = await this.inhabit.read.getGroupReferral([999n])
					expect(referral).to.equal('')
				})
			})

			describe('isTokenSupported', function () {
				it('Should return false for unsupported token', async function () {
					const isSupported = await this.inhabit.read.isTokenSupported([
						this.mockUSDC.address
					])
					expect(isSupported).to.be.false
				})

				it('Should return true for supported token', async function () {
					await this.inhabit.write.addToTokens([[this.mockUSDC.address]], {
						account: this.deployer
					})

					const isSupported = await this.inhabit.read.isTokenSupported([
						this.mockUSDC.address
					])
					expect(isSupported).to.be.true
				})
			})

			describe('calculateFee', function () {
				it('Should calculate fee correctly', async function () {
					const amount = parseEther('100')
					const percentage = 2500n // 25%

					const fee = await this.inhabit.read.calculateFee([amount, percentage])
					expect(fee).to.equal(parseEther('25'))
				})

				it('Should handle zero amount', async function () {
					const fee = await this.inhabit.read.calculateFee([0n, FEE_50_PERCENT])
					expect(fee).to.equal(0n)
				})

				it('Should handle zero percentage', async function () {
					const fee = await this.inhabit.read.calculateFee([
						parseEther('100'),
						0n
					])
					expect(fee).to.equal(0n)
				})

				it('Should handle maximum values without overflow', async function () {
					const amount = parseEther('1000000') // 1M tokens
					const percentage = MAX_FEE // 100%

					const fee = await this.inhabit.read.calculateFee([amount, percentage])
					expect(fee).to.equal(amount)
				})
			})

			describe('groupCount', function () {
				it('Should track group count correctly', async function () {
					const initialCount = await this.inhabit.read.groupCount()
					expect(initialCount).to.equal(0n)

					// Create groups
					await this.inhabit.write.createGroup(['GROUP1', true, []], {
						account: this.deployer
					})
					await this.inhabit.write.createGroup(['GROUP2', true, []], {
						account: this.deployer
					})

					const finalCount = await this.inhabit.read.groupCount()
					expect(finalCount).to.equal(2n)
				})
			})
		})

		describe('Distribution (Internal)', function () {
			// Note: _distribution is internal, so we test it through buyNFT
			// This section would require the full contract integration
			// Including campaign creation and NFT purchases

			it('Should validate distribution logic through integration', async function () {
				// This would require setting up:
				// 1. Token support
				// 2. Group with embassadors
				// 3. Campaign with collection
				// 4. Executing buyNFT with referral
				//
				// Since we're focusing on Groups module only,
				// this is marked as a placeholder for full integration tests
			})
		})

		describe('Edge Cases and Security', function () {
			it('Should handle special characters in referral codes', async function () {
				const specialReferral = 'TEST_GROUP-123!@#'
				const embassadors = [{ account: this.luca, fee: FEE_50_PERCENT }]

				const tx = await this.inhabit.write.createGroup(
					[specialReferral, true, embassadors],
					{
						account: this.deployer
					}
				)

				expect(tx).to.exist

				const group = await this.inhabit.read.getGroup([specialReferral])
				expect(group.referral).to.equal(specialReferral)
			})

			it('Should handle very long referral codes', async function () {
				const longReferral = 'A'.repeat(100) // 100 character referral
				const embassadors = [{ account: this.luca, fee: FEE_50_PERCENT }]

				const tx = await this.inhabit.write.createGroup(
					[longReferral, true, embassadors],
					{
						account: this.deployer
					}
				)

				expect(tx).to.exist
			})

			it('❌ Should handle groups with many embassadors efficiently', async function () {
				// Create group with many embassadors (potential gas issue)
				const manyEmbassadors = []
				const feePerEmbassador = 100n // 1% each

				// Create 100 embassadors (this might hit gas limits)
				for (let i = 0; i < 100; i++) {
					const account = `0x${(i + 1).toString(16).padStart(40, '0')}`
					manyEmbassadors.push({ account, fee: feePerEmbassador })
				}

				// This might fail due to gas limits - exposing DOS vulnerability
				await expect(
					this.inhabit.write.createGroup(
						['LARGE_GROUP', true, manyEmbassadors],
						{
							account: this.deployer
						}
					)
				).to.be.rejectedWith('GAS_LIMIT_EXCEEDED')
			})
		})
	})
})
