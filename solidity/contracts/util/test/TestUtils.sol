pragma solidity ^0.4.11;

import "../Utils.sol";

contract TestUtils is Utils {

    function TestUtils() public {
    }

    function add(uint256 _x, uint256 _y) public pure returns (uint256) {
        return super.safeAdd(_x, _y);
    }

    function sub(uint256 _x, uint256 _y) public pure returns (uint256) {
        return super.safeSub(_x, _y);
    }

    function mul(uint256 _x, uint256 _y) public pure returns (uint256) {
        return super.safeMul(_x, _y);
    }
}
