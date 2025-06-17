import { task } from 'hardhat/config'
import { Address } from 'viem'

import { CollectionParams } from '@/models'

task('addCampaign', 'Adds a new campaign to the Inhabit contract').setAction(
	async (_, hre) => {
		try {
			const { viem } = hre
			const { getNamedAccounts, deployments } = hre
			const { deployer } = await getNamedAccounts()

			const publicClient = await viem.getPublicClient()

			const { address: inhabitAddress } = await deployments.get('Inhabit')
			const inhabit = await viem.getContractAt(
				'Inhabit',
				inhabitAddress as Address
			)

			const GOAL = 100000000000n // 100,000 USDC

			const NFT_COLLECTIONS: CollectionParams[] = [
				{
					name: 'INHABIT Ñuiyanzhi CARACOLI',
					symbol: 'CARACOLI',
					uri: 'https://black-fast-chipmunk-543.mypinata.cloud/ipfs/bafkreiczdctjncnwxrnuuaz66wgv37a4u7ycrqnkt2n73cu4bafdv5z5oa',
					supply: 19n,
					price: 2000000000n,
					state: true
				},
				{
					name: 'INHABIT Ñuiyanzhi JAGUAR',
					symbol: 'JAGUAR',
					uri: 'https://black-fast-chipmunk-543.mypinata.cloud/ipfs/bafkreic5q7x2j3y6z4g3k5v7b2c4q6f5z7w5t6y8u9h3j4k2l5m6n7o8p9',
					supply: 5n,
					price: 5000000000n,
					state: true
				},
				{
					name: 'INHABIT Ñuiyanzhi PAUJIL',
					symbol: 'PAUJIL',
					uri: 'https://black-fast-chipmunk-543.mypinata.cloud/ipfs/bafkreig63uzhbc2p3nddkkqtw3ildtgbcc7buoyd6flnz6qyzk2m3beuxe',
					supply: 124n,
					price: 500000000n,
					state: true
				},
				{
					name: 'INHABIT Ñuiyanzhi TITI',
					symbol: 'TITI',
					uri: 'https://black-fast-chipmunk-543.mypinata.cloud/ipfs/bafkreihqsoyx6iiqxjp2qughd54xz2gtgddj2ivjgwfqfnitvkkmkmg6au',
					supply: 2483n,
					price: 50000000n,
					state: true
				}
			]

			console.log('----------------------------------------------------')
			console.log('Adding campaign NFT collection...')

			const txHash = await inhabit.write.createCampaign(
				[GOAL, NFT_COLLECTIONS],
				{
					account: deployer as Address
				}
			)

			await publicClient.waitForTransactionReceipt({ hash: txHash })

			console.log(`Campaign created. tx hash: ${txHash}`)
		} catch (error) {
			console.error('❌', error)
			throw error
		}
	}
)
