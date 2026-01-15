// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/TestNFT.sol";

/**
 * @title DeployTestNFT
 * @dev Deploys TestNFT contract and mints some NFTs for testing
 * 
 * Usage:
 *   forge script script/DeployTestNFT.s.sol --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY
 */
contract DeployTestNFT is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying TestNFT with deployer:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy TestNFT
        TestNFT nft = new TestNFT();
        console.log("TestNFT deployed at:", address(nft));
        
        // Mint 3 NFTs to the deployer for testing
        uint256 tokenId1 = nft.mint(deployer);
        uint256 tokenId2 = nft.mint(deployer);
        uint256 tokenId3 = nft.mint(deployer);
        
        console.log("Minted NFT Token ID:", tokenId1);
        console.log("Minted NFT Token ID:", tokenId2);
        console.log("Minted NFT Token ID:", tokenId3);
        
        vm.stopBroadcast();
        
        console.log("\n=== TestNFT Deployment Complete ===");
        console.log("Contract Address:", address(nft));
        console.log("Owner:", deployer);
        console.log("Minted Token IDs: 0, 1, 2");
        console.log("\nYou can now use these NFTs to create vaults in MantleFrac!");
    }
}
