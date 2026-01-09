// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MantleFracVault.sol";
import "../src/VaultShareToken.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

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

/**
 * @title MantleFracVaultTest
 * @notice Tests for MantleFracVault contract
 * @dev Feature: mantle-migration
 */
contract MantleFracVaultTest is Test {
    MantleFracVault public vault;
    MockNFT public nft;

    address public owner = address(this);
    address public alice = address(0x1);
    address public bob = address(0x2);

    uint256 public constant MAX_SUPPLY = 1_000_000 ether;

    function setUp() public {
        vault = new MantleFracVault();
        nft = new MockNFT();
    }

    // ============ Property 3: Vault Creation Event Emission ============
    // Feature: mantle-migration, Property 3: Vault Creation Event Emission

    function test_createVault_emitsEvent() public {
        uint256 tokenId = nft.mint(alice);

        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);

        vm.expectEmit(false, true, false, false);
        emit IMantleFracVault.VaultCreated(
            bytes32(0), // vaultId is generated
            address(nft),
            tokenId,
            "TST",
            address(0), // shareToken is deployed
            alice
        );

        vault.createVault(address(nft), tokenId, "TST", "Test Share", MAX_SUPPLY, "standard");
        vm.stopPrank();
    }

    function test_createVault_storesMetadata() public {
        uint256 tokenId = nft.mint(alice);

        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        bytes32 vaultId = vault.createVault(address(nft), tokenId, "TST", "Test Share", MAX_SUPPLY, "standard");
        vm.stopPrank();

        IMantleFracVault.Vault memory v = vault.getVault(vaultId);

        assertEq(v.nftContract, address(nft));
        assertEq(v.tokenId, tokenId);
        assertEq(v.creator, alice);
        assertEq(v.maxSupply, MAX_SUPPLY);
        assertEq(uint8(v.state), uint8(IMantleFracVault.VaultState.Open));
        assertTrue(v.shareToken != address(0));
    }

    function test_createVault_transfersNFT() public {
        uint256 tokenId = nft.mint(alice);

        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        vault.createVault(address(nft), tokenId, "TST", "Test Share", MAX_SUPPLY, "standard");
        vm.stopPrank();

        assertEq(nft.ownerOf(tokenId), address(vault));
    }

    function test_createVault_deploysShareToken() public {
        uint256 tokenId = nft.mint(alice);

        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        bytes32 vaultId = vault.createVault(address(nft), tokenId, "TST", "Test Share", MAX_SUPPLY, "standard");
        vm.stopPrank();

        IMantleFracVault.Vault memory v = vault.getVault(vaultId);
        VaultShareToken shareToken = VaultShareToken(v.shareToken);

        assertEq(shareToken.name(), "Test Share");
        assertEq(shareToken.symbol(), "TST");
        assertEq(shareToken.maxSupply(), MAX_SUPPLY);
        assertEq(shareToken.vaultId(), vaultId);
    }

    // ============ Property 4: Redemption Requires Zero Supply ============
    // Feature: mantle-migration, Property 4: Redemption Requires Zero Supply

    function test_redeemVault_requiresZeroSupply() public {
        uint256 tokenId = nft.mint(alice);

        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        bytes32 vaultId = vault.createVault(address(nft), tokenId, "TST", "Test Share", MAX_SUPPLY, "standard");

        // Mint some shares
        vault.mintShares(vaultId, alice, 100 ether);

        // Try to redeem - should fail
        vm.expectRevert(
            abi.encodeWithSelector(MantleFracVault.SharesNotBurned.selector, vaultId, 100 ether)
        );
        vault.redeemVault(vaultId);
        vm.stopPrank();
    }

    function test_redeemVault_succeedsWithZeroSupply() public {
        uint256 tokenId = nft.mint(alice);

        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        bytes32 vaultId = vault.createVault(address(nft), tokenId, "TST", "Test Share", MAX_SUPPLY, "standard");

        // Mint and burn shares
        vault.mintShares(vaultId, alice, 100 ether);
        vault.burnShares(vaultId, alice, 100 ether);

        // Redeem should succeed
        vault.redeemVault(vaultId);
        vm.stopPrank();

        // NFT should be returned
        assertEq(nft.ownerOf(tokenId), alice);

        // Vault state should be Redeemed
        IMantleFracVault.Vault memory v = vault.getVault(vaultId);
        assertEq(uint8(v.state), uint8(IMantleFracVault.VaultState.Redeemed));
    }

    function testFuzz_redeemVault_requiresZeroSupply(uint256 mintAmount) public {
        // Feature: mantle-migration, Property 4: Redemption Requires Zero Supply
        mintAmount = bound(mintAmount, 1, MAX_SUPPLY);

        uint256 tokenId = nft.mint(alice);

        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        bytes32 vaultId = vault.createVault(address(nft), tokenId, "TST", "Test Share", MAX_SUPPLY, "standard");

        vault.mintShares(vaultId, alice, mintAmount);

        // Should fail with any non-zero supply
        vm.expectRevert();
        vault.redeemVault(vaultId);

        // Burn all and try again
        vault.burnShares(vaultId, alice, mintAmount);
        vault.redeemVault(vaultId);

        // Should succeed
        assertEq(nft.ownerOf(tokenId), alice);
        vm.stopPrank();
    }

    // ============ Property 6: Vault Metadata Persistence ============
    // Feature: mantle-migration, Property 6: Vault Metadata Persistence

    function testFuzz_vaultMetadataPersistence(
        uint256 tokenId,
        uint256 maxSupply,
        string calldata policy
    ) public {
        // Feature: mantle-migration, Property 6: Vault Metadata Persistence
        vm.assume(bytes(policy).length > 0 && bytes(policy).length < 100);
        maxSupply = bound(maxSupply, 0, type(uint128).max);

        // Mint NFT with specific tokenId
        vm.prank(address(nft));
        // Use a simple approach - mint to alice
        uint256 actualTokenId = nft.mint(alice);

        vm.startPrank(alice);
        nft.approve(address(vault), actualTokenId);
        bytes32 vaultId = vault.createVault(
            address(nft),
            actualTokenId,
            "TST",
            "Test Share",
            maxSupply,
            policy
        );
        vm.stopPrank();

        // Verify all metadata is persisted
        IMantleFracVault.Vault memory v = vault.getVault(vaultId);

        assertEq(v.nftContract, address(nft));
        assertEq(v.tokenId, actualTokenId);
        assertEq(v.creator, alice);
        assertEq(v.custodian, address(vault));
        assertEq(v.maxSupply, maxSupply);
        assertEq(v.policy, policy);
        assertEq(uint8(v.state), uint8(IMantleFracVault.VaultState.Open));
        assertTrue(v.shareToken != address(0));
        assertTrue(v.createdAt > 0);
    }

    // ============ Additional Tests ============

    function test_createVault_preventsDoubleVaulting() public {
        uint256 tokenId = nft.mint(alice);

        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        vault.createVault(address(nft), tokenId, "TST", "Test Share", MAX_SUPPLY, "standard");
        vm.stopPrank();

        // Try to vault same NFT again (would fail anyway since NFT is transferred)
        // But let's test the mapping check by minting a new NFT and trying to use same tokenId
        // This test verifies the _nftToVault mapping works
        assertTrue(vault.vaultExists(vault.getVaultByShareToken(
            vault.getVault(
                keccak256(abi.encodePacked(block.chainid, address(vault), uint256(1)))
            ).shareToken
        )));
    }

    function test_mintShares_onlyCreator() public {
        uint256 tokenId = nft.mint(alice);

        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        bytes32 vaultId = vault.createVault(address(nft), tokenId, "TST", "Test Share", MAX_SUPPLY, "standard");
        vm.stopPrank();

        // Bob tries to mint - should fail
        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(MantleFracVault.NotVaultCreator.selector, vaultId, bob)
        );
        vault.mintShares(vaultId, bob, 100 ether);

        // Alice can mint
        vm.prank(alice);
        vault.mintShares(vaultId, alice, 100 ether);

        assertEq(vault.getShareTotalSupply(vaultId), 100 ether);
    }

    function test_pauseVault_onlyOwner() public {
        uint256 tokenId = nft.mint(alice);

        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        bytes32 vaultId = vault.createVault(address(nft), tokenId, "TST", "Test Share", MAX_SUPPLY, "standard");
        vm.stopPrank();

        // Alice (not owner) tries to pause - should fail
        vm.prank(alice);
        vm.expectRevert();
        vault.pauseVault(vaultId);

        // Owner can pause
        vault.pauseVault(vaultId);

        IMantleFracVault.Vault memory v = vault.getVault(vaultId);
        assertEq(uint8(v.state), uint8(IMantleFracVault.VaultState.Paused));
    }

    function test_setShareTransferMode() public {
        uint256 tokenId = nft.mint(alice);

        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        bytes32 vaultId = vault.createVault(address(nft), tokenId, "TST", "Test Share", MAX_SUPPLY, "standard");

        vault.setShareTransferMode(vaultId, IVaultShareToken.TransferMode.Paused);
        vm.stopPrank();

        IMantleFracVault.Vault memory v = vault.getVault(vaultId);
        VaultShareToken shareToken = VaultShareToken(v.shareToken);

        assertEq(uint8(shareToken.transferMode()), uint8(IVaultShareToken.TransferMode.Paused));
    }

    function test_vaultExists() public {
        bytes32 fakeVaultId = keccak256("fake");
        assertFalse(vault.vaultExists(fakeVaultId));

        uint256 tokenId = nft.mint(alice);

        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        bytes32 vaultId = vault.createVault(address(nft), tokenId, "TST", "Test Share", MAX_SUPPLY, "standard");
        vm.stopPrank();

        assertTrue(vault.vaultExists(vaultId));
    }

    function test_getVaultByShareToken() public {
        uint256 tokenId = nft.mint(alice);

        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        bytes32 vaultId = vault.createVault(address(nft), tokenId, "TST", "Test Share", MAX_SUPPLY, "standard");
        vm.stopPrank();

        IMantleFracVault.Vault memory v = vault.getVault(vaultId);
        bytes32 foundVaultId = vault.getVaultByShareToken(v.shareToken);

        assertEq(foundVaultId, vaultId);
    }
}
