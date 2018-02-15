pragma solidity ^0.4.11;

contract Misc {

    /**
     * Creates a payload for the `transfer` function.
     * bytes payload is needed to delegate a `transfer` function call from a multisig wallet.
     *
     * `signatureBytes` parameter corresponds to the first 4 bytes of a function signature. 
     * `addressBytes`   parameter is a converted `address` to bytes with length of 20.
     * `amountBytes`    pararameter is a uint256 `_amount` value converted and padded left to bytes32.
     * `data` is a result bytes array what has the next structure:
     * `data` = [signature (bytes4)][first parameter - address (12 padded left bytes + 20 bytes address)][second parameter - uint256 (padded left to bytes32)]
     */
    function buildTransferPayloadData(address _recipient, uint256 _amount) internal pure returns(bytes) {
        
        // hash function signature and cut only first 4 bytes
        bytes4 signatureBytes = bytes4(bytes32(keccak256("transfer(address,uint256)")));
        uint signatureLength = signatureBytes.length;

        // convert address `_recipient` to bytes20
        bytes memory addressBytes = addressToBytes(_recipient);
        uint addressBytesLength = addressBytes.length + 12;

        // convert uint `_amount` to bytes32
        bytes32 amountBytes = bytes32(_amount);
        uint amountBytesLength = amountBytes.length;

        bytes memory data = new bytes(signatureLength + addressBytesLength + amountBytesLength);

        // set first 4 bytes with the signature bytes
        for (uint x = 0; x < 4; x++) {
            data[x] = signatureBytes[x];
        }

        // pad left 12 bytes to match the parameter length requirement (address must be bytes32) next to the signature
        for (uint i = 0; i < 12; i++) {
            data[4 + i] = bytes1(0);
        }

        // set `address` bytes20 to the payload
        for (uint k = 0; k < 20; k++) {
            data[16 + k] = addressBytes[k];
        }

        // set `_amount` to the payload next to the address
        for (uint j = 0; j < 32; j++) {
            data[36 + j] = amountBytes[j];
        }
        
        return data;
    }

    /**
     * Convert a `_targetAddress` to a 20 bytes length bytes array  `addressBytes`
     */
    function addressToBytes(address _targetAddress) private pure returns (bytes addressBytes) {
        assembly {
                let freeMemoryPointer := mload(0x40)
                mstore(add(freeMemoryPointer, 20), xor(0x140000000000000000000000000000000000000000, _targetAddress))
                mstore(0x40, add(freeMemoryPointer, 52))
                addressBytes := freeMemoryPointer
        }
    }

}