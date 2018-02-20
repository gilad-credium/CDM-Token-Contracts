
function addDays(days) {
    return days > 0 ? days * 86400 : 0;
}

async function increaseEvmTime(days) {
    await web3.currentProvider.send({
        jsonrpc: "2.0", 
        method: "evm_increaseTime", 
        params: [addDays(days)], id: 0
    });
    await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0});
}

module.exports = {
    increaseEvmTime: increaseEvmTime,
    addDays: addDays
}