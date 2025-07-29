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

// NFT Collections

const CELO_NFT_COLLECTIONS: CollectionParams[] = [
	{
		name: 'INHABIT Ñuiyanzhi TITI',
		symbol: 'TITI',
		uri: 'ipfs://bafkreidij5vgh5kxt3q6wj2kcfijvctqkclpnkkx2rfzxz3ud44ddjqzki',
		supply: 2483n,
		price: 50_000_000n,
		state: true
	},
	{
		name: 'INHABIT Ñuiyanzhi PAUJIL',
		symbol: 'PAUJIL',
		uri: 'ipfs://bafkreiclrauiief3ll6sip6jr4vbhsyh4m5iwfopayifjblpek7vudasr4',
		supply: 124n,
		price: 500_000_000n,
		state: true
	},
	{
		name: 'INHABIT Ñuiyanzhi CARACOLI',
		symbol: 'CARACOLI',
		uri: 'ipfs://bafkreidrdymjzsmuaxz7it44cqfccivy74vxrxjn3mxm276lx5tuywchcy',
		supply: 19n,
		price: 2000_000_000n,
		state: true
	},
	{
		name: 'INHABIT Ñuiyanzhi JAGUAR',
		symbol: 'JAGUAR',
		uri: 'ipfs://bafkreigja4pmvrxiwfba2llgwgv76yjbnkd7sizrcz7kb7qt7vpnzl27lu',
		supply: 5n,
		price: 5000_000_000n,
		state: true
	}
]

const CELO_ALFAJORES_NFT_COLLECTIONS: CollectionParams[] = [
	{
		name: 'INHABIT Ñuiyanzhi TITI',
		symbol: 'TITI',
		uri: 'ipfs://bafkreidij5vgh5kxt3q6wj2kcfijvctqkclpnkkx2rfzxz3ud44ddjqzki',
		supply: 2483n,
		price: 1_000_000n,
		state: true
	},
	{
		name: 'INHABIT Ñuiyanzhi PAUJIL',
		symbol: 'PAUJIL',
		uri: 'ipfs://bafkreiclrauiief3ll6sip6jr4vbhsyh4m5iwfopayifjblpek7vudasr4',
		supply: 124n,
		price: 2_000_000n,
		state: true
	},
	{
		name: 'INHABIT Ñuiyanzhi CARACOLI',
		symbol: 'CARACOLI',
		uri: 'ipfs://bafkreidrdymjzsmuaxz7it44cqfccivy74vxrxjn3mxm276lx5tuywchcy',
		supply: 19n,
		price: 3_000_000n,
		state: true
	},
	{
		name: 'INHABIT Ñuiyanzhi JAGUAR',
		symbol: 'JAGUAR',
		uri: 'ipfs://bafkreigja4pmvrxiwfba2llgwgv76yjbnkd7sizrcz7kb7qt7vpnzl27lu',
		supply: 5n,
		price: 4_000_000n,
		state: true
	}
]

export const NFT_COLLECTIONS: (chain: string) => CollectionParams[] = (
	chain: string
) => {
	switch (chain) {
		case 'celo':
			return CELO_NFT_COLLECTIONS
		case 'celoAlfajores':
			return CELO_ALFAJORES_NFT_COLLECTIONS
		default:
			throw new Error(`Unsupported chain: ${chain}`)
	}
}

const CELO_TREASURY_ADDRESS: Address =
	'0xd243438f6d14E2097e96D81e56E08C7D847a67A6'

const CELO_ALFAJORES_TREASURY_ADDRESS: Address =
	'0xd243438f6d14E2097e96D81e56E08C7D847a67A6'

export const TREASURY_ADDRESS: (chain: string) => Address = (chain: string) => {
	switch (chain) {
		case 'celo':
			return CELO_TREASURY_ADDRESS
		case 'celoAlfajores':
			return CELO_ALFAJORES_TREASURY_ADDRESS
		default:
			throw new Error(`Unsupported chain: ${chain}`)
	}
}

// CUSD
const CELO_CUSD_ADDRESS: Address = '0x765DE816845861e75A25fCA122bb6898B8B1282a' // 18 decimals

const CELO_ALFAJORES_CUSD_ADDRESS: Address =
	'0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1' // 18 decimals

export const CUSD_ADDRESS: (chain: string) => Address = (chain: string) => {
	switch (chain) {
		case 'celo':
			return CELO_CUSD_ADDRESS
		case 'celoAlfajores':
			return CELO_ALFAJORES_CUSD_ADDRESS
		default:
			throw new Error(`Unsupported chain: ${chain}`)
	}
}

// USDC
const CELO_USDC_ADDRESS: Address = '0xef4229c8c3250C675F21BCefa42f58EfbfF6002a' // 6 decimals

const CELO_ALFAJORES_USDC_ADDRESS: Address =
	'0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B' // 6 decimals

export const USDC_ADDRESS: (chain: string) => Address = (chain: string) => {
	switch (chain) {
		case 'celo':
			return CELO_USDC_ADDRESS
		case 'celoAlfajores':
			return CELO_ALFAJORES_USDC_ADDRESS
		default:
			throw new Error(`Unsupported chain: ${chain}`)
	}
}

// USDT
const CELO_USDT_ADDRESS: Address = '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e' // 6 decimals

const CELO_ALFAJORES_MOCK_NATIVE_USDT_ADDRESS: Address =
	'0xBba91F588d031469ABCCA566FE80fB1Ad8Ee3287' // 6 by Mento

export const USDT_ADDRESS: (chain: string) => Address = (chain: string) => {
	switch (chain) {
		case 'celo':
			return CELO_USDT_ADDRESS
		case 'celoAlfajores':
			return CELO_ALFAJORES_MOCK_NATIVE_USDT_ADDRESS
		default:
			throw new Error(`Unsupported chain: ${chain}`)
	}
}

// Admins and Users
export const SALVIEGA_ADDRESS: Address =
	'0xd7A4467a26d26d00cB6044CE09eBD69EDAC0564C'

export const LUCA_ADDRESS: Address =
	'0x7753E5f36f20B14fFb6b6a61319Eb66f63abdb0b'
