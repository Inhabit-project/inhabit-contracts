import Safe, {
	getSafeAddressFromDeploymentTx,
	SafeAccountConfig,
	SafeTransactionOptionalProps
} from '@safe-global/protocol-kit'
import { MetaTransactionData } from '@safe-global/types-kit'
import { config } from 'dotenv'
import { ethers } from 'ethers'
import { writeFileSync } from 'fs'
import path from 'path'
import { TransactionReceipt } from 'viem'

import { ensureEnvVar } from '@/utils/ensure-env-var'

config()

export async function createSafeTransaction(
	rpcUrl: string,
	privateKey: string,
	safeAddress: string,
	transactions: MetaTransactionData[],
	options?: SafeTransactionOptionalProps
): Promise<void> {
	const provider = new ethers.JsonRpcProvider(rpcUrl)
	const signer = new ethers.Wallet(privateKey, provider)

	const protocolKit = await Safe.init({
		provider: rpcUrl,
		signer: signer.address,
		safeAddress
	})

	const safeTransaction = await protocolKit.createTransaction({
		transactions,
		options
	})

	console.log('Safe transaction created:', safeTransaction)
}

export async function createSafeMultisig(
	rpcUrl: string,
	privateKey: string
): Promise<Safe> {
	const provider = new ethers.JsonRpcProvider(rpcUrl)
	const signer = new ethers.Wallet(privateKey, provider)

	const owners = [...Array(3)].map(() => ethers.Wallet.createRandom())

	const signersJson = owners.map((w, i) => ({
		index: i,
		address: w.address,
		publicKey: w.publicKey,
		privateKey: w.privateKey
	}))

	const safeAccountConfig: SafeAccountConfig = {
		owners: signersJson.map(s => s.address),
		threshold: 2
	}

	const predictSafe = {
		safeAccountConfig,
		safeDeploymentConfig: {}
	}

	const protocolKit = await Safe.init({
		provider: RPC_URL,
		signer: privateKey,
		predictedSafe: predictSafe
	})

	const deployTx = await protocolKit.createSafeDeploymentTransaction()

	const txResponse = await signer.sendTransaction({
		to: deployTx.to,
		data: deployTx.data,
		value: deployTx.value
	})

	console.log('Tx hash:', txResponse.hash)

	const receipt = await txResponse.wait()

	if (!receipt) {
		throw new Error('Transaction receipt is null')
	}

	const safeAddress = getSafeAddressFromDeploymentTx(
		receipt as unknown as TransactionReceipt,
		protocolKit.getContractVersion()
	)

	protocolKit.connect({ safeAddress })

	writeFileSync(
		path.resolve(__dirname, '../safe-config.json'),
		JSON.stringify(
			{
				safeAddress,
				threshold: safeAccountConfig.threshold,
				signers: signersJson
			},
			null,
			2
		)
	)

	console.log('✅ safe-config.json created')

	return protocolKit
}

const RPC_URL = ensureEnvVar(
	process.env.CELO_ALFAJORES_RPC_URL,
	'CELO_ALFAJORES_RPC_URL'
)

const PRIVATE_KEY = ensureEnvVar(process.env.PRIVATE_KEY, 'PRIVATE_KEY')

createSafeMultisig(RPC_URL, PRIVATE_KEY).catch(error => {
	console.error('❌ Error:', error)
	process.exit(1)
})
