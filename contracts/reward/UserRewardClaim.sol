// SPDX-License-Identifier: MIT
pragma solidity =0.8.21;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract UserRewardClaim is OwnableUpgradeable {
    using SafeERC20 for IERC20;

    IERC20 public charge;
    address public notifier;
    uint256 public cooldown;
    uint256 public lastNotifyTime;

    bytes32 public rewardMerkleRoot;
    mapping(address => uint256) public claimedAmount;

    error InsufficientBalance();
    error NotInMerkle();
    error NonNotifier();
    error CoolDown();
    error ZeroAddress();
    error NonNFTOwner();

    /// @notice Emitted after a successful token claim
    /// @param to recipient of claim
    /// @param amount of tokens claimed
    /// @param totalClaimedAmount of tokens
    event Claim(address indexed to, uint256 amount, uint256 totalClaimedAmount);
    event NotifierChanged(address indexed oldNotifier, address indexed newNotifier);

    modifier onlyNotifier() {
        if (msg.sender != notifier) revert NonNotifier();
        _;
    }

    function initialize(IERC20 _token, IERC721 _chargeNFT) public initializer {
        __Ownable_init(msg.sender);
        charge = _token;
        cooldown = 1 days;
    }

    function setClaimMerkleRoot(bytes32 _claimMerkleRoot) external onlyNotifier {
        if (block.timestamp < lastNotifyTime + cooldown) revert CoolDown();
        lastNotifyTime = block.timestamp;
        rewardMerkleRoot = _claimMerkleRoot;
    }

    /// @notice Allows claiming tokens if address is part of merkle tree
    /// @param _quota total reward amount (charge Token)
    /// @param _amount of claiming amount (charge Token)
    /// @param _proof merkle proof to prove address and amount are in tree
    function claim(uint256 _quota, uint256 _amount, bytes32[] calldata _proof) external {
        address msgSender = msg.sender; // address of claimee


        // Verify merkle proof, or revert if not in tree
        bytes32 leaf = keccak256(abi.encodePacked(msgSender, _quota));
        bool isValidLeaf = MerkleProof.verify(_proof, rewardMerkleRoot, leaf);
        if (!isValidLeaf) revert NotInMerkle();

        uint256 balance = _quota - claimedAmount[msgSender];

        if (_amount > balance) revert InsufficientBalance();
        claimedAmount[msgSender] += _amount;
        charge.safeTransfer(msg.sender, _amount);

        emit Claim(msgSender, _amount, claimedAmount[msgSender]);
    }

    function setNotifier(address _notifier) external onlyOwner {
        if (msg.sender == address(0)) revert ZeroAddress();
        emit NotifierChanged(notifier, _notifier);
        notifier = _notifier;
    }

    function collect(address _token, uint256 _amount, bool _isETH) external onlyOwner {
        address msgSender = msg.sender;

        if (_isETH) {
            payable(msgSender).transfer(_amount);
        } else {
            IERC20(_token).safeTransfer(msgSender, _amount);
        }
    }
}
