import chai from 'chai'
import chaiBigint from 'chai-bigint'
import hre, { viem } from 'hardhat'
import { Address, GetContractReturnType } from 'viem'

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
	nftCollection: GetContractReturnType<typeof ABIS.MockErc20>
}

describe('Inhabit', function () {
	async function deployFixture(): Promise<FixtureReturn> {
		const { deployments, getNamedAccounts } = hre
		const { deployer, luca, juan, santiago, ledger } = await getNamedAccounts()

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
		)) as unknown as GetContractReturnType<typeof ABIS.MockErc20>

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

	describe('Groups', function () {
		describe('createGroup', function () {
			beforeEach(async function () {
				const fixture = await deployFixture()
				Object.assign(this, fixture)
			})

			it('should create a group successfully', async function () {
				const { inhabit, deployer } = this
			})
		})
	})
})
