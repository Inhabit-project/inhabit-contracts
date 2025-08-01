import { ContractFactory } from 'ethers'
import { ethers, upgrades } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import {
	DeployFunction,
	Deployment,
	ExtendedArtifact
} from 'hardhat-deploy/dist/types'

import { developmentChains } from '@/config/const'
import { getImplementationAddress } from '@/utils/upgrades/get-implementation-address'
import { verify } from '@/utils/verify'

const upgradeInhabit: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment
) {
	const { deployments, network } = hre
	const { log, get, save } = deployments

	const inhabitDeployment: Deployment = await get('Inhabit')
	const proxyAddress: string = inhabitDeployment.address

	log('-----------------------------------')
	log('Upgrading Inhabit...')

	const Inhabit: ContractFactory = await ethers.getContractFactory('Inhabit')

	const upgradedProxy = await upgrades.upgradeProxy(proxyAddress, Inhabit)

	await upgradedProxy.getAddress()

	const implementationAddress: string =
		await getImplementationAddress(proxyAddress)

	log(`New Inhabit implementation deployed at: ${implementationAddress}`)

	if (!developmentChains.includes(network.name)) {
		await verify(implementationAddress, [])
	}

	const artifact: ExtendedArtifact =
		await deployments.getExtendedArtifact('Inhabit')
	await save('Inhabit', { address: proxyAddress, ...artifact })

	log('-----------------------------------')
	log(`Inhabit upgraded successfully!`)
	log(`Proxy address: ${proxyAddress}`)
	log(`New implementation: ${implementationAddress}`)
}

upgradeInhabit.tags = ['upgrade']

export default upgradeInhabit
