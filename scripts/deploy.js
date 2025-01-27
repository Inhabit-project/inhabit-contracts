// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// bsc mainnnet = 0xC9E13F4976be99A262A9cC3c55ABE1842F206201
// bsc testnet = 0xEa42673e7D4a0cDCE9577820aa3890c892a8Ec37
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  await hre.run("compile");


  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy
  const factory = await hre.ethers.getContractFactory("VendorV2");
  const contract = await factory.deploy();

  // The address of the contract once mined
  console.log("Contract address:", contract.address);

  // Transaction that was sent to the network
  console.log(contract.deployTransaction.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
