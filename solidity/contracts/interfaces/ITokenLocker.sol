pragma solidity ^0.4.11;

import "../util/Owned.sol";
import "./IERC20Token.sol";

contract ITokenLocker is Owned {
    
    uint256 public pendingLocked = 0;
    uint256 public confirmedLocked = 0;
    mapping (address => mapping (address => Lock)) public accountLockedAmount;

    bool public lockupEnabled;

    event PendingLockup(address indexed _recipient, IERC20Token indexed _targetToken, uint256 _amount, uint256 _releaseTimestamp);
    event CancelLockup(address indexed _owner, address indexed _recipient, IERC20Token indexed _targetToken);
    event ConfirmLockup(address indexed _recipient, IERC20Token indexed _targetToken);
    event Collect(address indexed _recipient, IERC20Token indexed _targetToken);
    event Redeem(IERC20Token indexed _targetToken, uint256 _amount);

    struct Lock {
        uint256 releaseTimestamp;
        uint256 amount;
        bool confirmed;
        bool collected;
        bool hasValue;
    }

    modifier containsRecipient(address _recipient, IERC20Token _targetToken) {
        require(hasValue(_recipient, _targetToken));
        _;
    }

    modifier notConfirmed(address _recipient, IERC20Token _targetToken) {
        require(!isConfirmed(_recipient, _targetToken));
        _;
    }

    modifier notCollected(address _recipient, IERC20Token _targetToken) {
        require(!isCollected(_recipient, _targetToken));
        _;
    }

    modifier isLockupEnabled() {
        require(lockupEnabled);
        _;
    }

    function lockup(address _recipient, IERC20Token _targetToken, uint256 _amount, uint256 _releaseTimestamp) public returns(bool);

    function cancel(address _recipient, IERC20Token _targetToken) public returns(bool);

    function confirm(IERC20Token _targetToken) public returns(bool);

    function collect(IERC20Token _targetToken) public returns(bool);

    function redeem(IERC20Token _targetToken) public returns(bool);

    function getLockupAmount(address _recipient, IERC20Token _targetToken) public view returns(uint256) {
        return accountLockedAmount[_recipient][_targetToken].amount;
    }

    function getLockupReleaseTimestamp(address _recipient, IERC20Token _targetToken) public view returns(uint256) {
        return accountLockedAmount[_recipient][_targetToken].releaseTimestamp;
    }

    function isConfirmed(address _recipient, IERC20Token _targetToken) public view returns(bool) {
        return accountLockedAmount[_recipient][_targetToken].confirmed;
    }

    function isCollected(address _recipient, IERC20Token _targetToken) public view returns(bool) {
        return accountLockedAmount[_recipient][_targetToken].collected;
    }

    function hasValue(address _recipient, IERC20Token _targetToken) public view returns(bool) {
        return accountLockedAmount[_recipient][_targetToken].hasValue;
    }

    function isReleaseTime(address _recipient, IERC20Token _targetToken) public view returns(bool) {
        return accountLockedAmount[_recipient][_targetToken].releaseTimestamp <= now;
    }

    function checkAllowance(IERC20Token _targetToken, address _owner, address _spender, uint256 _amount) public view returns(bool) {
        return _targetToken.allowance(_owner, _spender) >= safeAdd(_amount, safeAdd(pendingLocked, confirmedLocked));
    }

    function setLockupEnabled(bool enable) public ownerOnly {
        lockupEnabled = enable;
    }

}