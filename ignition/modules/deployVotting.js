// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const DeployModule = buildModule("Module", (m) => {
    const votting = m.contract("Votes");
    return {votting};
});

module.exports = DeployModule;