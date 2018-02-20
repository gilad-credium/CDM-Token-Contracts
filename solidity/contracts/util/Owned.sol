pragma solidity ^0.4.11;

import "../interfaces/IOwned.sol";
import "./Utils.sol";

contract Owned is IOwned, Utils {
    address public owner;
    address public newOwner;

    event OwnerUpdate(address _prevOwner, address _newOwner);

    function Owned() public {
        owner = msg.sender;
    }

    modifier ownerOnly {
        assert(msg.sender == owner);
        _;
    }

    /**
    *    Transfers ownership to a new address
    *
    *    @param _newOwner    new contract owner
    */
    function transferOwnership(address _newOwner) public 
        ownerOnly
        validAddress(_newOwner)
        notThis(_newOwner) 
    {
        require(_newOwner != owner);
        newOwner = _newOwner;
    }

    /**
    *    @dev used by a new owner to accept an ownership transfer
    */
    function acceptOwnership() public {
        require(msg.sender == newOwner);
        OwnerUpdate(owner, newOwner);
        owner = newOwner;
        newOwner = 0x0;
    }
}
