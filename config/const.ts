import { Address, zeroAddress } from 'viem'

import { CollectionParams, NetworkConfigInfo } from '@/models'

// Hardhat and Localhost are development chains

export const developmentChains = ['hardhat', 'localhost']

export const stagingChains = ['celoAlfajores', 'celoSepolia']

export const productionChains = ['celo']

export const networkConfig: NetworkConfigInfo = {
	localhost: {},
	hardhat: {},
	celo: {
		blockConfirmations: 3
	},
	celoAlfajores: {
		blockConfirmations: 3
	},
	celoSepolia: {
		blockConfirmations: 3
	}
}

export const NATIVE: Address = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

// Treasury
const treasuryAddresses: Record<string, Address> = {
	celo: '0xfba00D9F6b1fE0C1BD232A85bfF934A5e1EF0F8b',
	celoAlfajores: '0xd243438f6d14E2097e96D81e56E08C7D847a67A6',
	celoSepolia: '0xd243438f6d14E2097e96D81e56E08C7D847a67A6'
}

export const TREASURY_ADDRESS: (chain: string) => Address = (chain: string) => {
	switch (chain) {
		case 'localhost':
			return zeroAddress
		case 'hardhat':
			return zeroAddress
		case 'celo':
			return treasuryAddresses.celo
		case 'celoAlfajores':
			return treasuryAddresses.celoAlfajores
		case 'celoSepolia':
			return treasuryAddresses.celoSepolia
		default:
			throw new Error(`Unsupported chain: ${chain}`)
	}
}

// Chainlink
/// Price Feeds
//// CCOP / USD
const ccopUsdAddresses: Record<string, Address> = {
	celo: '0x97b770B0200CCe161907a9cbe0C6B177679f8F7C',
	celoAlfajores: '0xe49Ef087247030CF9C4035DBaA55f5c7659c9334',
	celoSepolia: '0xe49Ef087247030CF9C4035DBaA55f5c7659c9334'
}

//// CUSD / USD
const cusdUsdAddresses: Record<string, Address> = {
	celo: '0xe38A27BE4E7d866327e09736F3C570F256FFd048',
	celoAlfajores: '0x8b255b1FB27d4D06bD8899f81095627464868EEE',
	celoSepolia: '0x8b255b1FB27d4D06bD8899f81095627464868EEE'
}

//// USDC / USD
const usdcUsdAddresses: Record<string, Address> = {
	celo: '0xc7A353BaE210aed958a1A2928b654938EC59DaB2',
	celoAlfajores: '0x642Abc0c069dC5041dEA5bFC155D38D844779274',
	celoSepolia: '0x642Abc0c069dC5041dEA5bFC155D38D844779274'
}

//// CCOP / USD Address
export const CCOP_USD_ADDRESS: (chain: string) => Address = (chain: string) => {
	switch (chain) {
		case 'celo':
			return ccopUsdAddresses.celo
		case 'celoAlfajores':
			return ccopUsdAddresses.celoAlfajores
		case 'celoSepolia':
			return ccopUsdAddresses.celoSepolia
		default:
			throw new Error(`Unsupported chain: ${chain}`)
	}
}

//// CUSD / USD Address
export const CUSD_USD_ADDRESS: (chain: string) => Address = (chain: string) => {
	switch (chain) {
		case 'celo':
			return cusdUsdAddresses.celo
		case 'celoAlfajores':
			return cusdUsdAddresses.celoAlfajores
		case 'celoSepolia':
			return cusdUsdAddresses.celoSepolia
		default:
			throw new Error(`Unsupported chain: ${chain}`)
	}
}

//// USDC / USD Address
export const USDC_USD_ADDRESS: (chain: string) => Address = (chain: string) => {
	switch (chain) {
		case 'celo':
			return usdcUsdAddresses.celo
		case 'celoAlfajores':
			return usdcUsdAddresses.celoAlfajores
		case 'celoSepolia':
			return usdcUsdAddresses.celoSepolia
		default:
			throw new Error(`Unsupported chain: ${chain}`)
	}
}

