pragma solidity ^0.4.11;

import "./util/Owned.sol";
import "./interfaces/ITokenLocker.sol";

// TODO set this adapter to connect TokenLocker and CrediumToken contracts.
contract TokenLockerAdapter is Owned, ITokenLocker {

    mapping(address => uint256) public lockedPerContractTokens;

    function TokenLockerAdapter(ITokenLocker _tokenLocker) public {
        owner = _tokenLocker;
    }

    function increaseTotalLocked(IERC20Token _token, uint256 _amount) public 
        ownerOnly
        returns(bool) 
    {
        lockedPerContractTokens[_token] = safeAdd(lockedPerContractTokens[_token], _amount);
        return true;
    }

    function decreaseTotalLocked(IERC20Token _token, uint256 _amount) public 
        ownerOnly
        returns(bool) 
    {
        lockedPerContractTokens[_token] = safeSub(lockedPerContractTokens[_token], _amount);
        return true;
    }

    function getTotalLocked() public view returns(uint256) {
        return lockedPerContractTokens[msg.sender];
    }

}