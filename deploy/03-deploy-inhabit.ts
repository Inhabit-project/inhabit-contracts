import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

import { developmentChains, TREASURY_ADDRESS } from '@/config/const'
import { delay } from '@/utils/delay'
import {
	getImplementationAddress,
	getProxyAdmin
} from '@/utils/upgrades/get-implementation-address'
import { saveUpgradeableContractDeploymentInfo } from '@/utils/upgrades/save-upgradable-contract-deployment-info'
import { verify } from '@/utils/verify'

const deployInhabit: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment
) {
	const { ethers, upgrades } = hre
	const { getNamedAccounts, deployments, network } = hre
	const { log, save } = deployments
	const { deployer } = await getNamedAccounts()

	log('----------------------------------------------------')
	log('Deploying Inhabit and waiting for confirmations...')

	const { address: NFTCollectionAddress } =
		await deployments.get('NFTCollection')

	const defaultAdmin = deployer
	const treasury = TREASURY_ADDRESS(network.name)

	const args = [defaultAdmin, NFTCollectionAddress, treasury]

	const Inhabit = await ethers.getContractFactory('Inhabit')

	const proxy = await upgrades.deployProxy(Inhabit, args)
	await proxy.waitForDeployment()

	const proxyTransaction = proxy.deploymentTransaction()

	if (!proxyTransaction) {
		throw new Error('Failed to get deployment transaction for proxy')
	}

	log(`Inhabit transaction hash: ${proxyTransaction.hash}`)

	await proxyTransaction.wait()

	const proxyAddress: string = await proxy.getAddress()
	log(`Inhabit proxy deployed at: ${proxyAddress}`)

	await delay(3000)

	const implementationAddress: string =
		await getImplementationAddress(proxyAddress)
	log(`Inhabit implementation deployed at: ${implementationAddress}`)

	const proxyAdmin: string = await getProxyAdmin(proxyAddress)
	log(`Inhabit proxy admin: ${proxyAdmin}`)

	if (!developmentChains.includes(network.name)) {
		await verify(proxyAddress, [])
	}

	const artifact = await deployments.getExtendedArtifact('Inhabit')
	await save('Inhabit', { address: proxyAddress, ...artifact })

	await saveUpgradeableContractDeploymentInfo(
		'Inhabit',
		proxy as unknown as import('ethers').Contract
	)
}

export default deployInhabit
deployInhabit.tags = ['deploy', 'Inhabit']
