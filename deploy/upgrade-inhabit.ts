import { ContractFactory } from 'ethers'
import { ethers, upgrades } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import {
	DeployFunction,
	Deployment,
	ExtendedArtifact
} from 'hardhat-deploy/dist/types'
import { Address } from 'viem'

import { developmentChains } from '@/config/const'
import { getImplementationAddress } from '@/utils/upgrades/get-implementation-address'
import { verify } from '@/utils/verify'
import { wait } from '@/utils/wait'

const upgradeInhabit: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment
) {
	const { deployments, network } = hre
	const { log, get, save } = deployments

	const inhabitDeployment: Deployment = await get('Inhabit')
	const proxyAddress: string = inhabitDeployment.address

	log('-----------------------------------')
	log('Upgrading Inhabit...')

	const inhabit: ContractFactory = await ethers.getContractFactory('Inhabit')

	try {
		await upgrades.forceImport(proxyAddress, inhabit, {
			kind: 'transparent'
		})
		log('Proxy imported successfully')
	} catch {
		log('Proxy already registered or import not needed')
	}

	log('-----------------------------------')
	log('Upgrading Inhabit...')

	const upgradedProxy = await upgrades.upgradeProxy(proxyAddress, inhabit, {
		redeployImplementation: 'always'
	})

	const upgradedProxyAddress = await upgradedProxy.getAddress()
	await wait(5)

	const newImplementationAddress = await getImplementationAddress(
		upgradedProxyAddress as Address
	)

	log(`New Inhabit implementation deployed at: ${newImplementationAddress}`)

	if (!developmentChains.includes(network.name)) {
		await verify(newImplementationAddress, [])
	}

	const artifact: ExtendedArtifact =
		await deployments.getExtendedArtifact('Inhabit')

	await save('Inhabit', {
		address: proxyAddress,
		implementation: newImplementationAddress,
		...artifact
	})

	log('-----------------------------------')
	log(`Inhabit upgraded successfully!`)
	log(`Proxy address: ${proxyAddress}`)
	log(`New implementation: ${newImplementationAddress}`)
}

upgradeInhabit.tags = ['upgrade']

export default upgradeInhabit
