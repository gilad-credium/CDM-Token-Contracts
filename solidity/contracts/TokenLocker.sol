pragma solidity ^0.4.11;

import "./interfaces/ITokenLocker.sol";
import "./interfaces/IERC20Token.sol";
import "./util/Owned.sol";

/**
*   TokenLocker contract allows to keep a promise 
*   that a specified amount of tokens will be locked upon a release date.     
*/
contract TokenLocker is ITokenLocker {

    mapping(address => address) public tokenOwners;

    function TokenLocker() public {
        lockupEnabled = true;
    }

    function lockup(address _recipient, IERC20Token _targetToken, uint256 _amount, uint256 _releaseTimestamp) public 
        ownerOnly
        isLockupEnabled
        notThis(_targetToken)
        notThis(_recipient)
        validAddress(_targetToken)
        validAddress(_recipient)
        returns(bool) 
    {
        require(_amount > 0);
        if (accountLockedAmount[_recipient][_targetToken].hasValue) {
            Lock storage lock = accountLockedAmount[_recipient][_targetToken];
            uint256 sum = safeAdd(lock.amount, _amount);
            require(super.checkAllowance(_targetToken, msg.sender, address(this), sum));
            require(lock.releaseTimestamp > now && _releaseTimestamp >= lock.releaseTimestamp);

            assert(_targetToken.transferFrom(msg.sender, address(this), lock.amount));

            lock.amount = sum;
        } else {
            require(_releaseTimestamp > now);
            require(super.checkAllowance(_targetToken, msg.sender, address(this), _amount));

            assert(_targetToken.transferFrom(msg.sender, address(this), _amount));

            accountLockedAmount[_recipient][_targetToken] = Lock(_releaseTimestamp, _amount, false, false, true);
        }

        if (tokenOwners[_targetToken] == 0x0) {
            tokenOwners[_targetToken] = msg.sender;
        }

        pendingLocked = safeAdd(pendingLocked, _amount);

        PendingLockup(_recipient, _targetToken, _amount, _releaseTimestamp);
        return true;
    }

    function cancel(address _recipient, IERC20Token _targetToken) public 
        ownerOnly
        containsRecipient(_recipient, _targetToken) 
        notCollected(_recipient, _targetToken)
        returns(bool) 
    {
        Lock storage lock = accountLockedAmount[_recipient][_targetToken];

        if (lock.confirmed) {
            confirmedLocked = safeSub(confirmedLocked, lock.amount);
        } else {
            pendingLocked = safeSub(pendingLocked, lock.amount);
        }

        delete accountLockedAmount[_recipient][_targetToken];

        CancelLockup(msg.sender, _recipient, _targetToken);
        return true;
    }    

    function confirm(IERC20Token _targetToken) public 
        containsRecipient(msg.sender, _targetToken) 
        notConfirmed(msg.sender, _targetToken) 
        notCollected(msg.sender, _targetToken)
        returns(bool) 
    {
        Lock storage lock = accountLockedAmount[msg.sender][_targetToken];
        lock.confirmed = true;
        pendingLocked = safeSub(pendingLocked, lock.amount);
        confirmedLocked = safeAdd(confirmedLocked, lock.amount);

        ConfirmLockup(msg.sender, _targetToken);
        return true;
    }

    function collect(IERC20Token _targetToken) public 
        containsRecipient(msg.sender, _targetToken) 
        notCollected(msg.sender, _targetToken) 
        returns(bool) 
    {
        Lock storage lock = accountLockedAmount[msg.sender][_targetToken];
        require(lock.confirmed);
        require(super.isReleaseTime(msg.sender, _targetToken));
        
        assert(_targetToken.transfer(msg.sender, lock.amount));
        lock.collected = true;
        confirmedLocked = safeSub(confirmedLocked, lock.amount);

        Collect(msg.sender, _targetToken);
        return true;
    }

    function redeem(IERC20Token _targetToken) public
        ownerOnly
        returns(bool)
    {
        require(pendingLocked == 0 && confirmedLocked == 0);

        uint256 tokenAmount = _targetToken.balanceOf(address(this));
        assert(_targetToken.transfer(tokenOwners[_targetToken], tokenAmount));
        super.setLockupEnabled(false);

        Redeem(_targetToken, tokenAmount);
        return true;
    }

}