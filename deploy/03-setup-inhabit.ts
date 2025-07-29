import { viem } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { Address } from 'viem'

import {
	LUCA_ADDRESS,
	SALVIEGA_ADDRESS,
	USDC_ADDRESS,
	USDT_ADDRESS
} from '@/config/const'

const setupContracts: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment
) {
	const { getNamedAccounts, deployments, network } = hre
	const { log } = deployments
	const { deployer } = await getNamedAccounts()

	const publicClient = await viem.getPublicClient()

	const { address: inhabitAddress } = await deployments.get('Inhabit')

	const inhabit = await viem.getContractAt('Inhabit', inhabitAddress as Address)

	const gasOption = {
		account: deployer as Address
	}

	log('----------------------------------------------------')
	log('Addding tokens...')

	// Add USDC token
	const tx2AddToken = await inhabit.write.addToToken(
		[USDC_ADDRESS(network.name)],
		{
			account: deployer,
			gasOption
		}
	)

	await publicClient.waitForTransactionReceipt({
		hash: tx2AddToken
	})

	log(`USDC token added. tx hash: ${tx2AddToken}`)

	// Add USDT token
	const addToTokensTx2 = await inhabit.write.addToToken(
		[USDT_ADDRESS(network.name)],
		{
			account: deployer,
			gasOption
		}
	)

	await publicClient.waitForTransactionReceipt({
		hash: addToTokensTx2
	})

	log(`USDT token added. tx hash: ${addToTokensTx2}`)

	log('----------------------------------------------------')
	log('Setting up contracts for roles...')

	const adminRole = await inhabit.read.ADMIN_ROLE()
	console.log(`Admin role: ${adminRole}`)

	const userRole = await inhabit.read.USER_ROLE()
	console.log(`User role: ${userRole}`)

	// Add salviega.eth
	const grantRoleAdminTx = await inhabit.write.grantRole(
		[adminRole, SALVIEGA_ADDRESS],
		gasOption
	)

	await publicClient.waitForTransactionReceipt({
		hash: grantRoleAdminTx
	})

	log(`salviega.eth added as admin. tx hash: ${grantRoleAdminTx}`)

	const grantRoleUserTx = await inhabit.write.grantRole(
		[userRole, SALVIEGA_ADDRESS],
		gasOption
	)

	await publicClient.waitForTransactionReceipt({
		hash: grantRoleUserTx
	})

	log(`salviega.eth added as user. tx hash: ${grantRoleUserTx}`)

	// Add Luca wallet
	const grantRoleAdminTx2 = await inhabit.write.grantRole(
		[adminRole, LUCA_ADDRESS],
		gasOption
	)

	await publicClient.waitForTransactionReceipt({
		hash: grantRoleAdminTx2
	})

	log(`Luca wallet added as admin. tx hash: ${grantRoleAdminTx2}`)

	const grantRoleUserTx2 = await inhabit.write.grantRole(
		[userRole, LUCA_ADDRESS],
		gasOption
	)

	await publicClient.waitForTransactionReceipt({
		hash: grantRoleUserTx2
	})

	log(`Luca wallet added as user. tx hash: ${grantRoleUserTx2}`)
}

export default setupContracts
setupContracts.tags = ['deploy', 'setup']
