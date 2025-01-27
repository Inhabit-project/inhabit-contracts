// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// npx hardhat run scripts/verify.js --network mumbai
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  // verify
  await hre.run("verify:verify", {
    address: "0xC9E13F4976be99A262A9cC3c55ABE1842F206201",
    constructorArguments: [],
    contract: "contracts/VendorV2.sol:VendorV2"
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  // eslint-disable-next-line no-process-exit
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });
