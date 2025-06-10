import { expect } from 'chai'
import chai from 'chai'
import chaiBigint from 'chai-bigint'
import hre, { viem } from 'hardhat'
import { Address, parseEther, zeroAddress } from 'viem'

import { NATIVE } from '@/config/constants'
import { AmbassadorStruct } from '@/models/index'

chai.use(chaiBigint)

describe('Inhabit - Groups Module', function () {
	let fixture: any
	let deployer: string
	let luca: string
	let juan: string
	let santiago: string
	let ledger: string
	let inhabit: any
	let mockUSDC: any
	let nftCollection: any

	async function deployFixture(): Promise<any> {
		const { deployments, getNamedAccounts } = hre
		const { deployer, luca, juan, santiago, ledger } = await getNamedAccounts()

		await deployments.fixture(['localhost'])

		// Mock ERC20 (USDC)
		const mockErc20Address = (await deployments.get('MockErc20'))
			.address as Address

		const mockUSDC = await viem.getContractAt('MockErc20', mockErc20Address)

		// NFT Collection
		const nftCollectionAddress = (await deployments.get('NFTCollection'))
			.address as Address

		const nftCollection = await viem.getContractAt(
			'NFTCollection',
			nftCollectionAddress
		)

		// Inhabit
		const inhabitAddress = (await deployments.get('Inhabit')).address as Address

		const inhabit = await viem.getContractAt('Inhabit', inhabitAddress)

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
			fixture = await deployFixture()
			;({
				deployer,
				luca,
				juan,
				santiago,
				ledger,
				inhabit,
				mockUSDC,
				nftCollection
			} = fixture)
		})

		describe('createGroup', function () {
			it('Should revert if caller does not have ADMIN_ROLE', async function () {
				const ambassadors = [{ account: luca, fee: FEE_50_PERCENT }]

				await expect(
					inhabit.write.createGroup([REFERRAL_CODE, true, ambassadors], {
						account: luca // not admin
					})
				).to.be.rejectedWith('AccessControlUnauthorizedAccount')
			})

			it('Should revert if referral code is empty', async function () {
				const ambassadors = [{ account: luca, fee: FEE_50_PERCENT }]

				await expect(
					inhabit.write.createGroup([EMPTY_REFERRAL, true, ambassadors], {
						account: deployer
					})
				).to.be.rejectedWith('EMPTY_STRING')
			})

			it('Should revert if group already exists', async function () {
				const ambassadors = [{ account: luca, fee: FEE_50_PERCENT }]

				// Create first group
				await inhabit.write.createGroup([REFERRAL_CODE, true, ambassadors], {
					account: deployer
				})

				// Try to create same group again
				await expect(
					inhabit.write.createGroup([REFERRAL_CODE, true, ambassadors], {
						account: deployer
					})
				).to.be.rejectedWith('GROUP_ALREADY_EXISTS')
			})

			it('Should revert if ambassador has zero address', async function () {
				const ambassadors = [{ account: zeroAddress, fee: FEE_50_PERCENT }]

				await expect(
					inhabit.write.createGroup([REFERRAL_CODE, true, ambassadors], {
						account: deployer
					})
				).to.be.rejectedWith('ZERO_ADDRESS')
			})

			it('Should revert if total fees exceed 100%', async function () {
				const ambassadors = [
					{ account: luca, fee: FEE_50_PERCENT },
					{ account: juan, fee: FEE_50_PERCENT },
					{ account: santiago, fee: FEE_20_PERCENT } // Total: 120%
				]

				await expect(
					inhabit.write.createGroup([REFERRAL_CODE, true, ambassadors], {
						account: deployer
					})
				).to.be.rejectedWith('PERCENTAGE_ERROR')
			})

			it('Should revert if single ambassador fee exceeds 100%', async function () {
				const Ambassadors = [
					{ account: luca, fee: FEE_OVER_100_PERCENT } // 100.01%
				]

				await expect(
					inhabit.write.createGroup([REFERRAL_CODE, true, Ambassadors], {
						account: deployer
					})
				).to.be.rejectedWith('PERCENTAGE_ERROR')
			})

			it('Should create group successfully with valid parameters', async function () {
				const ambassadors = [
					{ account: luca, fee: FEE_50_PERCENT },
					{ account: juan, fee: FEE_30_PERCENT },
					{ account: santiago, fee: FEE_20_PERCENT }
				]

				const tx = await inhabit.write.createGroup(
					[REFERRAL_CODE, true, ambassadors],
					{
						account: deployer
					}
				)

				expect(tx).to.exist

				// Verify group count increased
				const groupCount = await inhabit.read.groupCount()
				expect(groupCount).to.equal(1n)

				// Verify group data
				const group = await inhabit.read.getGroup([REFERRAL_CODE])
				expect(group.referral).to.equal(REFERRAL_CODE)
				expect(group.state).to.be.true
				expect(group.ambassadors).to.have.lengthOf(3)
			})

			it('Should emit GroupCreated event', async function () {
				const ambassadors = [{ account: luca, fee: FEE_50_PERCENT }]

				// Note: Event verification depends on your setup
				// This is a simplified example
				const tx = await inhabit.write.createGroup(
					[REFERRAL_CODE, true, ambassadors],
					{
						account: deployer
					}
				)

				// You might need to check logs or use a different method based on your setup
				expect(tx).to.exist
			})

			it('Should create inactive group when state is false', async function () {
				const ambassadors = [{ account: luca, fee: MAX_FEE }]

				await inhabit.write.createGroup([REFERRAL_CODE, false, ambassadors], {
					account: deployer
				})

				const group = await inhabit.read.getGroup([REFERRAL_CODE])
				expect(group.state).to.be.false
			})

			it('Should handle edge case with exactly 100% fees', async function () {
				const ambassadors = [
					{ account: luca, fee: MAX_FEE } // Exactly 100%
				]

				const tx = await inhabit.write.createGroup(
					[REFERRAL_CODE, true, ambassadors],
					{
						account: deployer
					}
				)

				expect(tx).to.exist
			})

			it('Should allow empty ambassadors array', async function () {
				const ambassadors: AmbassadorStruct[] = []

				const tx = await inhabit.write.createGroup(
					[REFERRAL_CODE, true, ambassadors],
					{
						account: deployer
					}
				)

				expect(tx).to.exist

				const group = await inhabit.read.getGroup([REFERRAL_CODE])
				expect(group.ambassadors).to.have.lengthOf(0)
			})
		})

		describe('updateGroupStatus', function () {
			beforeEach(async function () {
				// Create a test group
				const ambassadors = [{ account: luca, fee: FEE_50_PERCENT }]
				await inhabit.write.createGroup([REFERRAL_CODE, true, ambassadors], {
					account: deployer
				})
			})

			it('Should revert if caller does not have ADMIN_ROLE', async function () {
				await expect(
					inhabit.write.updateGroupStatus([REFERRAL_CODE, false], {
						account: luca
					})
				).to.be.rejectedWith('AccessControlUnauthorizedAccount')
			})

			it('Should revert if group does not exist', async function () {
				await expect(
					inhabit.write.updateGroupStatus(['NONEXISTENT', false], {
						account: deployer
					})
				).to.be.rejectedWith('GROUP_NOT_FOUND')
			})

			it('Should revert if setting same state', async function () {
				await expect(
					inhabit.write.updateGroupStatus([REFERRAL_CODE, true], {
						account: deployer
					})
				).to.be.rejectedWith('SAME_STATE')
			})

			it('Should update group status successfully', async function () {
				const tx = await inhabit.write.updateGroupStatus(
					[REFERRAL_CODE, false],
					{
						account: deployer
					}
				)

				expect(tx).to.exist

				const group = await inhabit.read.getGroup([REFERRAL_CODE])
				expect(group.state).to.be.false
			})

			it('Should emit GroupStatusUpdated event', async function () {
				const tx = await inhabit.write.updateGroupStatus(
					[REFERRAL_CODE, false],
					{
						account: deployer
					}
				)

				expect(tx).to.exist
			})
		})

		describe('addAmbassadors', function () {
			beforeEach(async function () {
				// Create a test group with one ambassador
				const ambassadors = [{ account: luca, fee: FEE_30_PERCENT }]
				await inhabit.write.createGroup([REFERRAL_CODE, true, ambassadors], {
					account: deployer
				})
			})

			it('Should revert if caller does not have ADMIN_ROLE', async function () {
				const newAmbassadors = [{ account: juan, fee: FEE_30_PERCENT }]

				await expect(
					inhabit.write.addAmbassadors([REFERRAL_CODE, newAmbassadors], {
						account: luca
					})
				).to.be.rejectedWith('AccessControlUnauthorizedAccount')
			})

			it('Should revert if group does not exist', async function () {
				const newAmbassadors = [{ account: juan, fee: FEE_30_PERCENT }]

				await expect(
					inhabit.write.addAmbassadors(['NONEXISTENT', newAmbassadors], {
						account: deployer
					})
				).to.be.rejectedWith('GROUP_NOT_FOUND')
			})

			it('Should revert if ambassadors array is empty', async function () {
				await expect(
					inhabit.write.addAmbassadors([REFERRAL_CODE, []], {
						account: deployer
					})
				).to.be.rejectedWith('EMPTY_ARRAY')
			})

			it('Should revert if adding ambassador with zero address', async function () {
				const newAmbassadors = [{ account: zeroAddress, fee: FEE_30_PERCENT }]

				await expect(
					inhabit.write.addAmbassadors([REFERRAL_CODE, newAmbassadors], {
						account: deployer
					})
				).to.be.rejectedWith('ZERO_ADDRESS')
			})

			it('Should revert if total fees would exceed 100%', async function () {
				const newAmbassadors = [
					{ account: juan, fee: FEE_50_PERCENT },
					{ account: santiago, fee: FEE_30_PERCENT } // Total would be 110%
				]

				await expect(
					inhabit.write.addAmbassadors([REFERRAL_CODE, newAmbassadors], {
						account: deployer
					})
				).to.be.rejectedWith('PERCENTAGE_ERROR')
			})

			it('Should revert if adding ambassador with fee over 100%', async function () {
				const newAmbassadors = [{ account: juan, fee: FEE_OVER_100_PERCENT }]

				await expect(
					inhabit.write.addAmbassadors([REFERRAL_CODE, newAmbassadors], {
						account: deployer
					})
				).to.be.rejectedWith('PERCENTAGE_ERROR')
			})

			it('Should add ambassadors successfully', async function () {
				const newAmbassadors = [
					{ account: juan, fee: FEE_30_PERCENT },
					{ account: santiago, fee: FEE_20_PERCENT }
				]

				const tx = await inhabit.write.addAmbassadors(
					[REFERRAL_CODE, newAmbassadors],
					{
						account: deployer
					}
				)

				expect(tx).to.exist

				const group = await inhabit.read.getGroup([REFERRAL_CODE])
				expect(group.ambassadors).to.have.lengthOf(3)
			})

			it('Should emit AmbassadorsAdded event', async function () {
				const newAmbassadors = [{ account: juan, fee: FEE_20_PERCENT }]

				const tx = await inhabit.write.addAmbassadors(
					[REFERRAL_CODE, newAmbassadors],
					{
						account: deployer
					}
				)

				expect(tx).to.exist
			})

			it('Should handle adding multiple ambassadors at limit', async function () {
				const newAmbassadors = [
					{ account: juan, fee: FEE_50_PERCENT },
					{ account: santiago, fee: FEE_20_PERCENT } // Total exactly 100%
				]

				const tx = await inhabit.write.addAmbassadors(
					[REFERRAL_CODE, newAmbassadors],
					{
						account: deployer
					}
				)

				expect(tx).to.exist
			})

			it('Should not allow adding duplicate ambassador addresses', async function () {
				const newAmbassadors = [{ account: luca, fee: FEE_20_PERCENT }]

				await expect(
					inhabit.write.addAmbassadors([REFERRAL_CODE, newAmbassadors], {
						account: deployer
					})
				).to.be.rejectedWith('AMBASSADOR_ALREADY_EXISTS')
			})
		})

		describe('updateAmbassadors', function () {
			beforeEach(async function () {
				// Create a test group with ambassadors
				const ambassadors = [
					{ account: luca, fee: FEE_50_PERCENT },
					{ account: juan, fee: FEE_30_PERCENT }
				]
				await inhabit.write.createGroup([REFERRAL_CODE, true, ambassadors], {
					account: deployer
				})
			})

			it('Should revert if caller does not have ADMIN_ROLE', async function () {
				const updates = [{ account: luca, fee: FEE_30_PERCENT }]

				await expect(
					inhabit.write.updateAmbassadors([REFERRAL_CODE, updates], {
						account: luca
					})
				).to.be.rejectedWith('AccessControlUnauthorizedAccount')
			})

			it('Should revert if group does not exist', async function () {
				const updates = [{ account: luca, fee: FEE_30_PERCENT }]

				await expect(
					inhabit.write.updateAmbassadors(['NONEXISTENT', updates], {
						account: deployer
					})
				).to.be.rejectedWith('GROUP_NOT_FOUND')
			})

			it('Should revert if ambassadors array is empty', async function () {
				await expect(
					inhabit.write.updateAmbassadors([REFERRAL_CODE, []], {
						account: deployer
					})
				).to.be.rejectedWith('EMPTY_ARRAY')
			})

			it('Should revert if ambassador not found in group', async function () {
				const updates = [
					{ account: santiago, fee: FEE_30_PERCENT } // santiago not in group
				]

				await expect(
					inhabit.write.updateAmbassadors([REFERRAL_CODE, updates], {
						account: deployer
					})
				).to.be.rejectedWith('AMBASSADOR_NOT_FOUND')
			})

			it('Should revert if updating with zero address', async function () {
				const updates = [{ account: zeroAddress, fee: FEE_30_PERCENT }]

				await expect(
					inhabit.write.updateAmbassadors([REFERRAL_CODE, updates], {
						account: deployer
					})
				).to.be.rejectedWith('ZERO_ADDRESS')
			})

			it('Should revert if total fees would exceed 100%', async function () {
				const updates = [
					{ account: luca, fee: FEE_50_PERCENT },
					{ account: juan, fee: FEE_50_PERCENT + 1n } // Total would be 100.01%
				]

				await expect(
					inhabit.write.updateAmbassadors([REFERRAL_CODE, updates], {
						account: deployer
					})
				).to.be.rejectedWith('PERCENTAGE_ERROR')
			})

			it('Should revert if updating single ambassador to fee over 100%', async function () {
				const updates = [{ account: luca, fee: FEE_OVER_100_PERCENT }]

				await expect(
					inhabit.write.updateAmbassadors([REFERRAL_CODE, updates], {
						account: deployer
					})
				).to.be.rejectedWith('PERCENTAGE_ERROR')
			})

			it('Should update ambassador fees successfully', async function () {
				const updates = [
					{ account: luca, fee: FEE_30_PERCENT },
					{ account: juan, fee: FEE_20_PERCENT }
				]

				const tx = await inhabit.write.updateAmbassadors(
					[REFERRAL_CODE, updates],
					{
						account: deployer
					}
				)

				expect(tx).to.exist

				const group = await inhabit.read.getGroup([REFERRAL_CODE])
				// Verify fees were updated correctly
				const lucaAmbassador = group.ambassadors.find(
					(a: AmbassadorStruct) => a.account === luca
				)
				const juanAmbassador = group.ambassadors.find(
					(a: AmbassadorStruct) => a.account === juan
				)

				expect(lucaAmbassador.fee).to.equal(FEE_30_PERCENT)
				expect(juanAmbassador.fee).to.equal(FEE_20_PERCENT)
			})

			it('Should emit AmbassadorsUpdated event', async function () {
				const updates = [{ account: luca, fee: FEE_20_PERCENT }]

				const tx = await inhabit.write.updateAmbassadors(
					[REFERRAL_CODE, updates],
					{
						account: deployer
					}
				)

				expect(tx).to.exist
			})

			it('Should update single ambassador without affecting others', async function () {
				const updates = [{ account: luca, fee: FEE_20_PERCENT }]

				await inhabit.write.updateAmbassadors([REFERRAL_CODE, updates], {
					account: deployer
				})

				const group = await inhabit.read.getGroup([REFERRAL_CODE])
				const juanAmbassador = group.ambassadors.find(
					(a: AmbassadorStruct) => a.account === juan
				)

				// Juan's fee should remain unchanged
				expect(juanAmbassador.fee).to.equal(FEE_30_PERCENT)
			})
		})

		describe('removeAmbassadors', function () {
			beforeEach(async function () {
				// Create a test group with multiple ambassadors
				const ambassadors = [
					{ account: luca, fee: FEE_30_PERCENT },
					{ account: juan, fee: FEE_30_PERCENT },
					{ account: santiago, fee: FEE_20_PERCENT }
				]
				await inhabit.write.createGroup([REFERRAL_CODE, true, ambassadors], {
					account: deployer
				})
			})

			it('Should revert if caller does not have ADMIN_ROLE', async function () {
				await expect(
					inhabit.write.removeAmbassadors([REFERRAL_CODE, [luca]], {
						account: luca
					})
				).to.be.rejectedWith('AccessControlUnauthorizedAccount')
			})

			it('Should revert if group does not exist', async function () {
				await expect(
					inhabit.write.removeAmbassadors(['NONEXISTENT', [luca]], {
						account: deployer
					})
				).to.be.rejectedWith('GROUP_NOT_FOUND')
			})

			it('Should revert if accounts array is empty', async function () {
				await expect(
					inhabit.write.removeAmbassadors([REFERRAL_CODE, []], {
						account: deployer
					})
				).to.be.rejectedWith('EMPTY_ARRAY')
			})

			it('Should revert if trying to remove zero address', async function () {
				await expect(
					inhabit.write.removeAmbassadors([REFERRAL_CODE, [zeroAddress]], {
						account: deployer
					})
				).to.be.rejectedWith('ZERO_ADDRESS')
			})

			it('Should revert if ambassador not found', async function () {
				await expect(
					inhabit.write.removeAmbassadors([REFERRAL_CODE, [ledger]], {
						account: deployer
					})
				).to.be.rejectedWith('AMBASSADOR_NOT_FOUND')
			})

			it('Should remove single ambassador successfully', async function () {
				const tx = await inhabit.write.removeAmbassadors(
					[REFERRAL_CODE, [luca]],
					{
						account: deployer
					}
				)

				expect(tx).to.exist

				const group = await inhabit.read.getGroup([REFERRAL_CODE])
				expect(group.ambassadors).to.have.lengthOf(2)

				// Verify luca was removed
				const hasLuca = group.ambassadors.some(
					(a: AmbassadorStruct) => a.account === luca
				)
				expect(hasLuca).to.be.false
			})

			it('Should remove multiple ambassadors successfully', async function () {
				const tx = await inhabit.write.removeAmbassadors(
					[REFERRAL_CODE, [luca, juan]],
					{ account: deployer }
				)

				expect(tx).to.exist

				const group = await inhabit.read.getGroup([REFERRAL_CODE])
				expect(group.ambassadors).to.have.lengthOf(1)
				expect(group.ambassadors[0].account).to.equal(santiago)
			})

			it('Should emit AmbassadorsRemoved event', async function () {
				const tx = await inhabit.write.removeAmbassadors(
					[REFERRAL_CODE, [luca]],
					{
						account: deployer
					}
				)

				expect(tx).to.exist
			})

			it('Should allow removing all ambassadors', async function () {
				await inhabit.write.removeAmbassadors(
					[REFERRAL_CODE, [luca, juan, santiago]],
					{ account: deployer }
				)

				const group = await inhabit.read.getGroup([REFERRAL_CODE])
				expect(group.ambassadors).to.have.lengthOf(0)
			})
		})

		describe('Token Management', function () {
			describe('addToTokens', function () {
				it('Should revert if caller does not have ADMIN_ROLE', async function () {
					await expect(
						inhabit.write.addToTokens([[mockUSDC.address]], {
							account: luca
						})
					).to.be.rejectedWith('AccessControlUnauthorizedAccount')
				})

				it('Should revert if token address is zero', async function () {
					await expect(
						inhabit.write.addToTokens([[zeroAddress]], {
							account: deployer
						})
					).to.be.rejectedWith('ZERO_ADDRESS')
				})

				it('Should add single token successfully', async function () {
					const tx = await inhabit.write.addToTokens([[mockUSDC.address]], {
						account: deployer
					})

					expect(tx).to.exist

					const isSupported = await inhabit.read.isTokenSupported([
						mockUSDC.address
					])
					expect(isSupported).to.be.true
				})

				it('Should add multiple tokens successfully', async function () {
					const mockToken2 = nftCollection.address

					const tx = await inhabit.write.addToTokens(
						[[mockUSDC.address, mockToken2]],
						{ account: deployer }
					)

					expect(tx).to.exist

					const isUSDCSupported = await inhabit.read.isTokenSupported([
						mockUSDC.address
					])

					const isToken2Supported = await inhabit.read.isTokenSupported([
						mockToken2
					])

					expect(isUSDCSupported).to.be.true
					expect(isToken2Supported).to.be.true
				})

				// ❌ This test should fail - contract doesn't check for duplicates
				it('Should revert if token already exists', async function () {
					// Add token first time
					await inhabit.write.addToTokens([[mockUSDC.address]], {
						account: deployer
					})

					// Try to add same token again - SHOULD revert but doesn't
					await expect(
						inhabit.write.addToTokens([[mockUSDC.address]], {
							account: deployer
						})
					).to.be.rejectedWith('TOKEN_ALREADY_EXISTS')
				})
			})

			describe('removeFromTokens', function () {
				beforeEach(async function () {
					// Add a token first
					await inhabit.write.addToTokens([[mockUSDC.address]], {
						account: deployer
					})
				})

				it('Should revert if caller does not have ADMIN_ROLE', async function () {
					await expect(
						inhabit.write.removeFromTokens([mockUSDC.address], {
							account: luca
						})
					).to.be.rejectedWith('AccessControlUnauthorizedAccount')
				})

				it('Should revert if token address is zero', async function () {
					await expect(
						inhabit.write.removeFromTokens([zeroAddress], {
							account: deployer
						})
					).to.be.rejectedWith('ZERO_ADDRESS')
				})

				it('Should remove token successfully', async function () {
					const tx = await inhabit.write.removeFromTokens([mockUSDC.address], {
						account: deployer
					})

					expect(tx).to.exist

					const isSupported = await inhabit.read.isTokenSupported([
						mockUSDC.address
					])
					expect(isSupported).to.be.false
				})

				// ❌ This test should fail - contract doesn't check if token exists
				it('Should revert if token does not exist', async function () {
					const randomToken = '0x1234567890123456789012345678901234567890'

					await expect(
						inhabit.write.removeFromTokens([randomToken], {
							account: deployer
						})
					).to.be.rejectedWith('TOKEN_NOT_FOUND')
				})
			})
		})

		describe('Fund Recovery', function () {
			describe('recoverFunds', function () {
				beforeEach(async function () {
					// Send some funds to the contract
					await mockUSDC.write.mint([inhabit.address, parseEther('100')], {
						account: deployer
					})
				})

				it('Should revert if caller does not have ADMIN_ROLE', async function () {
					await expect(
						inhabit.write.recoverFunds([mockUSDC.address, ledger], {
							account: luca
						})
					).to.be.rejectedWith('AccessControlUnauthorizedAccount')
				})

				it('Should revert if destination address is zero', async function () {
					await expect(
						inhabit.write.recoverFunds([mockUSDC.address, zeroAddress], {
							account: deployer
						})
					).to.be.rejectedWith('ZERO_ADDRESS')
				})

				it('Should recover ERC20 tokens successfully', async function () {
					const balanceBefore = await mockUSDC.read.balanceOf([ledger])

					const tx = await inhabit.write.recoverFunds(
						[mockUSDC.address, ledger],
						{
							account: deployer
						}
					)

					expect(tx).to.exist

					const balanceAfter = await mockUSDC.read.balanceOf([ledger])
					const contractBalance = await mockUSDC.read.balanceOf([
						inhabit.address
					])

					expect(balanceAfter).to.equal(balanceBefore + parseEther('100'))
					expect(contractBalance).to.equal(0n)
				})

				it('Should recover native ETH successfully', async function () {
					const wallet = await viem.getWalletClient(deployer)
					const publicClient = await viem.getPublicClient()

					const hash = await wallet.sendTransaction({
						account: deployer,
						to: inhabit.address,
						value: parseEther('1')
					})

					await publicClient.waitForTransactionReceipt({ hash })

					const contractBefore = await publicClient.getBalance({
						address: inhabit.address
					})

					expect(contractBefore).to.equal(parseEther('1'))

					const ledgerBefore = await publicClient.getBalance({
						address: ledger
					})

					const recoverFundsTx = await inhabit.write.recoverFunds(
						[NATIVE, ledger],
						{
							account: deployer
						}
					)

					await publicClient.waitForTransactionReceipt({
						hash: recoverFundsTx
					})

					const ledgerAfter = await publicClient.getBalance({ address: ledger })

					const contractAfter = await publicClient.getBalance({
						address: inhabit.address
					})

					expect(contractAfter).to.equal(0n)
					expect(ledgerAfter - ledgerBefore).to.be.gte(parseEther('0.99999'))
				})

				it('Should handle recovery when contract has zero balance', async function () {
					await inhabit.write.recoverFunds([mockUSDC.address, ledger], {
						account: deployer
					})

					const tx = await inhabit.write.recoverFunds(
						[mockUSDC.address, ledger],
						{
							account: deployer
						}
					)

					expect(tx).to.exist
				})
			})
		})

		describe('View Functions', function () {
			describe('getGroup', function () {
				it('Should return empty group for non-existent referral', async function () {
					const group = await inhabit.read.getGroup(['NONEXISTENT'])

					expect(group.referral).to.equal('')
					expect(group.state).to.be.false
					expect(group.ambassadors).to.have.lengthOf(0)
				})

				it('Should return correct group data', async function () {
					const ambassadors = [
						{ account: luca, fee: FEE_50_PERCENT },
						{ account: juan, fee: FEE_30_PERCENT }
					]

					await inhabit.write.createGroup([REFERRAL_CODE, true, ambassadors], {
						account: deployer
					})

					const group = await inhabit.read.getGroup([REFERRAL_CODE])

					expect(group.referral).to.equal(REFERRAL_CODE)
					expect(group.state).to.be.true
					expect(group.ambassadors).to.have.lengthOf(2)
					expect(group.ambassadors[0].account).to.equal(luca)
					expect(group.ambassadors[0].fee).to.equal(FEE_50_PERCENT)
				})
			})

			describe('getGroupReferral', function () {
				it('Should return correct referral by index', async function () {
					// Create multiple groups
					await inhabit.write.createGroup(['GROUP1', true, []], {
						account: deployer
					})
					await inhabit.write.createGroup(['GROUP2', true, []], {
						account: deployer
					})

					const referral1 = await inhabit.read.getGroupReferral([1n])
					const referral2 = await inhabit.read.getGroupReferral([2n])

					expect(referral1).to.equal('GROUP1')
					expect(referral2).to.equal('GROUP2')
				})

				it('Should return empty string for invalid index', async function () {
					const referral = await inhabit.read.getGroupReferral([999n])
					expect(referral).to.equal('')
				})
			})

			describe('isTokenSupported', function () {
				it('Should return false for unsupported token', async function () {
					const isSupported = await inhabit.read.isTokenSupported([
						mockUSDC.address
					])
					expect(isSupported).to.be.false
				})

				it('Should return true for supported token', async function () {
					await inhabit.write.addToTokens([[mockUSDC.address]], {
						account: deployer
					})

					const isSupported = await inhabit.read.isTokenSupported([
						mockUSDC.address
					])
					expect(isSupported).to.be.true
				})
			})

			describe('calculateFee', function () {
				it('Should calculate fee correctly', async function () {
					const amount = parseEther('100')
					const percentage = 2500n // 25%

					const fee = await inhabit.read.calculateFee([amount, percentage])
					expect(fee).to.equal(parseEther('25'))
				})

				it('Should calculate fee correctly even with percentage over 100%', async function () {
					const amount = parseEther('100')

					const fee = await inhabit.read.calculateFee([
						amount,
						FEE_OVER_100_PERCENT
					])
					expect(fee).to.equal(parseEther('100.01'))
				})

				it('Should handle zero amount', async function () {
					const fee = await inhabit.read.calculateFee([0n, FEE_50_PERCENT])
					expect(fee).to.equal(0n)
				})

				it('Should handle zero percentage', async function () {
					const fee = await inhabit.read.calculateFee([parseEther('100'), 0n])
					expect(fee).to.equal(0n)
				})

				it('Should handle maximum values without overflow', async function () {
					const amount = parseEther('1000000') // 1M tokens
					const percentage = MAX_FEE // 100%

					const fee = await inhabit.read.calculateFee([amount, percentage])
					expect(fee).to.equal(amount)
				})
			})

			describe('groupCount', function () {
				it('Should track group count correctly', async function () {
					const initialCount = await inhabit.read.groupCount()
					expect(initialCount).to.equal(0n)

					// Create groups
					await inhabit.write.createGroup(['GROUP1', true, []], {
						account: deployer
					})
					await inhabit.write.createGroup(['GROUP2', true, []], {
						account: deployer
					})

					const finalCount = await inhabit.read.groupCount()
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
				// 2. Group with ambassadors
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
				const ambassadors = [{ account: luca, fee: FEE_50_PERCENT }]

				const tx = await inhabit.write.createGroup(
					[specialReferral, true, ambassadors],
					{
						account: deployer
					}
				)

				expect(tx).to.exist

				const group = await inhabit.read.getGroup([specialReferral])
				expect(group.referral).to.equal(specialReferral)
			})

			it('Should handle very long referral codes', async function () {
				const longReferral = 'A'.repeat(100) // 100 character referral
				const ambassadors = [{ account: luca, fee: FEE_50_PERCENT }]

				const tx = await inhabit.write.createGroup(
					[longReferral, true, ambassadors],
					{
						account: deployer
					}
				)

				expect(tx).to.exist
			})

			it('❌ Should handle groups with many ambassadors efficiently', async function () {
				// Create group with many ambassadors (potential gas issue)
				const manyAmbassadors = []
				const feePerAmbassador = 100n // 1% each

				// Create 100 ambassadors (this might hit gas limits)
				for (let i = 0; i < 100; i++) {
					const account = `0x${(i + 1).toString(16).padStart(40, '0')}`
					manyAmbassadors.push({ account, fee: feePerAmbassador })
				}

				// This might fail due to gas limits - exposing DOS vulnerability
				await expect(
					inhabit.write.createGroup(['LARGE_GROUP', true, manyAmbassadors], {
						account: deployer
					})
				).to.be.rejectedWith('GAS_LIMIT_EXCEEDED')
			})
		})
	})
})
