const CrediumToken = artifacts.require('CrediumToken.sol');

function verifyException(stacktrace) {
    return stacktrace.includes('VM Exception') || stacktrace.includes('invalid opcode') || stacktrace.includes('invalid JUMP');
}

contract("CrediumToken", (accounts) => {

    it("verifies token parameters such as name, symbol and decimals when the contract is constructed", async () => {
        let token = await CrediumToken.new("CrediumTestToken", "CTT", 18);
        let tokenName = await token.name.call();
        let tokenSymbol = await token.symbol.call();
        let tokenDecimals = await token.decimals.call();

        assert.equal(tokenName, "CrediumTestToken");
        assert.equal(tokenSymbol, "CTT");
        assert.equal(tokenDecimals, 18)
    });

    it("verifies that a token owner can issue tokens", async () => {
        let token = await CrediumToken.new("CrediumTestToken", "CTT", 18);
        await token.issue(accounts[0], 1);
        let balance = await token.balanceOf.call(accounts[0]);
        assert.equal(balance, 1);
    });

    it("should throw if a token owner tries to issue tokens to the contract address", async () => {
        try {
            let token = await CrediumToken.new("CrediumTestToken", "CTT", 18);
            await token.issue(token.address, 1);
            assert(false, "no error. something went wrong");
        } catch (error) {
            let stacktrace = error.toString();
            return assert(verifyException(stacktrace), stacktrace);
        }
    });

    it("should throw if a token owner tries to issue tokens to an empty address (0x0)", async () => {
        try {
            let token = await CrediumToken.new("CrediumTestToken", "CTT", 18);
            await token.issue("0x0", 1);
            assert(false, "no error. something went wrong");
        } catch (error) {
            let stacktrace = error.toString();
            return assert(verifyException(stacktrace), stacktrace);
        }
    });

    it("should throw if a token owner tries to transfer tokens to an empty address (0x0)", async () => {
        try {
            let token = await CrediumToken.new("CrediumTestToken", "CTT", 18);
            await token.issue(accounts[0], 5)
            await token.transfer("0x0", 1);
            assert(false, "no error. something went wrong");
        } catch (error) {
            let stacktrace = error.toString();
            return assert(verifyException(stacktrace), stacktrace);
        }
    });

    it("should throw when a non-owner tries to issue tokens", async () => {
        try {
            let token = await CrediumToken.new("CrediumTestToken", "CTT", 18);
            await token.issue(accounts[1], 1);
        }
        catch (error) {
            let stacktrace = error.toString();
            return assert(verifyException(stacktrace), stacktrace);
        }
    });

    it("verifies a target address balance after the transfer", async () => {
        let token = await CrediumToken.new("CrediumTestToken", "CTT", 18);
        await token.issue(accounts[0], 5);
        await token.transfer(accounts[1], 1);
        let balance = await token.balanceOf.call(accounts[1]);
        assert.equal(balance, 1);
    });

    it("verifies that `msg.sender` balance was decreased after the transfer", async () => {
        let token = await CrediumToken.new("CrediumTestToken", "CTT", 18);
        await token.issue(accounts[0], 5);
        let balanceBefore = await token.balanceOf.call(accounts[0]);
        assert.equal(balanceBefore, 5)
        await token.transfer(accounts[1], 1);
        let balanceAfter = await token.balanceOf.call(accounts[0]);
        assert.equal(balanceAfter, 4);
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

    it("should throw when a non-owner attempts to destroy tokens", async () => {
        let token = await CrediumToken.new("CrediumTestToken", "CTT", 18);
        await token.issue(accounts[0], 5);
    
        try {
            await token.destroy(accounts[0], 1, { from: accounts[1] });
            assert(false, "no error. something went wrong");
        }
        catch (error) {
            let stacktrace = error.toString();
            return assert(verifyException(stacktrace), stacktrace);
        }
    });

    it("verifies an allowance after an approval", async () => {
        let token = await CrediumToken.new("CrediumTestToken", "CTT", 18);
        await token.issue(accounts[0], 5);
        await token.approve(accounts[1], 1);
        let allowance = await token.allowance.call(accounts[0], accounts[1]);
        assert.equal(allowance, 1);
    });

    it("should throw if an allowance _spender address is empty (0x0)", async () => {
        try {
            let token = await CrediumToken.new("CrediumTestToken", "CTT", 18);
            await token.approve("0x0", 1);
            assert(false, "no error. something went wrong");
        } catch (error) {
            let stacktrace = error.toString();
            return assert(verifyException(stacktrace), stacktrace);
        }
    });

    it("verifies if a token owner can disable/enable transfers", async () => {
        let token = await CrediumToken.new("CrediumTestToken", "CTT", 18);
        await token.disableTransfers(true);
        let transfersEnabled = await token.transfersEnabled.call();
        assert.equal(transfersEnabled, false);
        await token.disableTransfers(false);
        transfersEnabled = await token.transfersEnabled.call();
        assert.equal(transfersEnabled, true);
    });

});
