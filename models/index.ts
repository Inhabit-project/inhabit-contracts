export interface NetworkConfigInfo {
	[chainId: string]: {
		blockConfirmations?: number
	}
}

export interface Shared {
	addr: string
	pcng: bigint
}

export interface GroupStruct {
	group: string
	state: boolean
	arrayShared: Shared[]
}

export interface TokenStruct {
	addr: string
	oracle: string
	orDecimals: bigint
	active: boolean
	isNative: boolean
}
