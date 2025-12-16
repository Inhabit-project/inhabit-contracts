import { viem } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { Address } from 'viem'

const setupContracts: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment
) {
	const { getNamedAccounts, deployments } = hre
	const { log } = deployments
	const { deployer } = await getNamedAccounts()

	const publicClient = await viem.getPublicClient()

	const { address: forwarderAddress } = await deployments.get('Forwarder')

	const forwarder = await viem.getContractAt(
		'Forwarder',
		forwarderAddress as Address
	)

	log('----------------------------------------------------')
	log('Adding relayer...')

	// Add relayer
	const txAddRelayer = await forwarder.write.addRelayer([deployer as Address])

	await publicClient.waitForTransactionReceipt({
		hash: txAddRelayer
	})

	log(`Relayer added. tx hash: ${txAddRelayer}`)
}

export default setupContracts
setupContracts.tags = ['deploy', 'forwarder-setup']
