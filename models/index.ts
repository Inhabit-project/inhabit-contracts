export interface NetworkConfigInfo {
	[chainId: string]: {
		blockConfirmations?: number
	}
}

export interface TokenStruct {
	addr: string
	oracle: string
	orDecimals: bigint
	active: boolean
	isNative: boolean
}
