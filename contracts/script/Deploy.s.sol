// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MantleFracVault.sol";
import "../src/Marketplace.sol";
import "../src/ConstantProductAMM.sol";
import "../src/Distributor.sol";

/**
 * @title Deploy
 * @notice Deployment script for MantleFrac contracts
 * @dev Run with: forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --verify
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying MantleFrac contracts...");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy MantleFracVault
        MantleFracVault vault = new MantleFracVault();
        console.log("MantleFracVault deployed at:", address(vault));

        // Deploy Marketplace with vault address and deployer as protocol treasury
        Marketplace marketplace = new Marketplace(address(vault), deployer);
        console.log("Marketplace deployed at:", address(marketplace));

        // Deploy ConstantProductAMM with deployer as fee recipient
        ConstantProductAMM amm = new ConstantProductAMM(deployer);
        console.log("ConstantProductAMM deployed at:", address(amm));

        // Deploy Distributor with vault address
        Distributor distributor = new Distributor(address(vault));
        console.log("Distributor deployed at:", address(distributor));

        vm.stopBroadcast();

        // Summary
        console.log("\n=== Deployment Summary ===");
        console.log("MantleFracVault:", address(vault));
        console.log("Marketplace:", address(marketplace));
        console.log("ConstantProductAMM:", address(amm));
        console.log("Distributor:", address(distributor));
    }
}

/**
 * @title DeployTestnet
 * @notice Deployment script specifically for Mantle Sepolia Testnet
 */
contract DeployTestnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        console.log("Deploying to Mantle Sepolia Testnet...");

        vm.startBroadcast(deployerPrivateKey);

        MantleFracVault vault = new MantleFracVault();
        Marketplace marketplace = new Marketplace(address(vault), vm.addr(deployerPrivateKey));
        ConstantProductAMM amm = new ConstantProductAMM(vm.addr(deployerPrivateKey));
        Distributor distributor = new Distributor(address(vault));

        vm.stopBroadcast();

        console.log("\n=== Testnet Deployment ===");
        console.log("MantleFracVault:", address(vault));
        console.log("Marketplace:", address(marketplace));
        console.log("ConstantProductAMM:", address(amm));
        console.log("Distributor:", address(distributor));
    }
}
