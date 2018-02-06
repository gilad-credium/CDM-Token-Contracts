const CrediumToken = artifacts.require('CrediumToken.sol');

function verifyException(stacktrace) {
    return stacktrace.includes('VM Exception') || stacktrace.includes('invalid opcode') || stacktrace.includes('invalid JUMP');
}

var token;

contract("CrediumToken", (accounts) => {

    describe("construction", async () => {
        it("verifies token parameters such as name, symbol and decimals when the contract is constructed", async () => {
            let token = await CrediumToken.new("CrediumTestToken", "CTT", 18);
            let tokenName = await token.name.call();
            let tokenSymbol = await token.symbol.call();
            let tokenDecimals = await token.decimals.call();
    
            assert.equal(tokenName, "CrediumTestToken");
            assert.equal(tokenSymbol, "CTT");
            assert.equal(tokenDecimals, 18)
        });

        it("should throw if tokenName is empty", async () => {
            try {
                await CrediumToken.new("", "CTT", 18);
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });
    
        it("should throw if tokenSymbol is empty", async () => {
            try {
                await CrediumToken.new("CrediumTestToken", "", 18);
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });
    });

    describe("issue", async () => {
        beforeEach(async () => {
            token = await CrediumToken.new("CrediumTestToken", "CTT", 18);
        });

        it("verifies that a token owner can issue tokens", async () => {
            let targetBalanceBeforeIssue = await token.balanceOf.call(accounts[0]);
            assert.equal(targetBalanceBeforeIssue, 0);
            await token.issue(accounts[0], 1);
            let targetBalanceAfterIssue = await token.balanceOf.call(accounts[0]);
            assert.equal(targetBalanceAfterIssue, 1);
        });

        it("verifies that a totalSupply was increased after an issue", async () => {
            let totalSupplyBeforeIssue = await token.totalSupply.call();
            assert(totalSupplyBeforeIssue, 0);
            await token.issue(accounts[0], 1);
            let totalSupplyAfterIssue = await token.totalSupply.call();
            assert.equal(totalSupplyAfterIssue, 1);
        });
    
        it("should throw if a token owner attempts to issue tokens to the contract address", async () => {
            try {
                await token.issue(token.address, 1);
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });
    
        it("should throw if a token owner attempts to issue tokens to an empty address (0x0)", async () => {
            try {
                await token.issue("0x0", 1);
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw when a non-owner attempts to issue tokens", async () => {
            try {
                await token.issue(accounts[1], 1, { from: accounts[1] });
                assert(false, "no error. something went wrong");
            }
            catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });
    });

    describe("approve", async () => {
        beforeEach(async () => {
            token = await CrediumToken.new("CrediumTestToken", "CTT", 18);
        });

        it("verifies an allowance after an approval", async () => {
            await token.approve(accounts[1], 1);
            let allowance = await token.allowance.call(accounts[0], accounts[1]);
            assert.equal(allowance, 1);
        });
    
        it("should throw if an allowance _spender address is empty (0x0)", async () => {
            try {
                await token.approve("0x0", 1);
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw if an allowance _value > 0 and _spender allready has an allowance _value", async () => {
            try {
                await token.approve(accounts[1], 2);
                await token.approve(accounts[1], 3);
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });
    });

    describe("destroy", async () => {
        beforeEach(async () => {
            token = await CrediumToken.new("CrediumTestToken", "CTT", 18);
            await token.issue(accounts[0], 5);
        });

        it("should throw when a non-owner attempts to destroy tokens", async () => {
            try {
                await token.destroy(accounts[0], 1, { from: accounts[1] });
                assert(false, "no error. something went wrong");
            }
            catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("verifies that totalSupply was decreased after a destroy", async () => {
            let totalSupplyBeforeDestroy = await token.totalSupply.call();
            assert.equal(totalSupplyBeforeDestroy, 5);
            await token.destroy(accounts[0], 1);
            let totalSupplyAfterDestroy = await token.totalSupply.call();
            assert.equal(totalSupplyAfterDestroy, 4);
        });

        it("verifies that target balance was decreased after a destroy", async () => {
            let target = accounts[0];
            let targetBalanceBeforeDestroy = await token.balanceOf(target);
            assert.equal(targetBalanceBeforeDestroy, 5);
            await token.destroy(accounts[0], 1);
            let targetBalanceAfterDestroy = await token.balanceOf(target);
            assert.equal(targetBalanceAfterDestroy, 4);
        });

    });

    describe("transfer", async () => {
        beforeEach(async () => {
            token = await CrediumToken.new("CrediumTestToken", "CTT", 18);
            await token.issue(accounts[0], 5);
        });

        it("verifies if a token owner can disable/enable transfers", async () => {
            await token.disableTransfers(true);
            let transfersEnabled = await token.transfersEnabled.call();
            assert.equal(transfersEnabled, false);
            await token.disableTransfers(false);
            transfersEnabled = await token.transfersEnabled.call();
            assert.equal(transfersEnabled, true);
        });
    
        it("should throw when attempts to transfer tokens when transfer are disabled", async () => {
            try {
                await token.disableTransfers(true);
                await token.transfer(accounts[1], 3);
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("verifies a target address balance after a transfer", async () => {
            await token.transfer(accounts[1], 1);
            let balance = await token.balanceOf.call(accounts[1]);
            assert.equal(balance, 1);
        });
    
        it("verifies that `msg.sender` balance was decreased after a transfer", async () => {
            let balanceBefore = await token.balanceOf.call(accounts[0]);
            assert.equal(balanceBefore, 5)
            await token.transfer(accounts[1], 1);
            let balanceAfter = await token.balanceOf.call(accounts[0]);
            assert.equal(balanceAfter, 4);
        });

        it("verifies that _spender allowance was _value decreased after a transferFrom", async () => {
            let owner = accounts[0];
            let spender = accounts[1];
            let reciever = accounts[2];
            await token.approve(spender, 1, { from: owner });
            assert.equal(await token.allowance(owner, spender), 1);
            await token.transferFrom(owner, reciever, 1, { from: spender });
            assert.equal(await token.allowance(owner, spender), 0);
        });

        it("should throw if a _spender attempts to transfer more than allowance _value", async () => {
            try {
                let owner = accounts[0];
                let spender = accounts[1];
                let reciever = accounts[2];
                await token.approve(spender, 1, { from: owner });
                await token.transferFrom(owner, reciever, 10, { from: spender });
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw if a token owner attempts to transfer tokens to an empty address (0x0)", async () => {
            try {
                await token.transfer("0x0", 1);
                assert(false, "no error. something went wrong");
            } catch (error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });
    });

});
