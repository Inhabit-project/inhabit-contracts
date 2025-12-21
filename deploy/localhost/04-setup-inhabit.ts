import { viem } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { Address } from 'viem'

import { delay } from '@/utils/delay'

const setupContracts: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment
) {
	const { getNamedAccounts, deployments } = hre
	const { log } = deployments
	const { deployer, luca, juan, santiago, ledger } = await getNamedAccounts()

	const publicClient = await viem.getPublicClient()

	const { address: inhabitAddress } = await deployments.get('Inhabit')
	const inhabit = await viem.getContractAt('Inhabit', inhabitAddress as Address)

	// Obtener MockErc20 desplegado (en lugar de direcciones reales)
	const { address: mockErc20Address } = await deployments.get('MockErc20')

	const gasOption = {
		account: deployer as Address
	}

	log('----------------------------------------------------')
	log('Adding tokens...')

	// Add MockErc20 token (en lugar de USDC real)
	const txAddToken = await inhabit.write.addToToken([mockErc20Address], {
		account: deployer,
		gasOption
	})

	await publicClient.waitForTransactionReceipt({
		hash: txAddToken
	})

	log(`MockErc20 token added. tx hash: ${txAddToken}`)

	log('----------------------------------------------------')
	log('Setting up usd token...')

	// Set MockErc20 as USD token
	const addUsdTokenTx = await inhabit.write.setUsdToken(
		[mockErc20Address],
		gasOption
	)

	await publicClient.waitForTransactionReceipt({
		hash: addUsdTokenTx
	})

	log(`MockErc20 set as USD token. tx hash: ${addUsdTokenTx}`)

	await delay(2000)

	log('----------------------------------------------------')
	log('Setting up contracts for roles...')

	const adminRole = await inhabit.read.ADMIN_ROLE()
	console.log(`Admin role: ${adminRole}`)

	const userRole = await inhabit.read.USER_ROLE()
	console.log(`User role: ${userRole}`)

	// Grant roles to named accounts (en lugar de direcciones hardcodeadas)
	// Deployer
	const grantRoleAdminTxDeployer = await inhabit.write.grantRole(
		[adminRole, deployer as Address],
		gasOption
	)

	await publicClient.waitForTransactionReceipt({
		hash: grantRoleAdminTxDeployer
	})

	log(`Deployer added as admin. tx hash: ${grantRoleAdminTxDeployer}`)

	const grantRoleUserTxDeployer = await inhabit.write.grantRole(
		[userRole, deployer as Address],
		gasOption
	)

	await publicClient.waitForTransactionReceipt({
		hash: grantRoleUserTxDeployer
	})

	log(`Deployer added as user. tx hash: ${grantRoleUserTxDeployer}`)

	// Luca
	const grantRoleAdminTxLuca = await inhabit.write.grantRole(
		[adminRole, luca as Address],
		gasOption
	)

	await publicClient.waitForTransactionReceipt({
		hash: grantRoleAdminTxLuca
	})

	log(`Luca added as admin. tx hash: ${grantRoleAdminTxLuca}`)

	const grantRoleUserTxLuca = await inhabit.write.grantRole(
		[userRole, luca as Address],
		gasOption
	)

	await publicClient.waitForTransactionReceipt({
		hash: grantRoleUserTxLuca
	})

	log(`Luca added as user. tx hash: ${grantRoleUserTxLuca}`)

	// Juan
	const grantRoleAdminTxJuan = await inhabit.write.grantRole(
		[adminRole, juan as Address],
		gasOption
	)

	await publicClient.waitForTransactionReceipt({
		hash: grantRoleAdminTxJuan
	})

	log(`Juan added as admin. tx hash: ${grantRoleAdminTxJuan}`)

	const grantRoleUserTxJuan = await inhabit.write.grantRole(
		[userRole, juan as Address],
		gasOption
	)

	await publicClient.waitForTransactionReceipt({
		hash: grantRoleUserTxJuan
	})

	log(`Juan added as user. tx hash: ${grantRoleUserTxJuan}`)

	// Santiago
	const grantRoleAdminTxSantiago = await inhabit.write.grantRole(
		[adminRole, santiago as Address],
		gasOption
	)

	await publicClient.waitForTransactionReceipt({
		hash: grantRoleAdminTxSantiago
	})

	log(`Santiago added as admin. tx hash: ${grantRoleAdminTxSantiago}`)

	const grantRoleUserTxSantiago = await inhabit.write.grantRole(
		[userRole, santiago as Address],
		gasOption
	)

	await publicClient.waitForTransactionReceipt({
		hash: grantRoleUserTxSantiago
	})

	log(`Santiago added as user. tx hash: ${grantRoleUserTxSantiago}`)
}

export default setupContracts
setupContracts.tags = ['localhost', 'l-inhabit-setup']
setupContracts.dependencies = ['Inhabit', 'MockErc20']
