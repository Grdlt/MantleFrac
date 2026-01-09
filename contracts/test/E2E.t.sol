// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MantleFracVault.sol";
import "../src/VaultShareToken.sol";
import "../src/Marketplace.sol";
import "../src/ConstantProductAMM.sol";
import "../src/Distributor.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract E2EMockNFT is ERC721 {
    uint256 private _tokenIdCounter;
    constructor() ERC721("MockNFT", "MNFT") {}
    function mint(address to) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _mint(to, tokenId);
        return tokenId;
    }
}

contract E2EMockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract E2ETest is Test {
    MantleFracVault public vault;
    Marketplace public marketplace;
    ConstantProductAMM public amm;
    Distributor public distributor;
    E2EMockNFT public nft;
    E2EMockUSDC public usdc;

    address public alice = address(0x1);
    address public bob = address(0x2);
    address public protocolTreasury = address(0x4);

    uint256 public constant MAX_SUPPLY = 1000000 ether;
    uint256 public constant INITIAL_USDC = 1000000000000;

    function setUp() public {
        vault = new MantleFracVault();
        marketplace = new Marketplace(address(vault), protocolTreasury);
        amm = new ConstantProductAMM(protocolTreasury);
        distributor = new Distributor(address(vault));
        nft = new E2EMockNFT();
        usdc = new E2EMockUSDC();
        usdc.mint(alice, INITIAL_USDC);
        usdc.mint(bob, INITIAL_USDC);
    }


    function test_E2E_fullMarketplaceFlow() public {
        uint256 tokenId = nft.mint(alice);
        
        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        bytes32 vaultId = vault.createVault(address(nft), tokenId, "REAL", "Real Estate Share", MAX_SUPPLY, "standard");
        vault.mintShares(vaultId, alice, 10000 ether);
        vm.stopPrank();

        IMantleFracVault.Vault memory v = vault.getVault(vaultId);
        VaultShareToken shareToken = VaultShareToken(v.shareToken);
        assertEq(shareToken.balanceOf(alice), 10000 ether);

        vm.startPrank(alice);
        shareToken.approve(address(marketplace), 1000 ether);
        bytes32 listingId = marketplace.createListing(vaultId, 1000 ether, address(usdc), 100000000, 7 days);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(marketplace), 100000000);
        marketplace.fillListing(listingId);
        vm.stopPrank();

        assertEq(shareToken.balanceOf(bob), 1000 ether);
    }

    function test_E2E_fullAMMFlow() public {
        uint256 tokenId = nft.mint(alice);
        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        bytes32 vaultId = vault.createVault(address(nft), tokenId, "AMM", "AMM Test", MAX_SUPPLY, "standard");
        vault.mintShares(vaultId, alice, 100000 ether);
        vm.stopPrank();

        IMantleFracVault.Vault memory v = vault.getVault(vaultId);
        VaultShareToken shareToken = VaultShareToken(v.shareToken);

        vm.startPrank(alice);
        shareToken.approve(address(amm), 10000 ether);
        usdc.approve(address(amm), 1000000000);
        bytes32 poolId = amm.createPool(address(shareToken), address(usdc), 10000 ether, 1000000000, 30);
        vm.stopPrank();

        IConstantProductAMM.Pool memory pool = amm.getPool(poolId);
        assertEq(pool.reserveA, 10000 ether);

        vm.startPrank(bob);
        usdc.approve(address(amm), 100000000);
        uint256 amountOut = amm.swap(poolId, address(usdc), 100000000, 0);
        vm.stopPrank();
        assertTrue(amountOut > 0);
    }

    function test_E2E_fullDistributionFlow() public {
        uint256 tokenId = nft.mint(alice);
        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        bytes32 vaultId = vault.createVault(address(nft), tokenId, "DIV", "Dividend Test", MAX_SUPPLY, "standard");
        vault.mintShares(vaultId, alice, 6000 ether);
        vault.mintShares(vaultId, bob, 4000 ether);
        usdc.approve(address(distributor), 1000000000);
        bytes32 programId = distributor.scheduleDistribution(vaultId, address(usdc), 1000000000, block.timestamp, block.timestamp + 30 days);
        vm.stopPrank();

        vm.prank(alice);
        uint256 alicePayout = distributor.claimPayout(programId);
        assertApproxEqRel(alicePayout, 600000000, 0.01e18);

        vm.prank(bob);
        uint256 bobPayout = distributor.claimPayout(programId);
        assertApproxEqRel(bobPayout, 400000000, 0.01e18);
    }

    function test_E2E_fullRedemptionFlow() public {
        uint256 tokenId = nft.mint(alice);
        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        bytes32 vaultId = vault.createVault(address(nft), tokenId, "RED", "Redeem Test", MAX_SUPPLY, "standard");
        vault.mintShares(vaultId, alice, 10000 ether);
        vault.burnShares(vaultId, alice, 10000 ether);
        vault.redeemVault(vaultId);
        vm.stopPrank();

        assertEq(nft.ownerOf(tokenId), alice);
        IMantleFracVault.Vault memory v = vault.getVault(vaultId);
        assertEq(uint8(v.state), uint8(IMantleFracVault.VaultState.Redeemed));
    }

    function test_E2E_gasEstimation() public {
        uint256 tokenId = nft.mint(alice);
        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        uint256 gasBefore = gasleft();
        vault.createVault(address(nft), tokenId, "GAS", "Gas Test", MAX_SUPPLY, "standard");
        uint256 createVaultGas = gasBefore - gasleft();
        vm.stopPrank();
        assertTrue(createVaultGas < 3000000);
        emit log_named_uint("createVault gas", createVaultGas);
    }
}
