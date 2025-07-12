import { Address } from 'viem'

import { CollectionParams, NetworkConfigInfo } from '@/models'

// Hardhat and Localhost are development chains

export const developmentChains = ['hardhat', 'localhost']

export const stagingChains = ['celoAlfajores']

export const productionChains = ['celo']

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

export const NATIVE: Address = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

// Celo Mainnet

export const CELO_NFT_COLLECTIONS: CollectionParams[] = [
	{
		name: 'INHABIT Ñuiyanzhi TITI',
		symbol: 'TITI',
		uri: 'ipfs://bafkreihqsoyx6iiqxjp2qughd54xz2gtgddj2ivjgwfqfnitvkkmkmg6au',
		supply: 2483n,
		price: 50_000_000n,
		state: true
	},
	{
		name: 'INHABIT Ñuiyanzhi PAUJIL',
		symbol: 'PAUJIL',
		uri: 'ipfs://bafkreig63uzhbc2p3nddkkqtw3ildtgbcc7buoyd6flnz6qyzk2m3beuxe',
		supply: 124n,
		price: 500_000_000n,
		state: true
	},
	{
		name: 'INHABIT Ñuiyanzhi CARACOLI',
		symbol: 'CARACOLI',
		uri: 'ipfs://bafkreiczdctjncnwxrnuuaz66wgv37a4u7ycrqnkt2n73cu4bafdv5z5oa',
		supply: 19n,
		price: 2000_000_000n,
		state: true
	},
	{
		name: 'INHABIT Ñuiyanzhi JAGUAR',
		symbol: 'JAGUAR',
		uri: 'ipfs://bafkreih4fccggynla475clgzrj2rs2ulggxvi7lwyavhjcyjeuxjduetoq',
		supply: 5n,
		price: 5000_000_000n,
		state: true
	}
]

// Celo Alfajores

export const TREASURY_ADDRESS: Address =
	'0xd243438f6d14E2097e96D81e56E08C7D847a67A6'

export const SALVIEGA_ADDRESS: Address =
	'0xd7A4467a26d26d00cB6044CE09eBD69EDAC0564C'

export const LUCA_ADDRESS: Address =
	'0x7753E5f36f20B14fFb6b6a61319Eb66f63abdb0b'

export const CELO_ALFAJORES_CUSD_ADDRESS: Address =
	'0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1' // 18 decimals

export const CELO_ALFAJORES_USDC_ADDRESS: Address =
	'0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B' // 6 decimals

export const CELO_ALFAJORES_MOCK_NATIVE_USDT_ADDRESS: Address =
	'0xBba91F588d031469ABCCA566FE80fB1Ad8Ee3287' // 6 by Mento

export const CELO_ALFAJORES_NFT_COLLECTIONS: CollectionParams[] = [
	{
		name: 'INHABIT Ñuiyanzhi TITI',
		symbol: 'TITI',
		uri: 'ipfs://bafybeiejfgiaw4l6hysgwgos5pvc53hpjrgehydcym7zqphfkpqh4x4v7q/01-titi.json',
		supply: 2483n,
		price: 1_000_000n,
		state: true
	},
	{
		name: 'INHABIT Ñuiyanzhi PAUJIL',
		symbol: 'PAUJIL',
		uri: 'ipfs://bafybeiejfgiaw4l6hysgwgos5pvc53hpjrgehydcym7zqphfkpqh4x4v7q/03-caracoli.json',
		supply: 124n,
		price: 2_000_000n,
		state: true
	},
	{
		name: 'INHABIT Ñuiyanzhi CARACOLI',
		symbol: 'CARACOLI',
		uri: 'ipfs://bafybeiejfgiaw4l6hysgwgos5pvc53hpjrgehydcym7zqphfkpqh4x4v7q/04-jaguar.json',
		supply: 19n,
		price: 3_000_000n,
		state: true
	},
	{
		name: 'INHABIT Ñuiyanzhi JAGUAR',
		symbol: 'JAGUAR',
		uri: 'ipfs://bafkreiae3gykborfjm565gnxlswd7yaiqn66s4kbntrsjlqaemrgjduhqi',
		supply: 5n,
		price: 4_000_000n,
		state: true
	}
]
