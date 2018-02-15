pragma solidity ^0.4.11;

import "./interfaces/IMultisigWallet.sol";
import "./util/Misc.sol";
import "./util/Owned.sol";
import "./interfaces/IERC20Token.sol";

contract MultisigWalletAdapter is Misc, Owned {

    IMultisigWallet public multisigWallet;

    event SendMultisigTransaction(IERC20Token indexed _token, address indexed _recipient, uint256 _amount, uint _transactionId);
    event ConfirmMultisigTransaction(uint _transactionId);
    event RevokeMultisigTransaction(uint _transactionId);

    function MultisigWalletAdapter(address _multisigWallet) public {
        multisigWallet = IMultisigWallet(_multisigWallet);
    }

    /**
     *  Delegates a call of `transfer` function to a multisig wallet
     */
    function delegateTransfer(IERC20Token _token, address _recipient, uint256 _amount) public 
        ownerOnly
        returns(uint) 
    {
        bytes memory data = super.buildTransferPayloadData(_recipient, _amount);

        // `value` is 0 because we send only tokens, not ether
        uint transactionId = multisigWallet.submitTransaction(_token, 0, data);

        SendMultisigTransaction(_token, _recipient, _amount, transactionId);
        return transactionId;
    }

    function confirmMultisigTransaction(uint _transactionId) public ownerOnly {
        multisigWallet.confirmTransaction(_transactionId);
        ConfirmMultisigTransaction(_transactionId);
    }

    function revokeMultisigConfirmation(uint _transactionId) public ownerOnly {
        multisigWallet.revokeConfirmation(_transactionId);
        RevokeMultisigTransaction(_transactionId);
    }

}