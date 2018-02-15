/* global artifacts */
/* eslint-disable prefer-reflect */

const Utils = artifacts.require('Utils.sol');
const Owned = artifacts.require('Owned.sol');
const TokenHolder = artifacts.require('TokenHolder.sol');
const MultisigWalletAdapter = artifacts.require('MultisigWalletAdapter.sol');
const TokenLocker = artifacts.require('TokenLocker.sol');
const CrediumToken = artifacts.require('CrediumToken.sol');
const CrowdsaleContract = artifacts.require('CrowdsaleContract.sol');

module.exports = async (deployer) => {
    deployer.deploy(Utils);
    deployer.deploy(Owned);
    deployer.deploy(TokenHolder);
    await deployer.deploy(MultisigWalletAdapter, "0x123");
    deployer.deploy(TokenLocker, MultisigWalletAdapter.address);
    await deployer.deploy(CrediumToken, 'Credium', 'CDM', 18);
    deployer.deploy(CrowdsaleContract, CrediumToken.address, 1518712456, "0x123")
};
