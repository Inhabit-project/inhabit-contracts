import { viem } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { Address } from 'viem'

import { NATIVE } from '@/models'

const setupContracts: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment
) {
	const { getNamedAccounts, deployments } = hre
	const { log } = deployments
	const { deployer } = await getNamedAccounts()

	const { address: mockErc20Address } = await deployments.get('MockErc20')
	const { address: mockOracleAddress } = await deployments.get('MockOracleV2')
	const { address: vendorV2Address } = await deployments.get('VendorV2')

	const vendorV2 = await viem.getContractAt(
		'VendorV2',
		vendorV2Address as Address
	)

	log('----------------------------------------------------')
	log('Setting up contracts for roles...')

	// See: config gas options. Is it necessary to set gas options here?

	await vendorV2.write.addUser([deployer])

	log('Adding tokens to VendorV2...')

	const txAddToken = await vendorV2.write.addToken([
		NATIVE,
		mockOracleAddress,
		8,
		true,
		true
	])

	log(`NATIVE token added. tx hash: ${txAddToken}`)

	await vendorV2.write.addToken([
		mockErc20Address,
		mockOracleAddress,
		8,
		true,
		false
	])

	log(`MockErc20 token added. tx hash: ${txAddToken}`)
}

export default setupContracts
setupContracts.tags = ['all', 'setup']

/*
	contracts:
		- MockOracle: the tests will use this mock oracle to get the price of CELO -> USD and cUSD -> USD
	
	setup.js
	line: 47: 
		- Look before to deploy....
		· Will you deploy two oracles? CELO -> USD and cUSD -> USD
		· cUSD address is the same to _addr and _orc parameters.
		- MockOracleV2: the tests will use this vendor to buy and sell cUSD

*/
