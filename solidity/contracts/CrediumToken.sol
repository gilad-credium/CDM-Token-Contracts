pragma solidity ^0.4.11;
import "./interfaces/IERC20Token.sol";
import "./util/TokenHolder.sol";
import "./util/Owned.sol";
import "./interfaces/ISmartToken.sol";

/**
 *  Implementation of the Bancor Smart Token v0.3
 *
 *  'Owned' is specified here for readability reasons
 */
contract CrediumToken is ISmartToken, Owned, TokenHolder {

    string public name = "";
    string public symbol = "";
    uint8 public decimals = 0;
    uint256 public totalSupply = 0;
    bool public transfersEnabled = true;

    mapping (address => uint256) public balanceOf;
    mapping (address => mapping (address => uint256)) public allowance;

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
    event NewSmartToken(address _token);
    event Issuance(uint256 _amount);
    event Destruction(uint256 _amount);

    /**
     *   Constructor function
     *
     *   @param _name       token name
     *   @param _symbol     token short symbol, minimum 1 character
     *   @param _decimals   for display purposes only
     */
    function CrediumToken(string _name, string _symbol, uint8 _decimals) public {
        require(bytes(_name).length > 0 && bytes(_symbol).length > 0); // validate input
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        NewSmartToken(address(this));
    }

    modifier transfersAllowed {
        assert(transfersEnabled);
        _;
    }

    /**
     *  Disable/Enable token transfers
     *
     *  @param _disable    true to disable transfers, false to enable them
     */
    function disableTransfers(bool _disable) public ownerOnly {
        transfersEnabled = !_disable;
    }

    /**
     *   Issue new tokens
     *
     *   Increases the token supply and sends the new tokens to an account
     *   can only be called by the contract owner
     *
     *   @param _to         account to receive the new amount
     *   @param _amount     amount to increase the supply by
     */
    function issue(address _to, uint256 _amount)
        public
        ownerOnly
        validAddress(_to)
        notThis(_to)
    {
        totalSupply = safeAdd(totalSupply, _amount);
        balanceOf[_to] = safeAdd(balanceOf[_to], _amount);

        Issuance(_amount);
        Transfer(this, _to, _amount);
    }

    /**
     *   Destroy tokens
     *   Destroys tokens from any account or by any holder to destroy tokens from his/her own account
     *
     *   @param _from       account to remove the amount from
     *   @param _amount     amount to decrease the supply by
     */
    function destroy(address _from, uint256 _amount) public {
        require(msg.sender == _from || msg.sender == owner); // validate input

        balanceOf[_from] = safeSub(balanceOf[_from], _amount);
        totalSupply = safeSub(totalSupply, _amount);

        Transfer(_from, this, _amount);
        Destruction(_amount);
    }

    /**
     * Transfer tokens
     *
     * Send `_value` tokens to `_to` from your account
     *
     * @param _to The address of the recipient
     * @param _value the amount to send
     */
    function transfer(address _to, uint256 _value)
        public
        validAddress(_to)
        returns (bool success)
    {
        _transfer(msg.sender, _to, _value);
        return true;
    }

    /**
     * Transfer tokens from other address
     *
     * Send `_value` tokens to `_to` in behalf of `_from`
     *
     * @param _from The address of the sender
     * @param _to The address of the recipient
     * @param _value the amount to send
     */
    function transferFrom(address _from, address _to, uint256 _value)
        public
        validAddress(_from)
        validAddress(_to)
        returns (bool success)
    {
        allowance[_from][msg.sender] = safeSub(allowance[_from][msg.sender], _value);
        _transfer(_from, _to, _value);
        return true;
    }

    /**
     * Internal transfer, only can be called by this contract
     */
    function _transfer(address _from, address _to, uint256 _value) internal {
        balanceOf[_from] = safeSub(balanceOf[_from], _value);
        balanceOf[_to] = safeAdd(balanceOf[_to], _value);
        Transfer(_from, _to, _value);
    }

    /**
     * Set allowance for other address
     *
     * Allows `_spender` to spend no more than `_value` tokens on your behalf
     *
     * also, to minimize the risk of the approve/transferFrom attack vector
     * (see https://docs.google.com/document/d/1YLPtQxZu1UAvO9cZ1O2RPXBbT0mooh4DYKjA_jp-RLM/), approve has to be called twice
     * in 2 separate transactions - once to change the allowance to 0 and secondly to change it to the new allowance value
     *
     * @param _spender The address authorized to spend
     * @param _value the max amount they can spend
     *
     * @return true if the approval was successful, false if it wasn't
     */
    function approve(address _spender, uint256 _value)
        public
        validAddress(_spender)
        returns (bool success)
    {
        // if the allowance isn't 0, it can only be updated to 0 to prevent an allowance change immediately after withdrawal
        require(_value == 0 || allowance[msg.sender][_spender] == 0);

        allowance[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }
}
