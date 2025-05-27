import { viem } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { Address } from 'viem'

import { CELO_ALFAJORES_CUSD_ADDRESS } from '@/config/constants'

const setupContracts: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment
) {
	const { getNamedAccounts, deployments } = hre
	const { log } = deployments
	const { deployer } = await getNamedAccounts()

	const publicClient = await viem.getPublicClient()

	const { address: oracleAddress } = await deployments.get('OracleV2')
	const { address: vendorV2Address } = await deployments.get('VendorV2')

	const vendorV2 = await viem.getContractAt(
		'VendorV2',
		vendorV2Address as Address
	)

	log('----------------------------------------------------')
	log('Setting up contracts for roles...')

	const gasOption = {
		account: deployer as Address,
		gasLimit: 3000000
	}

	const txAddUser = await vendorV2.write.addUser(
		[deployer as Address],
		gasOption
	)

	await publicClient.waitForTransactionReceipt({
		hash: txAddUser
	})

	log('Adding tokens to VendorV2...')

	const txAddToken = await vendorV2.write.addToken(
		[CELO_ALFAJORES_CUSD_ADDRESS, oracleAddress as Address, 8n, true, false],
		gasOption
	)

	await publicClient.waitForTransactionReceipt({
		hash: txAddToken
	})

	log(`cUSD token added. tx hash: ${txAddToken}`)
}

export default setupContracts
setupContracts.tags = ['celoAlfajores', 'setup']

/*
	contracts:
		- MockOracle: the tests will use this mock oracle to get the price of CELO -> USD and cUSD -> USD
	
	setup.js
	line: 47: 
		- Look before to deploy....
		· Will you deploy two oracles? CELO -> USD and cUSD -> USD
		· cUSD address is the same to _addr and _orc parameters.
		- MockOracleV2: the tests will use this vendor to buy and sell cUSD

	js-test folder:
		- Distribution.test.js: test are failing
		- VendorV2.test.js: test are failing

	test folder:
		- It may test the oracle contract

	contracts:
		- Contract AAdministered {
		
		renounceAdmin()
			-	Validations: Someone can renounce admin role, etc...
	}

*/
