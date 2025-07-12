import { task } from 'hardhat/config'
import { Address } from 'viem'

import {
	CELO_ALFAJORES_NFT_COLLECTIONS,
	CELO_NFT_COLLECTIONS,
	productionChains
} from '@/config/const'

task('addCampaign', 'Adds a new campaign to the Inhabit contract').setAction(
	async (_, hre) => {
		try {
			const { viem } = hre
			const { getNamedAccounts, deployments, network } = hre
			const { deployer } = await getNamedAccounts()

			const publicClient = await viem.getPublicClient()

			const { address: inhabitAddress } = await deployments.get('Inhabit')
			const inhabit = await viem.getContractAt(
				'Inhabit',
				inhabitAddress as Address
			)

			const GOAL = 100_000_000_000n // 100,000 USDC

			const nftCollections = productionChains.includes(network.name)
				? CELO_NFT_COLLECTIONS
				: CELO_ALFAJORES_NFT_COLLECTIONS

			console.log('----------------------------------------------------')
			console.log('Adding campaign NFT collection...')

			const txHash = await inhabit.write.createCampaign(
				[GOAL, nftCollections],
				{
					account: deployer as Address
				}
			)

			await publicClient.waitForTransactionReceipt({ hash: txHash })

			console.log(`Campaign created. tx hash: ${txHash}`)
		} catch (error) {
			console.error('❌', error)
		}
	}
)
