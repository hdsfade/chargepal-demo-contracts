// SPDX-License-Identifier: MIT

pragma solidity =0.8.21;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Capped } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract ChargepalToken is ERC20Capped, Ownable {
    mapping(address => bool) public isMinter;
    mapping(address => bool) public isBurner;

    error ZeroAddress();
    event TopUp(address indexed sender, uint256 amount);

    constructor() ERC20("Chargepal Token", "Charge") ERC20Capped(1_000_000_000 * (10 ** 18)) Ownable(msg.sender) {}

    function addMinter(address _minter) external onlyOwner {
        if (_minter == address(0)) revert ZeroAddress();
        isMinter[_minter] = true;
    }

    function removeMinter(address _minter) external onlyOwner {
        if (_minter == address(0)) revert ZeroAddress();
        isMinter[_minter] = false;
    }

    function addBurner(address _burner) external onlyOwner {
        if (_burner == address(0)) revert ZeroAddress();
        isBurner[_burner] = true;
    }

    function removeBurner(address _burner) external onlyOwner {
        if (_burner == address(0)) revert ZeroAddress();
        isBurner[_burner] = false;
    }

    function mint(address _to, uint256 _amount) external {
        require(isMinter[msg.sender], "Only minter can mint");
        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external {
        require(isBurner[msg.sender], "Only burner can burn");
        _burn(_from, _amount);
    }

    function topUp(uint256 _amount) external {
        _burn(msg.sender, _amount);
        emit TopUp(msg.sender, _amount);
    }
}
