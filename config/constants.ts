import { Address } from 'viem'

import { NetworkConfigInfo } from '@/models'

export const developmentChains = ['hardhat', 'localhost']

export const networkConfig: NetworkConfigInfo = {
	localhost: {},
	hardhat: {}
}

export const NATIVE = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

export const TEST_TOKEN_ONE: Address =
	'0xd243438f6d14E2097e96D81e56E08C7D847a67A6'

export const TEST_TOKEN_TWO: Address =
	'0x7Db67b92794e2569DAB6A2E38D877900F8883350'
