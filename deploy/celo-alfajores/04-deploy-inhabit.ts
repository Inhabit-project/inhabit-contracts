import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

import { developmentChains, networkConfig } from '@/config/constants'
import { verify } from '@/utils/verify'

const deployInhabit: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment
) {
	const { getNamedAccounts, deployments, network } = hre
	const { deploy, log } = deployments
	const { deployer } = await getNamedAccounts()

	const { address: vendorV2Address } = await deployments.get('VendorV2')

	log('----------------------------------------------------')
	log('Deploying Inhabit and waiting for confirmations...')

	const name: string = 'Inhabit'
	const symbol: string = 'INHABIT'
	const maxSupply: bigint = 100n
	const baseTokenURI: string = 'https://api.inhabit.com/metadata'
	const scVendorAddress: string = vendorV2Address

	const args = [name, symbol, maxSupply, baseTokenURI, scVendorAddress]

	const inhabit = await deploy('Inhabit', {
		from: deployer,
		args,
		log: true,
		waitConfirmations: networkConfig[network.name].blockConfirmations || 1
	})

	log(`VendorV2 contract at ${inhabit.address}`)

	if (!developmentChains.includes(network.name)) {
		await verify(inhabit.address, args)
	}
}

export default deployInhabit
deployInhabit.tags = ['celoAlfajores', 'inhabit']
