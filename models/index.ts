import { Address } from 'viem'

export interface NetworkConfigInfo {
	[chainId: string]: {
		blockConfirmations?: number
	}
}

export interface CollectionStruct {
	addr: Address
	price: bigint
	active: boolean
}

export interface Shared {
	addr: Address
	pcng: bigint
}

export interface GroupStruct {
	group: string
	state: boolean
	arrayShared: Shared[]
}

export interface TokenStruct {
	addr: Address
	oracle: Address
	orDecimals: bigint
	active: boolean
	isNative: boolean
}