// COINS
/// cCOP addresses
const ccopAddresses: Record<string, Address> = {
	celo: '0x8A567e2aE79CA692Bd748aB832081C45de4041eA',
	celoAlfajores: '0xe6A57340f0df6E020c1c0a80bC6E13048601f0d4',
	celoSepolia: '0x5F8d55c3627d2dc0a2B4afa798f877242F382F67'
}

/// cUSD addresses
const cusdAddresses: Record<string, Address> = {
	celo: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
	celoAlfajores: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
	celoSepolia: '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b'
}

/// USDC addresses
const usdcAddresses: Record<string, Address> = {
	celo: '0xef4229c8c3250C675F21BCefa42f58EfbfF6002a',
	celoAlfajores: '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B',
	celoSepolia: '0x01C5C0122039549AD1493B8220cABEdD739BC44E'
}

// USDT addresses
const usdtAddresses: Record<string, Address> = {
	celo: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
	celoAlfajores: '0xBba91F588d031469ABCCA566FE80fB1Ad8Ee3287',
	celoSepolia: '0xd077A400968890Eacc75cdc901F0356c943e4fDb'
}

// cCOP Address
export const CCOP_ADDRESS: (chain: string) => Address = (chain: string) => {
	switch (chain) {
		case 'celo':
			return ccopAddresses.celo
		case 'celoAlfajores':
			return ccopAddresses.celoAlfajores
		case 'celoSepolia':
			return ccopAddresses.celoSepolia
		default:
			throw new Error(`Unsupported chain: ${chain}`)
	}
}

// cUSD Address
export const CUSD_ADDRESS: (chain: string) => Address = (chain: string) => {
	switch (chain) {
		case 'celo':
			return cusdAddresses.celo
		case 'celoAlfajores':
			return cusdAddresses.celoAlfajores
		case 'celoSepolia':
			return cusdAddresses.celoSepolia
		default:
			throw new Error(`Unsupported chain: ${chain}`)
	}
}

// USDC Address
export const USDC_ADDRESS: (chain: string) => Address = (chain: string) => {
	switch (chain) {
		case 'celo':
			return usdcAddresses.celo
		case 'celoAlfajores':
			return usdcAddresses.celoAlfajores
		case 'celoSepolia':
			return usdcAddresses.celoSepolia
		default:
			throw new Error(`Unsupported chain: ${chain}`)
	}
}

// USDT Address
export const USDT_ADDRESS: (chain: string) => Address = (chain: string) => {
	switch (chain) {
		case 'celo':
			return usdtAddresses.celo
		case 'celoAlfajores':
			return usdtAddresses.celoAlfajores
		case 'celoSepolia':
			return usdtAddresses.celoSepolia
		default:
			throw new Error(`Unsupported chain: ${chain}`)
	}
}

// Admins and Users
export const SALVIEGA_ADDRESS: Address =
	'0xd7A4467a26d26d00cB6044CE09eBD69EDAC0564C'

export const LUCA_ADDRESS: Address =
	'0xAADd2E2a4904e69a2BC862F5b905d7dEdbF04f3b'

// NFT Collections
const MAINNET_NFT_COLLECTIONS: (network: string) => CollectionParams[] = (
	network: string
) => {
	return [
		{
			paymentToken: USDC_ADDRESS(network),
			name: 'INHABIT Ñuiyanzhi TITI',
			symbol: 'TITI',
			uri: 'ipfs://bafkreidij5vgh5kxt3q6wj2kcfijvctqkclpnkkx2rfzxz3ud44ddjqzki',
			supply: 2483n,
			price: 50_000_000n,
			state: true
		},
		{
			paymentToken: USDC_ADDRESS(network),
			name: 'INHABIT Ñuiyanzhi PAUJIL',
			symbol: 'PAUJIL',
			uri: 'ipfs://bafkreiclrauiief3ll6sip6jr4vbhsyh4m5iwfopayifjblpek7vudasr4',
			supply: 124n,
			price: 500_000_000n,
			state: true
		},
		{
			paymentToken: USDC_ADDRESS(network),
			name: 'INHABIT Ñuiyanzhi CARACOLI',
			symbol: 'CARACOLI',
			uri: 'ipfs://bafkreidrdymjzsmuaxz7it44cqfccivy74vxrxjn3mxm276lx5tuywchcy',
			supply: 19n,
			price: 2000_000_000n,
			state: true
		},
		{
			paymentToken: USDC_ADDRESS(network),
			name: 'INHABIT Ñuiyanzhi JAGUAR',
			symbol: 'JAGUAR',
			uri: 'ipfs://bafkreigja4pmvrxiwfba2llgwgv76yjbnkd7sizrcz7kb7qt7vpnzl27lu',
			supply: 5n,
			price: 5000_000_000n,
			state: true
		}
	]
}

