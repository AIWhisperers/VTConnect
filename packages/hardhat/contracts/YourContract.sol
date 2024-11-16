//SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract YourContract is ERC721, ERC721Burnable, Ownable {
    constructor(address initialOwner)
        ERC721("MyToken", "MTK")
        Ownable(msg.sender)
    {}

    function available(uint256 tokenId) external view returns (bool){
        return _ownerOf(tokenId) == address(0);
    }
    function safeMint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }
}
