import { viem } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { Address } from 'viem'

import { CELO_ALFAJORES_CUSD_ADDRESS } from '@/config/constants'

const setupContracts: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment
) {
	const { getNamedAccounts, deployments } = hre
	const { log } = deployments
	const { deployer } = await getNamedAccounts()

	const publicClient = await viem.getPublicClient()

	const { address: oracleAddress } = await deployments.get('OracleV2')
	const { address: vendorV2Address } = await deployments.get('VendorV2')

	const vendorV2 = await viem.getContractAt(
		'VendorV2',
		vendorV2Address as Address
	)

	log('----------------------------------------------------')
	log('Setting up contracts for roles...')

	const gasOption = {
		account: deployer as Address,
		gasLimit: 3000000
	}

	const txAddUser = await vendorV2.write.addUser(
		[deployer as Address],
		gasOption
	)

	await publicClient.waitForTransactionReceipt({
		hash: txAddUser
	})

	log('Adding tokens to VendorV2...')

	// TODO: Uncomment this when the NATIVE token is available in the network

	// const txAddToken = await vendorV2.write.addToken(
	// 	[NATIVE, oracleAddress as Address, 8n, true, false],
	// 	gasOption
	// )

	// await publicClient.waitForTransactionReceipt({
	// 	hash: txAddToken
	// })

	// log(`NATIVE token added. tx hash: ${txAddToken}`)

	const tx2AddToken = await vendorV2.write.addToken(
		[CELO_ALFAJORES_CUSD_ADDRESS, oracleAddress as Address, 8n, true, false],
		gasOption
	)

	await publicClient.waitForTransactionReceipt({
		hash: tx2AddToken
	})

	log(`cUSD token added. tx hash: ${tx2AddToken}`)
}

export default setupContracts
setupContracts.tags = ['celoAlfajores', 'setup']
