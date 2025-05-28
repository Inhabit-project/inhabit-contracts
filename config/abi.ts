import Inhabit from '@/artifacts/contracts/Inhabit.sol/Inhabit.json'
import MockErc20 from '@/artifacts/contracts/Mocks/MockErc20.sol/MockErc20.json'
import MockOracleV2 from '@/artifacts/contracts/Mocks/MockOracleV2.sol/MockOracleV2.json'
import VendorV2 from '@/artifacts/contracts/VendorV2.sol/VendorV2.json'

export const ABIS = {
	MockErc20: MockErc20.abi,
	MockOracleV2: MockOracleV2.abi,
	Inhabit: Inhabit.abi,
	VendorV2: VendorV2.abi
}
