const Utils = artifacts.require('TestUtils.sol');

function verifyException(stacktrace) {
    return stacktrace.includes('VM Exception') || stacktrace.includes('invalid opcode') || stacktrace.includes('invalid JUMP');
}

contract("Utils", (accounts) => {

    var utils;
    const max256bitValue = web3.toBigNumber("115792089237316195423570985008687907853269984665640564039457584007913129639935");

    beforeEach(async () => {
        utils = await Utils.new();
    });

    it("verifies safeAdd", async () => {
        let addend1 = 1;
        let addend2 = 2;
        assert.equal(await utils.add(addend1, addend2), addend1 + addend2);
    });

    it("should throw if safeAdd overflows", async () => {
        try {
            let addend2 = 42;
            await utils.add(max256bitValue, addend2);
            assert(false, "no error. something went wrong");
        } catch (error) {
            let stacktrace = error.toString();
            return assert(verifyException(stacktrace), stacktrace);
        }
    });

    it("verifies safeSub", async () => {
        let minuend = 3;
        let subtrahend = 2;
        assert.equal(await utils.sub(minuend, subtrahend), minuend - subtrahend);
    });

    it("should throw if minuend < subtrahend", async () => {
        try {
            let minuend = 1;
            let subtrahend = 2;
            await utils.sub(minuend, subtrahend);
            assert(false, "no error. something went wrong");
        } catch (error) {
            let stacktrace = error.toString();
            return assert(verifyException(stacktrace), stacktrace);
        }
    });

    it("verifies safeMul", async () => {
        let multiplier = 3;
        let multiplicand = 2;
        assert.equal(await utils.mul(multiplier, multiplicand), multiplier * multiplicand);
    });

    it("should throw if multiplication overflows", async () => {
        try {
            let multiplicand = 42;
            await utils.mul(max256bitValue, multiplicand);
            assert(false, "no error. something went wrong");
        } catch (error) {
            let stacktrace = error.toString();
            return assert(verifyException(stacktrace), stacktrace);
        }
    });

});