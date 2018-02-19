pragma solidity ^0.4.11;

import "./interfaces/ITokenLocker.sol";
import "./interfaces/IERC20Token.sol";
import "./util/Owned.sol";
import "./MultisigWalletAdapter.sol";

/**
*   TokenLocker contract allows to keep a promise 
*   that a specified amount of tokens will be locked upon a release date.     
*/
contract TokenLocker is ITokenLocker {

    mapping(address => address) public tokenOwners;

    function TokenLocker(MultisigWalletAdapter _multisigWalletAdapter) public {
        lockupEnabled = true;
        multisigWalletAdapter = _multisigWalletAdapter;
    }

    function setMultisigWalletAdapter(MultisigWalletAdapter _multisigWalletAdapter) public {
        multisigWalletAdapter = _multisigWalletAdapter;
    }

    function transferToMultisigWallet(address _owner, IERC20Token _targetToken, uint256 _amount) private {
        require(checkAllowance(_targetToken, _owner, address(this), _amount));
        assert(_targetToken.transferFrom(_owner, multisigWalletAdapter.multisigWallet(), _amount));
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
        if (accountLockedAmount[_recipient][_targetToken].hasValue) {
            Lock storage lock = accountLockedAmount[_recipient][_targetToken];
            require(lock.releaseTimestamp > now && _releaseTimestamp >= lock.releaseTimestamp);
            transferToMultisigWallet(msg.sender, _targetToken, _amount);
            lock.amount = _amount;
        } else {
            require(_releaseTimestamp > now);
            transferToMultisigWallet(msg.sender, _targetToken, _amount);
            accountLockedAmount[_recipient][_targetToken] = Lock(_releaseTimestamp, _amount, false, false, false, true);
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
        require(!lock.requestedCollect);
        lock.confirmed = true;
        pendingLocked = safeSub(pendingLocked, lock.amount);
        confirmedLocked = safeAdd(confirmedLocked, lock.amount);

        ConfirmLockup(msg.sender, _targetToken);
        return true;
    }

    function requestCollect(IERC20Token _targetToken) public 
        containsRecipient(msg.sender, _targetToken) 
        returns(bool) 
    {
        Lock storage lock = accountLockedAmount[msg.sender][_targetToken];
        require(lock.confirmed);
        require(!lock.requestedCollect);
        require(super.isReleaseTime(msg.sender, _targetToken));
        
        uint transactionId = multisigWalletAdapter.delegateTransfer(_targetToken, msg.sender, lock.amount);
        lock.requestedCollect = true;

        RequestCollect(msg.sender, _targetToken, transactionId);
        return true;
    }

    function setCollected(IERC20Token _targetToken) public 
        containsRecipient(msg.sender, _targetToken) 
        notCollected(msg.sender, _targetToken) 
        returns (bool)
    {
        Lock storage lock = accountLockedAmount[msg.sender][_targetToken];
        require(lock.requestedCollect);
        lock.collected = true;
        confirmedLocked = safeSub(confirmedLocked, lock.amount);

        Collect(msg.sender, _targetToken, lock.amount);
        return true;
    }

}