import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

import { developmentChains, networkConfig } from '@/config/constants'
import verify from '@/utils'

const deployMockOracleV2: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment
) {
	const { getNamedAccounts, deployments, network } = hre
	const { deploy, log } = deployments
	const { deployer } = await getNamedAccounts()

	log('----------------------------------------------------')
	log('Deploying MockOracleV2 and waiting for confirmations...')

	// See: config gas options. Is it necessary to set gas options here?

	const mockOracleV2 = await deploy('MockOracleV2', {
		from: deployer,
		args: [],
		log: true,
		waitConfirmations: networkConfig[network.name].blockConfirmations || 1
	})

	log(`MockOracleV2 contract at ${mockOracleV2.address}`)

	if (!developmentChains.includes(network.name)) {
		await verify(mockOracleV2.address, [])
	}
}

export default deployMockOracleV2
deployMockOracleV2.tags = ['localhost', 'mock-oracle-v2']
