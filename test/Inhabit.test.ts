import chai, { expect } from 'chai'
import chaiBigint from 'chai-bigint'
import hre, { viem } from 'hardhat'
import { Address, encodeFunctionData, Hex, zeroHash } from 'viem'

import { LOCAL_NFT_COLLECTIONS } from '@/config/const'

chai.use(chaiBigint)

type Contract = Awaited<ReturnType<typeof viem.getContractAt>>

type Fixture = {
	deployer: Address
	luca: Address
	ledger: Address
	inhabit: Contract
	mockUSDC: Contract
	forwarder: Contract
}

describe('Inhabit', function () {
	let fixture: Fixture
	let deployer: Address
	let luca: Address
	let ledger: Address
	let inhabit: Contract
	let mockUSDC: Contract
	let forwarder: Contract

	async function deployFixture(): Promise<Fixture> {
		const { deployments, getNamedAccounts } = hre
		const { deployer, luca, ledger } = await getNamedAccounts()

		await deployments.fixture(['localhost'])

		// Mock ERC20 (USDC)
		const mockErc20Address = (await deployments.get('MockErc20'))
			.address as Address

		const mockUSDC = await viem.getContractAt('MockErc20', mockErc20Address)

		// Forwarder
		const forwarderAddress = (await deployments.get('Forwarder'))
			.address as Address

		const forwarder = await viem.getContractAt('Forwarder', forwarderAddress)

		// Inhabit
		const inhabitAddress = (await deployments.get('Inhabit')).address as Address

		const inhabit = await viem.getContractAt('Inhabit', inhabitAddress)

		// Set treasury to ledger (treasury is zeroAddress in localhost by default)
		await inhabit.write.setTreasury([ledger], {
			account: deployer as Address
		})

		// mint USDC to deployer
		await mockUSDC.write.mint([deployer, 100_000_000n], {
			account: deployer
		})

		// add campaign
		const GOAL = 180_000_000_000n // 180,000 USDC

		const nftCollections = LOCAL_NFT_COLLECTIONS(mockUSDC.address)

		console.log('----------------------------------------------------')
		console.log('Adding campaign NFT collection...')

		await inhabit.write.createCampaign([GOAL, nftCollections], {
			account: deployer as Address
		})

		return {
			deployer: deployer as Address,
			luca: luca as Address,
			ledger: ledger as Address,
			inhabit: inhabit as Contract,
			mockUSDC: mockUSDC as Contract,
			forwarder: forwarder as Contract
		}
	}

	describe('Inhabit main contract', function () {
		beforeEach(async function () {
			fixture = await deployFixture()
			;({ deployer, luca, ledger, inhabit, mockUSDC, forwarder } = fixture)
		})

		it('Should buy NFT for Luca and then Luca returns it to deployer via meta transaction', async function () {
			const publicClient = await viem.getPublicClient()

			// 1. Get campaign info to obtain the collection address
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const campaignInfo = (await inhabit.read.getCampaignInfo([1n])) as any
			const collectionAddress = campaignInfo.collectionsInfo[0]
				.collectionAddress as Address

			console.log('Collection address:', collectionAddress)

			// Get NFTCollection contract
			const nftCollection = await viem.getContractAt(
				'NFTCollection',
				collectionAddress
			)

			// 2. Approve USDC for Inhabit contract
			const nftPrice = campaignInfo.collectionsInfo[0].price as bigint
			console.log('NFT Price:', nftPrice)

			await mockUSDC.write.approve([inhabit.address, nftPrice], {
				account: deployer
			})

			// 3. Buy NFT for Luca
			const txBuyNft = await inhabit.write.buyNFT(
				[
					luca, // _to
					1n, // _campaignId
					collectionAddress, // _collection
					zeroHash, // _referral (no referral)
					mockUSDC.address, // _paymentToken
					nftPrice // _paymentAmount
				],
				{
					account: deployer
				}
			)

			await publicClient.waitForTransactionReceipt({ hash: txBuyNft })

			// Verify Luca owns the NFT (tokenId = 1)
			const tokenId = 1n
			const ownerAfterBuy = (await nftCollection.read.ownerOf([
				tokenId
			])) as Address
			expect(ownerAfterBuy.toLowerCase()).to.equal(luca.toLowerCase())

			console.log('✅ NFT purchased for Luca. Token ID:', tokenId)

			// 4. Now Luca wants to return the NFT to deployer via meta transaction
			// Get Luca's wallet client to sign the meta transaction
			const lucaWalletClient = await viem.getWalletClient(luca)

			// Get nonce for Luca from the Forwarder
			const nonce = (await forwarder.read.nonces([luca])) as bigint
			console.log('Luca nonce:', nonce)

			// Get EIP712 domain from the Forwarder contract
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const eip712Domain = (await forwarder.read.eip712Domain()) as any
			console.log('----------------------------------------------------')
			console.log('EIP712 Domain from contract:')
			console.log('  Name:', eip712Domain[1])
			console.log('  Version:', eip712Domain[2])
			console.log('  ChainId:', eip712Domain[3])
			console.log('  VerifyingContract:', eip712Domain[4])

			// Prepare the calldata for metaTransferFrom(from, to, tokenId)
			const calldata = encodeFunctionData({
				abi: nftCollection.abi,
				functionName: 'metaTransferFrom',
				args: [luca, deployer, tokenId]
			})

			console.log('Calldata:', calldata)

			// Set deadline to 1 hour from now
			const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600)

			// Prepare the ForwardRequest for signing
			const forwardRequest = {
				from: luca,
				to: collectionAddress,
				value: 0n,
				gas: 200000n,
				nonce: nonce,
				deadline: deadline,
				data: calldata as Hex
			}

			console.log('----------------------------------------------------')
			console.log('Forward Request:')
			console.log('  from:', forwardRequest.from)
			console.log('  to:', forwardRequest.to)
			console.log('  value:', forwardRequest.value)
			console.log('  gas:', forwardRequest.gas)
			console.log('  nonce:', forwardRequest.nonce)
			console.log('  deadline:', forwardRequest.deadline)
			console.log('  data:', forwardRequest.data)

			// Get chain ID
			const chainId = await publicClient.getChainId()
			console.log('Chain ID:', chainId)

			// EIP-712 domain for the Forwarder - USE THE CORRECT NAME FROM DEPLOY
			const domain = {
				name: eip712Domain[1] as string, // Use the name from the contract
				version: eip712Domain[2] as string, // Use the version from the contract
				chainId: BigInt(chainId),
				verifyingContract: forwarder.address as Address
			}

			console.log('----------------------------------------------------')
			console.log('Domain for signing:')
			console.log('  name:', domain.name)
			console.log('  version:', domain.version)
			console.log('  chainId:', domain.chainId)
			console.log('  verifyingContract:', domain.verifyingContract)

			// EIP-712 types for ForwardRequest
			const types = {
				ForwardRequest: [
					{ name: 'from', type: 'address' },
					{ name: 'to', type: 'address' },
					{ name: 'value', type: 'uint256' },
					{ name: 'gas', type: 'uint256' },
					{ name: 'nonce', type: 'uint256' },
					{ name: 'deadline', type: 'uint48' },
					{ name: 'data', type: 'bytes' }
				]
			}

			console.log('----------------------------------------------------')
			console.log('Types:', JSON.stringify(types, null, 2))

			// Sign the typed data with Luca's wallet
			const signature = await lucaWalletClient.signTypedData({
				account: luca,
				domain,
				types,
				primaryType: 'ForwardRequest',
				message: forwardRequest
			})

			console.log('----------------------------------------------------')
			console.log('Signature:', signature)

			// Prepare the ForwardRequestData for execute (includes signature)
			const forwardRequestData = {
				from: luca,
				to: collectionAddress,
				value: 0n,
				gas: 200000n,
				deadline: deadline,
				data: calldata as Hex,
				signature: signature
			}

			console.log('----------------------------------------------------')
			console.log('Forward Request Data for execute:')
			console.log('  from:', forwardRequestData.from)
			console.log('  to:', forwardRequestData.to)
			console.log('  value:', forwardRequestData.value.toString())
			console.log('  gas:', forwardRequestData.gas.toString())
			console.log('  deadline:', forwardRequestData.deadline.toString())
			console.log('  data:', forwardRequestData.data)
			console.log('  signature:', forwardRequestData.signature)

			// 5. Execute the meta transaction from deployer (as relayer)
			const txMetaTransfer = await forwarder.write.execute(
				[forwardRequestData],
				{
					account: deployer
				}
			)

			await publicClient.waitForTransactionReceipt({ hash: txMetaTransfer })

			// 6. Verify deployer now owns the NFT
			const ownerAfterMetaTransfer = (await nftCollection.read.ownerOf([
				tokenId
			])) as Address
			expect(ownerAfterMetaTransfer.toLowerCase()).to.equal(
				deployer.toLowerCase()
			)

			console.log(
				'✅ NFT successfully returned to deployer via meta transaction!'
			)
		})
	})
})
