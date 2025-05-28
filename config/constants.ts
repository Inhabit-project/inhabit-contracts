import { Address } from 'viem'

import { NetworkConfigInfo } from '@/models'

// Hardhat and Localhost are development chains

export const developmentChains = ['hardhat', 'localhost']

export const networkConfig: NetworkConfigInfo = {
	localhost: {},
	hardhat: {},
	celo: {
		blockConfirmations: 3
	},
	celoAlfajores: {
		blockConfirmations: 3
	}
}

// NFT Collections

export const NFT_COLLECTIONS = {
	caracoli: {
		metadataUrl:
			'https://black-fast-chipmunk-543.mypinata.cloud/ipfs/bafkreiczdctjncnwxrnuuaz66wgv37a4u7ycrqnkt2n73cu4bafdv5z5oa',
		price: 2000n
	},
	jaguar: {
		metadataUrl:
			'https://black-fast-chipmunk-543.mypinata.cloud/ipfs/bafkreih4fccggynla475clgzrj2rs2ulggxvi7lwyavhjcyjeuxjduetoq',
		price: 5000n
	},
	paujil: {
		metadataUrl:
			'https://black-fast-chipmunk-543.mypinata.cloud/ipfs/bafkreig63uzhbc2p3nddkkqtw3ildtgbcc7buoyd6flnz6qyzk2m3beuxe',
		price: 500n
	},
	titi: {
		metadataUrl:
			'https://black-fast-chipmunk-543.mypinata.cloud/ipfs/bafkreihqsoyx6iiqxjp2qughd54xz2gtgddj2ivjgwfqfnitvkkmkmg6au',
		price: 50n
	}
}

// Addresses tokens

export const CELO_ALFAJORES_CUSD_ADDRESS: Address =
	'0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B' // USDC on Alfajores

export const NATIVE: Address = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

export const TEST_TOKEN_ONE: Address =
	'0xd243438f6d14E2097e96D81e56E08C7D847a67A6'

export const TEST_TOKEN_TWO: Address =
	'0x7Db67b92794e2569DAB6A2E38D877900F8883350'
