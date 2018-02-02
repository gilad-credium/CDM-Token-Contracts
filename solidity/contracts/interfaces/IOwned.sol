pragma solidity ^0.4.11;

/**
*    forked from https://github.com/bancorprotocol/contracts
*    Owned contract interface
*/
contract IOwned {
    function owner() public pure returns (address) {}

    function transferOwnership(address _newOwner) public;
    function acceptOwnership() public;
}