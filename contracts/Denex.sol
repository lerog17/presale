pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

contract Denex is ERC20, ERC20Detailed {
    constructor(address treasury, uint256 initialSupply)
        public
        ERC20Detailed("Denex", "DNX", 18)
    {
        _mint(treasury, initialSupply);
    }
}
