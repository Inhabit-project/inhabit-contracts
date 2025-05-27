import { Address } from 'viem'

import { NetworkConfigInfo } from '@/models'

export const developmentChains = ['hardhat', 'localhost']

export const networkConfig: NetworkConfigInfo = {
	localhost: {},
	hardhat: {},
	celo: {
		blockConfirmations: 3
	},
	celoAlfajores: {
		blockConfirmations: 1
	}
}

export const CELO_ALFAJORES_CUSD_ADDRESS: Address =
	'0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'

export const NATIVE = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

export const TEST_TOKEN_ONE: Address =
	'0xd243438f6d14E2097e96D81e56E08C7D847a67A6'

export const TEST_TOKEN_TWO: Address =
	'0x7Db67b92794e2569DAB6A2E38D877900F8883350'