const TESTNET_NFT_COLLECTIONS: (network: string) => CollectionParams[] = (
	network: string
) => {
	return [
		{
			paymentToken: USDC_ADDRESS(network),
			name: 'INHABIT Ñuiyanzhi TITI',
			symbol: 'TITI',
			uri: 'ipfs://bafkreidij5vgh5kxt3q6wj2kcfijvctqkclpnkkx2rfzxz3ud44ddjqzki',
			supply: 2483n,
			price: 1_000_000n,
			state: true
		},
		{
			paymentToken: USDC_ADDRESS(network),
			name: 'INHABIT Ñuiyanzhi PAUJIL',
			symbol: 'PAUJIL',
			uri: 'ipfs://bafkreiclrauiief3ll6sip6jr4vbhsyh4m5iwfopayifjblpek7vudasr4',
			supply: 124n,
			price: 2_000_000n,
			state: true
		},
		{
			paymentToken: USDC_ADDRESS(network),
			name: 'INHABIT Ñuiyanzhi CARACOLI',
			symbol: 'CARACOLI',
			uri: 'ipfs://bafkreidrdymjzsmuaxz7it44cqfccivy74vxrxjn3mxm276lx5tuywchcy',
			supply: 19n,
			price: 3_000_000n,
			state: true
		},
		{
			paymentToken: USDC_ADDRESS(network),
			name: 'INHABIT Ñuiyanzhi JAGUAR',
			symbol: 'JAGUAR',
			uri: 'ipfs://bafkreigja4pmvrxiwfba2llgwgv76yjbnkd7sizrcz7kb7qt7vpnzl27lu',
			supply: 5n,
			price: 4_000_000n,
			state: true
		}
	]
}

export const LOCAL_NFT_COLLECTIONS: (
	usdcAddress: Address
) => CollectionParams[] = (usdcAddress: Address) => {
	return [
		{
			paymentToken: usdcAddress,
			name: 'INHABIT Ñuiyanzhi TITI',
			symbol: 'TITI',
			uri: 'ipfs://bafkreidij5vgh5kxt3q6wj2kcfijvctqkclpnkkx2rfzxz3ud44ddjqzki',
			supply: 2483n,
			price: 1_000_000n,
			state: true
		},
		{
			paymentToken: usdcAddress,
			name: 'INHABIT Ñuiyanzhi PAUJIL',
			symbol: 'PAUJIL',
			uri: 'ipfs://bafkreiclrauiief3ll6sip6jr4vbhsyh4m5iwfopayifjblpek7vudasr4',
			supply: 124n,
			price: 2_000_000n,
			state: true
		},
		{
			paymentToken: usdcAddress,
			name: 'INHABIT Ñuiyanzhi CARACOLI',
			symbol: 'CARACOLI',
			uri: 'ipfs://bafkreidrdymjzsmuaxz7it44cqfccivy74vxrxjn3mxm276lx5tuywchcy',
			supply: 19n,
			price: 3_000_000n,
			state: true
		},
		{
			paymentToken: usdcAddress,
			name: 'INHABIT Ñuiyanzhi JAGUAR',
			symbol: 'JAGUAR',
			uri: 'ipfs://bafkreigja4pmvrxiwfba2llgwgv76yjbnkd7sizrcz7kb7qt7vpnzl27lu',
			supply: 5n,
			price: 4_000_000n,
			state: true
		}
	]
}

export const NFT_COLLECTIONS: (
	environment: string,
	network: string
) => CollectionParams[] = (environment: string, network: string) => {
	return environment === 'prod'
		? MAINNET_NFT_COLLECTIONS(network)
		: TESTNET_NFT_COLLECTIONS(network)
}
