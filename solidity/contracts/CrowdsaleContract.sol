pragma solidity ^0.4.11;

import "./util/Utils.sol";
import "./util/Owned.sol";
import "./interfaces/ISmartToken.sol";

contract CrowdsaleContract is Utils, Owned {

    uint256 public constant CROWDSALE_DURATION = 14 days;       // crowdsale duration
    uint256 public constant TOKEN_PRICE_N = 1;                  // price numerator
    uint256 public constant TOKEN_PRICE_D = 100;                // price denominator
    uint256 public constant MAX_GAS_PRICE = 50000000000 wei;    // maximum gas price for contribution transactions
    uint256 public constant TOTAL_ETHER_CAP = 1000000 ether;    // ether contribution cap

    uint256 public crowdsaleStartTime = 0;                      // crowdsale start timestamp
    uint256 public crowdsaleEndTime = 0;                        // crowdsale end timestamp
    uint256 public totalEtherContributed = 0;                   // ether contributed so far
    address public beneficiary = 0x0;                           // address to receive all ether contributions

    ISmartToken public token;

    event ContributionEvent(address indexed _contributor, uint256 contributedAmount, uint256 tokenAmount);

    function CrowdsaleContract(ISmartToken _token, uint256 _crowdsaleStartTime, address _beneficiary) public 
        notNow(_crowdsaleStartTime)
        validAddress(_token)
        validAddress(_beneficiary)
        notThis(_beneficiary)
    {
        crowdsaleStartTime = _crowdsaleStartTime;
        crowdsaleEndTime = safeAdd(crowdsaleStartTime, CROWDSALE_DURATION);
        beneficiary = _beneficiary;
        token = _token;
    }

    function () public payable {
        receiveETH();
    }

    function receiveETH() private
        returns(uint256)
    {
        assert(tx.gasprice <= MAX_GAS_PRICE);
        assert(now >= crowdsaleStartTime && now < crowdsaleEndTime);
        assert(safeAdd(totalEtherContributed, msg.value) <= TOTAL_ETHER_CAP);

        uint256 tokenAmount = calculateOutcome(msg.value);

        beneficiary.transfer(msg.value);
        totalEtherContributed = safeAdd(totalEtherContributed, msg.value);
        token.issue(msg.sender, tokenAmount);
        token.issue(beneficiary, tokenAmount);

        ContributionEvent(msg.sender, msg.value, tokenAmount);
        return tokenAmount;
    }

    function calculateOutcome(uint256 _contribution) public pure returns (uint256) {
        return safeMul(_contribution, TOKEN_PRICE_D) / TOKEN_PRICE_N;
    }

    function transferTokenOwnership(address _newOwner) public ownerOnly {
        token.transferOwnership(_newOwner);
    }

    function acceptTokenOwnership() public ownerOnly {
        token.acceptOwnership();
    }

}