import '@nomicfoundation/hardhat-toolbox-viem'
import 'hardhat-deploy'
import 'tsconfig-paths/register'

import { HardhatUserConfig } from 'hardhat/types'

// const PRIVATE_KEY = process.env.PRIVATE_KEY
// const CELO_RPC_URL = process.env.CELO_RPC_URL
// const ALFAJORES_RPC_URL = process.env.ALFAJORES_RPC_URL
// const CELOSCAN_API_KEY = process.env.CELOSCAN_API_KEY
// const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

const config: HardhatUserConfig = {
	defaultNetwork: 'hardhat',
	networks: {
		hardhat: {
			allowUnlimitedContractSize: true,
			chainId: 1337
		},
		localhost: {
			allowUnlimitedContractSize: true,
			chainId: 1337,
			url: 'http://127.0.0.1:8545'
		}

		// celo: {
		// 	url: CELO_RPC_URL || 'https://forno.celo.org',
		// 	accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
		// 	chainId: 42220,
		// 	gasPrice: 50000000000
		// },
		// alfajores: {
		// 	url: ALFAJORES_RPC_URL || 'https://alfajores-forno.celo-testnet.org',
		// 	accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
		// 	chainId: 44787,
		// 	gasPrice: 1000000000
		// },
	},

	namedAccounts: {
		deployer: {
			default: 0
		},
		luca: {
			default: 1
		},
		juan: {
			default: 2
		},
		santiago: {
			default: 3
		}
	},

	solidity: {
		version: '0.8.9',
		settings: {
			optimizer: {
				enabled: true,
				runs: 1000
			}
			// details: {
			// 	yul: true,
			// 	yulDetails: {
			// 		stackAllocation: true,
			// 		optimizerSteps: 'dhfoDgvulfnTUtnIf'
			// 	}
			// }
		}
	},

	// etherscan: {
	// 	apiKey: {
	// 		celo: CELOSCAN_API_KEY || '',
	// 		alfajores: CELOSCAN_API_KEY || ''
	// 	},
	// 	customChains: [
	// 		{
	// 			network: 'celo',
	// 			chainId: 42220,
	// 			urls: {
	// 				apiURL: 'https://api.celoscan.io/api',
	// 				browserURL: 'https://celoscan.io'
	// 			}
	// 		},
	// 		{
	// 			network: 'alfajores',
	// 			chainId: 44787,
	// 			urls: {
	// 				apiURL: 'https://api-alfajores.celoscan.io/api',
	// 				browserURL: 'https://alfajores.celoscan.io'
	// 			}
	// 		}
	// 	]
	// },

	// gasReporter: {
	// 	enabled: process.env.REPORT_GAS !== undefined,
	// 	currency: 'USD',
	// 	coinmarketcap: COINMARKETCAP_API_KEY,
	// 	token: 'CELO',
	// 	gasPrice: 100
	// },

	mocha: {
		timeout: 200000
	}
}

export default config
