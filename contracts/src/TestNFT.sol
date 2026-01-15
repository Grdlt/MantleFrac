// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestNFT
 * @dev A simple ERC721 NFT for testing MantleFrac vault creation
 */
contract TestNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    string private _baseTokenURI;

    constructor() ERC721("MantleFrac Test NFT", "MFTEST") Ownable(msg.sender) {
        _baseTokenURI = "https://api.example.com/nft/";
    }

    /**
     * @dev Mint a new NFT to the specified address
     * @param to The address to receive the NFT
     */
    function mint(address to) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
        return tokenId;
    }

    /**
     * @dev Mint multiple NFTs to the specified address
     * @param to The address to receive the NFTs
     * @param count The number of NFTs to mint
     */
    function mintBatch(address to, uint256 count) public returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            tokenIds[i] = mint(to);
        }
        return tokenIds;
    }

    /**
     * @dev Set the base URI for token metadata
     * @param baseURI The new base URI
     */
    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Get the current token ID counter
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
}
