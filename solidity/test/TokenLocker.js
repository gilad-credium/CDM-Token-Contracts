const TokenLocker = artifacts.require("TokenLocker.sol");
const CrediumToken = artifacts.require("CrediumToken.sol")
const Utils = artifacts.require('Utils.sol');
const Owned = artifacts.require('Owned.sol');
const TokenHolder = artifacts.require('TokenHolder.sol');
const util = require("./util/Util.js");

function verifyException(stacktrace) {
    return stacktrace.includes('VM Exception') || stacktrace.includes('invalid opcode') || stacktrace.includes('invalid JUMP');
}

contract("TokenLocker", (accounts) => {

    let amount = 5;
    var timestamp;
    var token;
    var tokenLocker;
    var now;
    
    beforeEach(async () => {
        tokenLocker = await TokenLocker.new();
        token = await CrediumToken.new("CrediumTestToken", "CTT", 18);
        await token.issue(accounts[0], 500);
        await token.approve(tokenLocker.address, 0);
        await token.approve(tokenLocker.address, 200);
        now = await web3.eth.getBlock(web3.eth.blockNumber).timestamp;
        timestamp = now + util.addDays(14);
    });

    describe("lockup", async () => {
        it("should throw if called by a non-owner", async () => {
            try {
                let nonOwnerAccount = accounts[2];
                assert.notEqual(await tokenLocker.owner.call(), nonOwnerAccount)
                await tokenLocker.lockup(accounts[1], token.address, amount, timestamp, { from: nonOwnerAccount }); 
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });
    
        it("should throw if the amount is not greater than 0", async () => {
            try {
                await tokenLocker.lockup(accounts[1], token.address, 0, timestamp); 
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });
    
        it("should throw if an owner tries to lockup tokens for an empty address (0x0)", async () => {
            try {
                await tokenLocker.lockup("0x0", token.address, amount, timestamp); 
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });
    
        it("should throw if a _targetToken has an incorrect address (0x0)", async () => {
            try {
                await tokenLocker.lockup("0x0", token.address, amount, timestamp); 
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });
    
        it("should throw if a _targetToken is a TokenLocker contract itself", async () => {
            try {
                await tokenLocker.lockup(accounts[1], tokenLocker.address, amount, timestamp); 
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });
    
        it("should increase pendingLocked by an amount after lockup call", async () => {
            assert.equal(await tokenLocker.pendingLocked.call(), 0);
            await tokenLocker.lockup(accounts[1], token.address, amount, timestamp);
            assert.equal(await tokenLocker.pendingLocked.call(), amount);
        });
    
        it("should create Lock structure with the proper values if the _recipient has no value for the _targetToken", async () => {
            await tokenLocker.lockup(accounts[1], token.address, amount, timestamp);
            assert.isFalse(await tokenLocker.isConfirmed.call(accounts[1], token.address));
            assert.isFalse(await tokenLocker.isCollected.call(accounts[1], token.address));
            assert.isTrue(await tokenLocker.hasValue.call(accounts[1], token.address));
            assert.equal(await tokenLocker.getLockupAmount.call(accounts[1], token.address), amount);
            assert.equal(await tokenLocker.getLockupReleaseTimestamp.call(accounts[1], token.address), timestamp);
        });
    
        it("should increase _recipient's locked amount by an amount if a _recipient has previous value", async () => {
            await tokenLocker.lockup(accounts[1], token.address, amount, timestamp);
            assert.equal(await tokenLocker.getLockupAmount.call(accounts[1], token.address), amount);
            await tokenLocker.lockup(accounts[1], token.address, amount, timestamp);
            assert.equal(await tokenLocker.getLockupAmount.call(accounts[1], token.address), amount + amount);
        });
    
        it("should throw if an owner tries to change _recipient's amount when `releaseTimestamp > block.timestamp`", async () => {
            try {
                await tokenLocker.lockup(accounts[1], token.address, amount, timestamp);
                util.increaseEvmTime(14);
                await tokenLocker.lockup(accounts[1], token.address, amount, now);
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw if an owner attempts to update _releaseTimestamp for an existing lock with the value lower then block.timestamp", async () => {
            try {
                await tokenLocker.lockup(accounts[1], token.address, amount, timestamp);
                await tokenLocker.lockup(accounts[1], token.address, amount, 1516965000);
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw if an owner attempts to set _releaseTimestamp the value lower then block.timestamp", async () => {
            try {
                await tokenLocker.lockup(accounts[1], token.address, amount, 1516965000);
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });
    });

    describe("cancel", async () => {
        beforeEach(async () => {
            await tokenLocker.lockup(accounts[1], token.address, amount, timestamp + util.addDays(10000));
        });

        it("should throw if called by a non-owner", async () => {
            try {
                let nonOwnerAccount = accounts[2];
                assert.notEqual(await tokenLocker.owner.call(), nonOwnerAccount)
                await tokenLocker.cancel(accounts[1], token.address, { from: nonOwnerAccount }); 
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw if an owner tries to cancel a collected lockup", async () => {
            try {
                await tokenLocker.confirm(token.address, { from: accounts[1] });
                await tokenLocker.collect(token.address, { from: accounts[1] });
                await tokenLocker.cancel(accounts[1], token.address);
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw if an owner tries to cancel a lockup of non-existing or invalid `_recipient -> _targetToken` pair", async () => {
            try {
                await tokenLocker.cancel(accounts[8], "0xa1234");
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should decrease pendingLocked by an amount after cancel call if lockup is not confirmed", async () => {
            let ownableAmount = await tokenLocker.getLockupAmount.call(accounts[1], token.address);
            assert.equal(ownableAmount, amount);
            assert.equal(await tokenLocker.pendingLocked.call(), amount);
            await tokenLocker.cancel(accounts[1], token.address);
            assert.equal(await tokenLocker.pendingLocked.call(), amount - ownableAmount);
        });

        it("should decrease confirmedLocked by an amount after cancel call if lockup is confirmed", async () => {
            await tokenLocker.confirm(token.address, { from: accounts[1] });
            assert.isTrue(await tokenLocker.isConfirmed.call(accounts[1], token.address));
            let ownableAmount = await tokenLocker.getLockupAmount.call(accounts[1], token.address);
            assert.equal(await tokenLocker.confirmedLocked.call(), amount);
            await tokenLocker.cancel(accounts[1], token.address);
            assert.equal(await tokenLocker.confirmedLocked.call(), amount - ownableAmount);
        });

        it("should wipe Lock object for the particular `_recipient -> _targetToken` pair", async () => {
            await tokenLocker.cancel(accounts[1], token.address);
            assert.isFalse(await tokenLocker.isConfirmed.call(accounts[1], token.address));
            assert.isFalse(await tokenLocker.isCollected.call(accounts[1], token.address));
            assert.isFalse(await tokenLocker.hasValue.call(accounts[1], token.address));
            assert.equal(await tokenLocker.getLockupAmount.call(accounts[1], token.address), 0);
            assert.equal(await tokenLocker.getLockupReleaseTimestamp.call(accounts[1], token.address), 0);
        });

    });

    describe("confirm", async () => {
        beforeEach(async () => {
            await tokenLocker.lockup(accounts[1], token.address, amount, timestamp);
        });
    
        it("should throw when attempts to confirm non-existing `_recipient -> _targetToken` pair", async () => {
            try {
                await tokenLocker.confirm("0xa1234", { from: accounts[5] });
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw if a `msg.sender` tries to confirm a previously confirmed lockup", async () => {
            try {
                await tokenLocker.confirm(token.address, { from: accounts[1] });
                await tokenLocker.confirm(token.address, { from: accounts[1] });
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw if a `msg.sender` tries to confirm a collected lockup", async () => {
            try {
                await tokenLocker.confirm(token.address, { from: accounts[1] });
                await tokenLocker.collect(token.address, { from: accounts[1] });
                await tokenLocker.confirm(token.address, { from: accounts[1] });
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should change `confirmed` property of a Lock object to `true` when confirm a lockup", async () => {
            await tokenLocker.confirm(token.address, { from: accounts[1] });
            assert.isTrue(await tokenLocker.isConfirmed.call(accounts[1], token.address));
        });

        it("should decrease `pendingLocked` value by an account's `_amount`", async () => {
            assert.equal(await tokenLocker.pendingLocked.call(), amount);
            let accountsLockupAmount = await tokenLocker.getLockupAmount.call(accounts[1], token.address);
            let pendingLockedAmountBeforeConfirm = await tokenLocker.pendingLocked.call();
            await tokenLocker.confirm(token.address, { from: accounts[1] });
            assert.equal(await tokenLocker.pendingLocked.call(), pendingLockedAmountBeforeConfirm - accountsLockupAmount);
        });

        it("should increase `confirmedLocked` value by an account's `_amount`", async () => {
            let accountsLockupAmount = await tokenLocker.getLockupAmount.call(accounts[1], token.address);
            assert.equal(await tokenLocker.confirmedLocked.call(), 0);
            await tokenLocker.confirm(token.address, { from: accounts[1] });
            assert.deepEqual(await tokenLocker.confirmedLocked.call(), accountsLockupAmount);
        });
    
    });

    describe("collect", async () => {
        beforeEach(async () => {
            await tokenLocker.lockup(accounts[1], token.address, amount, timestamp);
        });

        it("should throw if a `msg.sender` attempts to confirm a collected lockup", async () => {
            try {
                await tokenLocker.collect(token.address, { from: accounts[1] });
                await tokenLocker.confirm(token.address, { from: accounts[1] });
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw when attempts to collect non-existing `_recipient -> _targetToken` pair", async () => {
            try {
                await tokenLocker.confirm("0xa1234", { from: accounts[5] });
                await tokenLocker.collect("0xa1234", { from: accounts[5] });
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should decrease `confirmedLocked` value by an account's `_amount`", async () => {
            await tokenLocker.confirm(token.address, { from: accounts[1] });
            let confirmedLockedAmountBeforeConfirm = await tokenLocker.confirmedLocked.call();
            assert.equal(confirmedLockedAmountBeforeConfirm, amount);
            let accountsLockupAmount = await tokenLocker.getLockupAmount.call(accounts[1], token.address);
            util.increaseEvmTime(14);
            await tokenLocker.collect(token.address, { from: accounts[1] });
            assert.equal(await tokenLocker.confirmedLocked.call(), confirmedLockedAmountBeforeConfirm - accountsLockupAmount);
        });

        it("should throw when attempts to collect a non-confirmed lockup", async () => {
            try {
                await tokenLocker.collect(token.address, { from: accounts[1] });
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

    });

    describe("redeem", async () => {
        beforeEach(async () => {
            await tokenLocker.lockup(accounts[1], token.address, amount, timestamp);
        });

        it("should throw if called by a non-owner", async () => {
            try {
                let nonOwnerAccount = accounts[2];
                assert.notEqual(await tokenLocker.owner.call(), nonOwnerAccount)
                await tokenLocker.redeem(token.address, { from: nonOwnerAccount }); 
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw if pendingLocked != 0", async () => {
            try {
                assert.isAbove(await tokenLocker.pendingLocked.call(), 0);
                await tokenLocker.redeem(token.address, { from: accounts[0] }); 
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw if confirmedLocked != 0", async () => {
            try {
                await tokenLocker.confirm(token.address, { from: accounts[1] });
                assert.isAbove(await tokenLocker.confirmedLocked.call(), 0);
                await tokenLocker.redeem(token.address, { from: accounts[0] }); 
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should set lockupEnabled to false", async () => {
            await tokenLocker.cancel(accounts[1], token.address, { from: accounts[0] });
            await tokenLocker.redeem(token.address, { from: accounts[0] });
            assert.isFalse(await tokenLocker.lockupEnabled.call());
        });

        it("should set tockenLocker token balance to 0", async () => {
            assert.isAbove(await token.balanceOf(tokenLocker.address), 0);
            await tokenLocker.cancel(accounts[1], token.address, { from: accounts[0] });
            await tokenLocker.redeem(token.address, { from: accounts[0] });
            assert.equal(await token.balanceOf(tokenLocker.address), 0);
        });

    });

});
