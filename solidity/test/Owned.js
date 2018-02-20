const Owned = artifacts.require('Owned.sol');

function verifyException(stacktrace) {
    return stacktrace.includes('VM Exception') || stacktrace.includes('invalid opcode') || stacktrace.includes('invalid JUMP');
}

contract("Owned", (accounts) => {

    beforeEach(async () => {
        owned = await Owned.new();
    });

    describe("construction", async () => {
    
        it("verifies contract's owner after construction", async () => {
            assert.equal(await owned.owner.call(), accounts[0]);
        });
    
    });

    describe("transferOwnership", async () => {

        it("verifies `newOwner` value", async () => {
            await owned.transferOwnership(accounts[1]);
            assert.equal(await owned.newOwner.call(), accounts[1]);
        });

        it("should throw if called from a non-owner account", async () => {
            try {
                await owned.transferOwnership(accounts[1], { from: accounts[1]});
                assert(false, "no error. something went wrong");
            } catch(error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw when `_newOwner` has invalid value", async () => {
            try {
                await owned.transferOwnership("0x0");
                assert(false, "no error. something went wrong");
            } catch(error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw when `_newOwner` == `owner`", async () => {
            try {
                await owned.transferOwnership(accounts[0]);
                assert(false, "no error. something went wrong");
            } catch(error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

        it("should throw when `_newOwner` is a contract itself", async () => {
            try {
                await owned.transferOwnership(owned.address);
                assert(false, "no error. something went wrong");
            } catch(error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

    });

    describe("acceptOwnership", async () => {
    
        it("verifies `owner` value", async () => {
            await owned.transferOwnership(accounts[1]);
            await owned.acceptOwnership({ from: accounts[1]});
            assert.equal(await owned.owner.call(), accounts[1]);
        });
    
        it("verifies that `newOwner` value is 0x0", async () => {
            await owned.transferOwnership(accounts[1]);
            await owned.acceptOwnership({ from: accounts[1]});
            assert.equal(await owned.newOwner.call(), "0x0000000000000000000000000000000000000000");
        });

        it("should throw if called from an account what is not a `newOwner`", async () => {
            try {
                await owned.transferOwnership(accounts[1]);
                await owned.acceptOwnership({ from: accounts[2]});
                assert(false, "no error. something went wrong");
            } catch(error) {
                let stacktrace = error.toString();
                return assert(verifyException(stacktrace), stacktrace);
            }
        });

    });

});