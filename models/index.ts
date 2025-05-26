export interface NetworkConfigInfo {
	[chainId: string]: {
		blockConfirmations?: number
	}
}

export const NATIVE = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
