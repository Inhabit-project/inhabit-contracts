import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

import {
	developmentChains,
	networkConfig,
	NFT_COLLECTIONS
} from '@/config/constants'
import { verify } from '@/utils/verify'

const deployInhabit: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment
) {
	const { getNamedAccounts, deployments, network } = hre
	const { deploy, log } = deployments
	const { deployer } = await getNamedAccounts()

	const { address: vendorV2Address } = await deployments.get('VendorV2')

	log('----------------------------------------------------')
	log('Deploying Inhabit collections and waiting for confirmations...')

	const titiArgs = [
		'INHABIT Ñuiyanzhi TITI',
		'TITI',
		2483n,
		NFT_COLLECTIONS.titi,
		vendorV2Address
	]

	const paujilArgs = [
		'INHABIT Ñuiyanzhi PAUJIL',
		'PAUJIL',
		124n,
		NFT_COLLECTIONS.paujil,
		vendorV2Address
	]

	const caracoliArgs = [
		'INHABIT Ñuiyanzhi CARACOLI',
		'CARACOLI',
		19n,
		NFT_COLLECTIONS.caracoli,
		vendorV2Address
	]

	const jaguarArgs = [
		'INHABIT Ñuiyanzhi JAGUAR',
		'JAGUAR',
		5n,
		NFT_COLLECTIONS.jaguar,
		vendorV2Address
	]

	const caracoliCollection = await deploy('Inhabit_CARACOLI', {
		contract: 'Inhabit',
		from: deployer,
		args: caracoliArgs,
		log: true,
		waitConfirmations: networkConfig[network.name].blockConfirmations || 1
	})

	log(`Caracoli collection deployed at ${caracoliCollection.address}`)

	if (!developmentChains.includes(network.name)) {
		await verify(caracoliCollection.address, caracoliArgs)
	}

	const jaguarCollection = await deploy('Inhabit_JAGUAR', {
		contract: 'Inhabit',
		from: deployer,
		args: jaguarArgs,
		log: true,
		waitConfirmations: networkConfig[network.name].blockConfirmations || 1
	})

	log(`Jaguar collection deployed at ${jaguarCollection.address}`)

	if (!developmentChains.includes(network.name)) {
		await verify(jaguarCollection.address, jaguarArgs)
	}

	const paujilCollection = await deploy('Inhabit_PAUJIL', {
		contract: 'Inhabit',
		from: deployer,
		args: paujilArgs,
		log: true,
		waitConfirmations: networkConfig[network.name].blockConfirmations || 1
	})

	log(`Paujil collection deployed at ${paujilCollection.address}`)

	if (!developmentChains.includes(network.name)) {
		await verify(paujilCollection.address, paujilArgs)
	}

	const titiCollection = await deploy('Inhabit_TITI', {
		contract: 'Inhabit',
		from: deployer,
		args: titiArgs,
		log: true,
		waitConfirmations: networkConfig[network.name].blockConfirmations || 1
	})
	log(`Titi collection deployed at ${titiCollection.address}`)

	if (!developmentChains.includes(network.name)) {
		await verify(titiCollection.address, titiArgs)
	}
}

export default deployInhabit
deployInhabit.tags = ['celoAlfajores', 'inhabitCollections']
