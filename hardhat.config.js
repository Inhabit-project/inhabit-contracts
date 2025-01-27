require("dotenv").config();
const { task, subtask, types } = require("hardhat/config");

require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-contract-sizer");
require("./tasks/tasks.js");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "celo",
  networks: {
    hardhat: {
      inject: false, // optional. if true it will expose your mnemonic in front end. it would be available as an in page browser wallet/signer which can sign without confirmation.
    },
    celo: {
      url: process.env.CELO_MAINNET_URL,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 'auto',
      gas: 'auto',
    },
    celoTestnet: {
      url: process.env.CELO_TEST_URL,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: "auto", // 200000000000
      gas: "auto",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  etherscan: {
    apiKey: {
      celo: process.env.ETHERSCAN_API_KEY_CELO,
      celoTestnet: process.env.ETHERSCAN_API_KEY_CELO,
    },
    customChains: [
      {
        network: "celoTestnet",
        chainId: 44787,
        urls: {
          apiURL: "https://api-alfajores.celoscan.io/api",
          browserURL: "https://alfajores.celoscan.io"
        }
      },
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io"
        }
      }
    ]
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
};
