import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { parseEther } from 'viem'

import { developmentChains, networkConfig } from '@/config/constants'
import { verify } from '@/utils/verify'

const deployMockErc20: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment
) {
	const { getNamedAccounts, deployments, network } = hre
	const { deploy, log } = deployments
	const { deployer } = await getNamedAccounts()

	log('----------------------------------------------------')
	log('Deploying MockErc20 and waiting for confirmations...')

	// See: config gas options. Is it necessary to set gas options here?

	const name: string = 'CELO Dollar'
	const symbol: string = 'cUSD'
	const initialSupply: bigint = parseEther('100') // 100 cUSD

	const args = [name, symbol, initialSupply]

	const mockErc20 = await deploy('MockErc20', {
		from: deployer,
		args,
		log: true,
		waitConfirmations: networkConfig[network.name].blockConfirmations || 1
	})

	log(`MockErc20 contract at ${mockErc20.address}`)

	if (!developmentChains.includes(network.name)) {
		await verify(mockErc20.address, [])
	}
}

export default deployMockErc20
deployMockErc20.tags = ['localhost', 'mock-erc20']
