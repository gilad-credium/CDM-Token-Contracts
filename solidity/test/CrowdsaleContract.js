const CrowdsaleContract = artifacts.require('CrowdsaleContract.sol');
const CrediumToken = artifacts.require("CrediumToken.sol")
const util = require("./util/TestUtils.js");

function verifyException(stacktrace) {
    return stacktrace.includes('VM Exception') || stacktrace.includes('invalid opcode') || stacktrace.includes('invalid JUMP');
}

contract("CrowdsaleContract", (accounts) => {

    const CROWDSALE_DURATION = util.addDays(14); // in days
    const MAX_GAS_PRICE = 0.00000005; // in ETH
    var token;
    
    beforeEach(async () => {
        token = await CrediumToken.new("CrediumTestToken", "CTT", 18);
    });

    describe("construction", async () => {
        
        it("should throw if a _crowdsaleStartTime is less than block.timestamp", async () => {
            try {
                let crowdsaleStartTime = await web3.eth.getBlock(web3.eth.blockNumber).timestamp;
                let crowdsaleContract = await CrowdsaleContract.new(token.address, crowdsaleStartTime, accounts[0]);
                assert(false, "no error. something went wrong");
            } catch(error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw if a _token is an invalid address", async () => {
            try {
                let crowdsaleStartTime = await web3.eth.getBlock(web3.eth.blockNumber).timestamp + await util.addDays(14);
                let crowdsaleContract = await CrowdsaleContract.new("0x0", crowdsaleStartTime, accounts[0]);
                assert(false, "no error. something went wrong");
            } catch(error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw if a _beneficiary is an invalid address", async () => {
            try {
                let crowdsaleStartTime = await web3.eth.getBlock(web3.eth.blockNumber).timestamp + await util.addDays(14);
                let crowdsaleContract = await CrowdsaleContract.new(token.address, crowdsaleStartTime, "0x0");
                assert(false, "no error. something went wrong");
            } catch(error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw if a _token is't a contract", async () => {
            try {
                let walletAddress = accounts[8];
                let crowdsaleStartTime = await web3.eth.getBlock(web3.eth.blockNumber).timestamp + await util.addDays(14);
                let crowdsaleContract = await CrowdsaleContract.new(walletAddress, crowdsaleStartTime, accounts[0]);
                assert(false, "no error. something went wrong");
            } catch(error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("verifies contract parameters after construction", async () => {
            let beneficiary = accounts[0];
            let crowdsaleStartTime = await web3.eth.getBlock(web3.eth.blockNumber).timestamp + await util.addDays(14);
            let crowdsaleContract = await CrowdsaleContract.new(token.address, crowdsaleStartTime, beneficiary);
            assert.equal(await crowdsaleContract.crowdsaleStartTime.call(), crowdsaleStartTime);
            assert.equal(await crowdsaleContract.crowdsaleEndTime.call(), crowdsaleStartTime + CROWDSALE_DURATION);
            assert.equal(await crowdsaleContract.beneficiary.call(), beneficiary);
            assert.equal(await crowdsaleContract.token.call(), token.address);
        });

    });

    describe("receiveETH", async () => {

        var crowdsaleContract;
        let beneficiary = accounts[0];
        var now;

        beforeEach(async () => {
            now = await web3.eth.getBlock(web3.eth.blockNumber).timestamp;
            let crowdsaleStartTime = now + util.addDays(1);
            crowdsaleContract = await CrowdsaleContract.new(token.address, crowdsaleStartTime, beneficiary);
            await token.transferOwnership(crowdsaleContract.address);
            await crowdsaleContract.acceptTokenOwnership();
        });
    
        it("should throw if tx.gasprice if higher than MAX_GAS_PRICE", async () => {
            try {
                await util.increaseEvmTime(3);
                await receiveETH(crowdsaleContract, accounts[1], 10, 0.00000006);
                assert(false, "no error. something went wrong");
            } catch(error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw if block.timestamp is less than crowdsaleStartTime", async () => {
            try {
                assert.isBelow(now, await crowdsaleContract.crowdsaleStartTime.call());
                await receiveETH(crowdsaleContract, accounts[1], 10, 0.00000005);
                assert(false, "no error. something went wrong");
            } catch(error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw if block.timestamp is higher than crowdsaleEndTime", async () => {
            try {
                await util.increaseEvmTime(16);
                let currentTime = await web3.eth.getBlock(web3.eth.blockNumber).timestamp;
                assert.isAbove(currentTime, await crowdsaleContract.crowdsaleEndTime.call());
                await receiveETH(crowdsaleContract, accounts[1], 10, 0.00000005);
                assert(false, "no error. something went wrong");
            } catch(error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("verifies beneficiary ETH amount after a contribution", async () => {
            let beneficiary = accounts[0];
            await util.increaseEvmTime(3);
            let balanceBeforeContribution = await web3.eth.getBalance(accounts[0]);
            await receiveETH(crowdsaleContract, accounts[1], 10, 0.00000005);
            let balanceAfterContribution = await web3.eth.getBalance(accounts[0]);

            assert.deepEqual(balanceBeforeContribution.add(web3.toWei(10)), balanceAfterContribution);
        });

        it("verifies totalEtherContributed after a contribution", async () => {
            let beneficiary = accounts[0];
            await util.increaseEvmTime(3);
            let balanceBeforeContribution = await web3.eth.getBalance(accounts[0]);
            await receiveETH(crowdsaleContract, accounts[1], 10, 0.00000005);

            assert.equal(web3.toWei(10), await crowdsaleContract.totalEtherContributed.call());
        });

        it("verifies totalEtherContributed after a contribution", async () => {
            let beneficiary = accounts[0];
            await util.increaseEvmTime(3);
            let balanceBeforeContribution = await web3.eth.getBalance(accounts[0]);
            await receiveETH(crowdsaleContract, accounts[1], 10, 0.00000005);

            assert.equal(web3.toWei(10), await crowdsaleContract.totalEtherContributed.call());
        });

    });

    describe("calculateOutcome", async () => {
    
        it("verifies outcome in tokens", async () => {
            let beneficiary = accounts[0];
            let crowdsaleStartTime = await web3.eth.getBlock(web3.eth.blockNumber).timestamp + await util.addDays(14);
            let crowdsaleContract = await CrowdsaleContract.new(token.address, crowdsaleStartTime, beneficiary);
        
            assert.equal(await crowdsaleContract.calculateOutcome(10), 1000);
        });

    });

});

async function receiveETH(_crowdsaleContract, _from, _value, _gasPrice) {
    await _crowdsaleContract.receiveETH({
        gasPrice: web3.toWei(_gasPrice),
        value: web3.toWei(_value),
        from: _from
    });
}