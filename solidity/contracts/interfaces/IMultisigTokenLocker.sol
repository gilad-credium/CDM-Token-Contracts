pragma solidity ^0.4.11;

import "../MultisigWalletAdapter.sol";
import "../util/Owned.sol";

contract IMultisigTokenLocker is Owned {

    MultisigWalletAdapter public multisigWalletAdapter;

    function acceptMultisigWalletAdapterOwnership() public ownerOnly {
        multisigWalletAdapter.acceptOwnership();
    }

    function transferTokenOwnership(address _newOwner) public ownerOnly {
        multisigWalletAdapter.transferOwnership(_newOwner);
    }

}