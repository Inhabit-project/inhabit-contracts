import '@nomicfoundation/hardhat-toolbox-viem'
import 'hardhat-deploy'
import 'tsconfig-paths/register'

import dotenv from 'dotenv'
import { HardhatUserConfig } from 'hardhat/types'

import { ensureEnvVar } from './utils/ensure-env-var'

dotenv.config()

const CELO_RPC_URL = ensureEnvVar(process.env.CELO_RPC_URL, 'CELO_RPC_URL')

const CELO_ALFAJORES_RPC_URL = ensureEnvVar(
	process.env.CELO_ALFAJORES_RPC_URL,
	'CELO_ALFAJORES_RPC_URL'
)

const CELOSCAN_API_KEY = ensureEnvVar(
	process.env.CELOSCAN_API_KEY,
	'CELOSCAN_API_KEY'
)

const COINMARKETCAP_API_KEY = ensureEnvVar(
	process.env.COINMARKETCAP_API_KEY,
	'COINMARKETCAP_API_KEY'
)

const GAS_REPORT = process.env.REPORT_GAS === 'true' || false

const PRIVATE_KEY = ensureEnvVar(process.env.PRIVATE_KEY, 'PRIVATE_KEY')

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
		},

		celo: {
			url: CELO_RPC_URL || 'https://forno.celo.org',
			accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
			chainId: 42220
		},

		celoAlfajores: {
			url: CELO_ALFAJORES_RPC_URL || 'https://alfajores-forno.celo-testnet.org',
			accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
			chainId: 44787
		}
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
		version: '0.8.28',
		settings: {
			optimizer: {
				enabled: true,
				runs: 1000
			}
		}
	},

	etherscan: {
		apiKey: {
			celo: CELOSCAN_API_KEY || '',
			alfajores: CELOSCAN_API_KEY || ''
		},
		customChains: [
			{
				network: 'celo',
				chainId: 42220,
				urls: {
					apiURL: 'https://api.celoscan.io/api',
					browserURL: 'https://celoscan.io'
				}
			},
			{
				network: 'alfajores',
				chainId: 44787,
				urls: {
					apiURL: 'https://api-alfajores.celoscan.io/api',
					browserURL: 'https://alfajores.celoscan.io'
				}
			}
		]
	},

	gasReporter: {
		enabled: GAS_REPORT,
		coinmarketcap: COINMARKETCAP_API_KEY || '',
		currency: 'USD',
		currencyDisplayPrecision: 5,
		token: 'CELO',
		tokenPrice: '0.4',
		gasPrice: 0.5,
		offline: true,
		includeIntrinsicGas: true,
		reportFormat: 'terminal',
		darkMode: true,
		showMethodSig: true,
		outputFile: 'gas-report.txt'
	},

	mocha: {
		timeout: 200000
	}
}

export default config
