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

export interface AmbassadorStruct {
	account: Address
	fee: bigint
}

export interface GroupStruct {
	referral: string
	state: boolean
	ambassadors: AmbassadorStruct[]
}

export interface TokenStruct {
	addr: Address
	oracle: Address
	orDecimals: bigint
	active: boolean
	isNative: boolean
}
