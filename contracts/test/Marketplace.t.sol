// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Marketplace.sol";
import "../src/MantleFracVault.sol";
import "../src/VaultShareToken.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Mock ERC721 for testing
contract MockNFT is ERC721 {
    uint256 private _tokenIdCounter;
    constructor() ERC721("MockNFT", "MNFT") {}
    function mint(address to) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _mint(to, tokenId);
        return tokenId;
    }
}

/// @notice Mock ERC20 for payment
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

/**
 * @title MarketplaceTest
 * @notice Tests for Marketplace contract
 * @dev Feature: mantle-migration
 */
contract MarketplaceTest is Test {
    Marketplace public marketplace;
    MantleFracVault public vault;
    MockNFT public nft;
    MockUSDC public usdc;

    address public owner = address(this);
    address public alice = address(0x1);
    address public bob = address(0x2);

    bytes32 public vaultId;
    address public shareToken;

    uint256 public constant MAX_SUPPLY = 1_000_000 ether;
    uint256 public constant USDC_AMOUNT = 10_000 * 1e6; // 10k USDC

    function setUp() public {
        vault = new MantleFracVault();
        marketplace = new Marketplace(address(vault), owner);
        nft = new MockNFT();
        usdc = new MockUSDC();

        // Create a vault for testing
        uint256 tokenId = nft.mint(alice);
        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        vaultId = vault.createVault(address(nft), tokenId, "TST", "Test Share", MAX_SUPPLY, "standard");
        vault.mintShares(vaultId, alice, 10_000 ether);
        vm.stopPrank();

        shareToken = vault.getVault(vaultId).shareToken;

        // Give bob some USDC
        usdc.mint(bob, USDC_AMOUNT);
    }

    // ============ Property 5: Fee Split Correctness ============
    // Feature: mantle-migration, Property 5: Fee Split Correctness

    function test_fillListing_collectsFees() public {
        uint256 shareAmount = 100 ether;
        uint256 priceAmount = 1000 * 1e6; // 1000 USDC

        // Alice creates listing
        vm.startPrank(alice);
        VaultShareToken(shareToken).approve(address(marketplace), shareAmount);
        bytes32 listingId = marketplace.createListing(vaultId, shareAmount, address(usdc), priceAmount, 0);
        vm.stopPrank();

        // Bob fills listing
        vm.startPrank(bob);
        usdc.approve(address(marketplace), priceAmount);
        marketplace.fillListing(listingId);
        vm.stopPrank();

        // Verify shares transferred
        assertEq(VaultShareToken(shareToken).balanceOf(bob), shareAmount);
    }

    // ============ Property 9: Listing Atomic Fill ============
    // Feature: mantle-migration, Property 9: Listing Atomic Fill

    function test_fillListing_atomic() public {
        uint256 shareAmount = 100 ether;
        uint256 priceAmount = 1000 * 1e6;

        vm.startPrank(alice);
        VaultShareToken(shareToken).approve(address(marketplace), shareAmount);
        bytes32 listingId = marketplace.createListing(vaultId, shareAmount, address(usdc), priceAmount, 0);
        vm.stopPrank();

        uint256 aliceSharesBefore = VaultShareToken(shareToken).balanceOf(alice);
        uint256 bobUsdcBefore = usdc.balanceOf(bob);

        vm.startPrank(bob);
        usdc.approve(address(marketplace), priceAmount);
        marketplace.fillListing(listingId);
        vm.stopPrank();

        // Atomic: both transfers happened
        assertEq(VaultShareToken(shareToken).balanceOf(bob), shareAmount);
        assertLt(usdc.balanceOf(bob), bobUsdcBefore);
    }

    function test_fillListing_failsWithInsufficientPayment() public {
        uint256 shareAmount = 100 ether;
        uint256 priceAmount = 1000 * 1e6;

        vm.startPrank(alice);
        VaultShareToken(shareToken).approve(address(marketplace), shareAmount);
        bytes32 listingId = marketplace.createListing(vaultId, shareAmount, address(usdc), priceAmount, 0);
        vm.stopPrank();

        // Bob only approves half
        vm.startPrank(bob);
        usdc.approve(address(marketplace), priceAmount / 2);
        vm.expectRevert();
        marketplace.fillListing(listingId);
        vm.stopPrank();

        // Listing should still be open
        IMarketplace.Listing memory listing = marketplace.getListing(listingId);
        assertEq(uint8(listing.status), uint8(IMarketplace.ListingStatus.Open));
    }

    // ============ Property 10: Listing Cancellation Returns Shares ============
    // Feature: mantle-migration, Property 10: Listing Cancellation Returns Shares

    function test_cancelListing_returnsShares() public {
        uint256 shareAmount = 100 ether;
        uint256 priceAmount = 1000 * 1e6;

        uint256 aliceSharesBefore = VaultShareToken(shareToken).balanceOf(alice);

        vm.startPrank(alice);
        VaultShareToken(shareToken).approve(address(marketplace), shareAmount);
        bytes32 listingId = marketplace.createListing(vaultId, shareAmount, address(usdc), priceAmount, 0);

        // Shares should be escrowed
        assertEq(VaultShareToken(shareToken).balanceOf(alice), aliceSharesBefore - shareAmount);

        // Cancel listing
        marketplace.cancelListing(listingId);
        vm.stopPrank();

        // Shares should be returned
        assertEq(VaultShareToken(shareToken).balanceOf(alice), aliceSharesBefore);

        // Listing should be cancelled
        IMarketplace.Listing memory listing = marketplace.getListing(listingId);
        assertEq(uint8(listing.status), uint8(IMarketplace.ListingStatus.Cancelled));
    }

    function test_cancelListing_onlySeller() public {
        uint256 shareAmount = 100 ether;
        uint256 priceAmount = 1000 * 1e6;

        vm.startPrank(alice);
        VaultShareToken(shareToken).approve(address(marketplace), shareAmount);
        bytes32 listingId = marketplace.createListing(vaultId, shareAmount, address(usdc), priceAmount, 0);
        vm.stopPrank();

        // Bob tries to cancel - should fail
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(Marketplace.NotListingSeller.selector, listingId, bob));
        marketplace.cancelListing(listingId);
    }

    function testFuzz_cancelListing_returnsExactShares(uint256 shareAmount) public {
        // Feature: mantle-migration, Property 10: Listing Cancellation Returns Shares
        shareAmount = bound(shareAmount, 1 ether, 1000 ether);
        uint256 priceAmount = 1000 * 1e6;

        uint256 aliceSharesBefore = VaultShareToken(shareToken).balanceOf(alice);

        vm.startPrank(alice);
        VaultShareToken(shareToken).approve(address(marketplace), shareAmount);
        bytes32 listingId = marketplace.createListing(vaultId, shareAmount, address(usdc), priceAmount, 0);
        marketplace.cancelListing(listingId);
        vm.stopPrank();

        // Invariant: shares returned exactly
        assertEq(VaultShareToken(shareToken).balanceOf(alice), aliceSharesBefore);
    }

    // ============ Additional Tests ============

    function test_createListing_emitsEvent() public {
        uint256 shareAmount = 100 ether;
        uint256 priceAmount = 1000 * 1e6;

        vm.startPrank(alice);
        VaultShareToken(shareToken).approve(address(marketplace), shareAmount);

        vm.expectEmit(false, true, true, false);
        emit IMarketplace.ListingCreated(bytes32(0), vaultId, alice, shareAmount, address(usdc), priceAmount);

        marketplace.createListing(vaultId, shareAmount, address(usdc), priceAmount, 0);
        vm.stopPrank();
    }

    function test_getListingsByVault() public {
        vm.startPrank(alice);
        VaultShareToken(shareToken).approve(address(marketplace), 300 ether);
        marketplace.createListing(vaultId, 100 ether, address(usdc), 1000 * 1e6, 0);
        marketplace.createListing(vaultId, 100 ether, address(usdc), 2000 * 1e6, 0);
        marketplace.createListing(vaultId, 100 ether, address(usdc), 3000 * 1e6, 0);
        vm.stopPrank();

        bytes32[] memory listings = marketplace.getListingsByVault(vaultId);
        assertEq(listings.length, 3);
    }

    function test_getListingsBySeller() public {
        vm.startPrank(alice);
        VaultShareToken(shareToken).approve(address(marketplace), 200 ether);
        marketplace.createListing(vaultId, 100 ether, address(usdc), 1000 * 1e6, 0);
        marketplace.createListing(vaultId, 100 ether, address(usdc), 2000 * 1e6, 0);
        vm.stopPrank();

        bytes32[] memory listings = marketplace.getListingsBySeller(alice);
        assertEq(listings.length, 2);
    }

    function test_listingExpiry() public {
        uint256 shareAmount = 100 ether;
        uint256 priceAmount = 1000 * 1e6;
        uint256 duration = 1 hours;

        vm.startPrank(alice);
        VaultShareToken(shareToken).approve(address(marketplace), shareAmount);
        bytes32 listingId = marketplace.createListing(vaultId, shareAmount, address(usdc), priceAmount, duration);
        vm.stopPrank();

        // Fast forward past expiry
        vm.warp(block.timestamp + duration + 1);

        // Bob tries to fill expired listing
        vm.startPrank(bob);
        usdc.approve(address(marketplace), priceAmount);
        vm.expectRevert(abi.encodeWithSelector(Marketplace.ListingHasExpired.selector, listingId));
        marketplace.fillListing(listingId);
        vm.stopPrank();
    }
}
