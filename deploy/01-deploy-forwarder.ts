import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

import { developmentChains } from '@/config/const'
import { delay } from '@/utils/delay'
import {
	getImplementationAddress,
	getProxyAdmin
} from '@/utils/upgrades/get-implementation-address'
import { saveUpgradeableContractDeploymentInfo } from '@/utils/upgrades/save-upgradable-contract-deployment-info'
import { verify } from '@/utils/verify'

const deployForwarder: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment
) {
	const { ethers, upgrades } = hre
	const { getNamedAccounts, deployments, network } = hre
	const { log, save } = deployments
	const { deployer } = await getNamedAccounts()

	log('----------------------------------------------------')
	log('Deploying Forwarder and waiting for confirmations...')

	const name = 'Inhabit Forwarder V1'
	const defaultAdmin = deployer

	const args = [name, defaultAdmin]

	const Forwarder = await ethers.getContractFactory('Forwarder')

	const proxy = await upgrades.deployProxy(Forwarder, args, {
		initializer: 'initialize(string,address)'
	})
	await proxy.waitForDeployment()

	const proxyTransaction = proxy.deploymentTransaction()

	if (!proxyTransaction) {
		throw new Error('Failed to get deployment transaction for proxy')
	}

	log(`Forwarder transaction hash: ${proxyTransaction.hash}`)

	await delay(2000)

	const proxyAddress: string = await proxy.getAddress()
	log(`Forwarder proxy deployed at: ${proxyAddress}`)

	const implementationAddress: string =
		await getImplementationAddress(proxyAddress)
	log(`Forwarder implementation deployed at: ${implementationAddress}`)

	const proxyAdmin: string = await getProxyAdmin(proxyAddress)
	log(`Forwarder proxy admin: ${proxyAdmin}`)

	if (!developmentChains.includes(network.name)) {
		await verify(proxyAddress, [])
	}

	const artifact = await deployments.getExtendedArtifact('Forwarder')
	await save('Forwarder', { address: proxyAddress, ...artifact })

	await saveUpgradeableContractDeploymentInfo(
		'Forwarder',
		proxy as unknown as import('ethers').Contract
	)
}

export default deployForwarder
deployForwarder.tags = ['deploy', 'forwarder']
