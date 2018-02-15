pragma solidity ^0.4.11;

contract IMultisigWallet {

    function confirmTransaction(uint transactionId) public;

    function revokeConfirmation(uint transactionId) public;

    function submitTransaction(address destination, uint value, bytes data) public returns (uint transactionId);

}