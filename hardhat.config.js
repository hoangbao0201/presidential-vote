require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: process.env.API_URL,
      gas: 5000000, // Giới hạn gas
      gasPrice: 50000000, // Giá gas (50 Gwei)
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
