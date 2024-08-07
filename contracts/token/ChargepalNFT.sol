// SPDX-License-Identifier: MIT
pragma solidity =0.8.21;

import { ERC721URIStorage } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { ERC721URIStorage } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract ChargepalNFT is ERC721Enumerable, Ownable {
    uint256 public currentTokenId;
    string private _baseuri;

    bytes32 public constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 public constant MINTPERMIT_TYPEHASH = keccak256("MintPermit(address to,string txid)");
    bytes32 public DOMAIN_SEPARATOR;

    mapping(bytes32 => bool) public used;
    mapping(address => bool) public minted;

    mapping(address => bool) public isMinter;
    mapping(address => bool) public isBurner;

    error NonMinter();
    error NonBurner();
    error Reuse();
    error DuplicateMint();
    error MisMatch();
    error InvalidSigner();

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) Ownable(msg.sender) {
        currentTokenId = 1;
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(DOMAIN_TYPEHASH, keccak256(bytes("mintpermit")), keccak256(bytes("1")), chainId, address(this))
        );
    }

    function mint(address _to) external {
        if (!isMinter[msg.sender]) revert NonMinter();
        _safeMint(_to, currentTokenId);
        currentTokenId += 1;
    }

    function burn(uint256 _tokenId) external {
        if (!isBurner[msg.sender]) revert NonBurner();

        _burn(_tokenId);
    }

    function mintPermit(address to, string memory txid, uint8 v, bytes32 r, bytes32 s) external {
        if (msg.sender != to) revert MisMatch();

        bytes32 digest = buildClaimSeparator(to, txid);
        if (used[digest]) revert Reuse();
        used[digest] = true;

        if (minted[to]) revert DuplicateMint();
        minted[to] = true;

        address signer = ecrecover(digest, v, r, s);
        console.log(signer);

        if (!isMinter[signer]) revert InvalidSigner();

        _safeMint(to, currentTokenId);
        currentTokenId += 1;
    }

    function addMinter(address _minter) external onlyOwner {
        isMinter[_minter] = true;
    }

    function removeMinter(address _minter) external onlyOwner {
        isMinter[_minter] = false;
    }

    function addBurner(address _burner) external onlyOwner {
        isBurner[_burner] = true;
    }

    function removeBurner(address _burner) external onlyOwner {
        isBurner[_burner] = false;
    }

    function setBaseURI(string memory _uri) external onlyOwner {
        _setBaseURI(_uri);
    }

    function buildClaimSeparator(address to, string memory txid) public view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    DOMAIN_SEPARATOR,
                    keccak256(abi.encode(MINTPERMIT_TYPEHASH, to, keccak256(bytes(txid))))
                )
            );
    }

    function _setBaseURI(string memory _uri) internal {
        _baseuri = _uri;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseuri;
    }
}
