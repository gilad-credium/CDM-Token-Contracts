pragma solidity ^0.4.11;

/*
* Common modifiers and math functions.
*/
contract Utils {

    function Utils() public {
    }

    modifier greaterThanZero(uint256 _amount) {
        require(_amount > 0);
        _;
    }

    modifier validAddress(address _address) {
        require(_address != 0x0);
        _;
    }

    modifier notThis(address _address) {
        require(_address != address(this));
        _;
    }

    modifier notNow(uint256 _timestamp) {
        require(now < _timestamp);
        _;
    }

    function safeAdd(uint256 _x, uint256 _y) internal pure returns (uint256) {
        uint256 z = _x + _y;
        assert(z >= _x);
        return z;
    }

    function safeSub(uint256 _x, uint256 _y) internal pure returns (uint256) {
        assert(_x >= _y);
        return _x - _y;
    }

    function safeMul(uint256 _x, uint256 _y) internal pure returns (uint256) {
        uint256 z = _x * _y;
        assert(_x == 0 || z / _x == _y);
        return z;
    }
}
