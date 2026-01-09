// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/VaultShareToken.sol";

/**
 * @title VaultShareTokenTest
 * @notice Tests for VaultShareToken contract
 * @dev Feature: mantle-migration
 */
contract VaultShareTokenTest is Test {
    VaultShareToken public token;

    address public owner = address(this);
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);

    bytes32 public constant VAULT_ID = keccak256("test-vault");
    uint256 public constant MAX_SUPPLY = 1_000_000 ether;

    function setUp() public {
        token = new VaultShareToken("Test Share", "TST", VAULT_ID, MAX_SUPPLY, owner);
    }

    // ============ Property 1: ERC-20 Compliance ============
    // Feature: mantle-migration, Property 1: ERC-20 Share Token Compliance

    function test_ERC20_name() public view {
        assertEq(token.name(), "Test Share");
    }

    function test_ERC20_symbol() public view {
        assertEq(token.symbol(), "TST");
    }

    function test_ERC20_decimals() public view {
        assertEq(token.decimals(), 18);
    }

    function test_ERC20_totalSupply() public {
        assertEq(token.totalSupply(), 0);
        token.mint(alice, 100 ether);
        assertEq(token.totalSupply(), 100 ether);
    }

    function test_ERC20_balanceOf() public {
        token.mint(alice, 100 ether);
        assertEq(token.balanceOf(alice), 100 ether);
        assertEq(token.balanceOf(bob), 0);
    }

    function test_ERC20_transfer() public {
        token.mint(alice, 100 ether);

        vm.prank(alice);
        bool success = token.transfer(bob, 50 ether);

        assertTrue(success);
        assertEq(token.balanceOf(alice), 50 ether);
        assertEq(token.balanceOf(bob), 50 ether);
    }

    function test_ERC20_approve_and_transferFrom() public {
        token.mint(alice, 100 ether);

        vm.prank(alice);
        token.approve(bob, 50 ether);

        assertEq(token.allowance(alice, bob), 50 ether);

        vm.prank(bob);
        bool success = token.transferFrom(alice, charlie, 30 ether);

        assertTrue(success);
        assertEq(token.balanceOf(alice), 70 ether);
        assertEq(token.balanceOf(charlie), 30 ether);
        assertEq(token.allowance(alice, bob), 20 ether);
    }

    // ============ Property 2: MaxSupply Enforcement ============
    // Feature: mantle-migration, Property 2: MaxSupply Enforcement

    function test_maxSupply_enforced() public {
        token.mint(alice, MAX_SUPPLY);
        assertEq(token.totalSupply(), MAX_SUPPLY);

        vm.expectRevert(
            abi.encodeWithSelector(VaultShareToken.MaxSupplyExceeded.selector, 1, 0)
        );
        token.mint(bob, 1);
    }

    function test_maxSupply_partial_mint() public {
        token.mint(alice, MAX_SUPPLY - 100);

        vm.expectRevert(
            abi.encodeWithSelector(VaultShareToken.MaxSupplyExceeded.selector, 200, 100)
        );
        token.mint(bob, 200);

        // Should succeed with exact remaining
        token.mint(bob, 100);
        assertEq(token.totalSupply(), MAX_SUPPLY);
    }

    function testFuzz_maxSupply_never_exceeded(uint256 amount1, uint256 amount2) public {
        // Feature: mantle-migration, Property 2: MaxSupply Enforcement
        amount1 = bound(amount1, 0, MAX_SUPPLY);
        amount2 = bound(amount2, 0, MAX_SUPPLY);

        token.mint(alice, amount1);

        uint256 remaining = MAX_SUPPLY - amount1;
        if (amount2 > remaining) {
            vm.expectRevert();
            token.mint(bob, amount2);
        } else {
            token.mint(bob, amount2);
        }

        // Invariant: totalSupply never exceeds maxSupply
        assertLe(token.totalSupply(), MAX_SUPPLY);
    }

    // ============ Property 7: Transfer Mode Enforcement ============
    // Feature: mantle-migration, Property 7: Transfer Mode Enforcement

    function test_transferMode_open() public {
        token.mint(alice, 100 ether);

        vm.prank(alice);
        token.transfer(bob, 50 ether);

        assertEq(token.balanceOf(bob), 50 ether);
    }

    function test_transferMode_paused() public {
        token.mint(alice, 100 ether);
        token.setTransferMode(IVaultShareToken.TransferMode.Paused);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                VaultShareToken.TransferNotAllowed.selector,
                alice,
                bob,
                IVaultShareToken.TransferMode.Paused
            )
        );
        token.transfer(bob, 50 ether);
    }

    function test_transferMode_paused_owner_can_transfer() public {
        token.mint(owner, 100 ether);
        token.setTransferMode(IVaultShareToken.TransferMode.Paused);

        // Owner can still transfer
        token.transfer(alice, 50 ether);
        assertEq(token.balanceOf(alice), 50 ether);
    }

    function test_transferMode_allowlist() public {
        token.mint(alice, 100 ether);
        token.setTransferMode(IVaultShareToken.TransferMode.Allowlist);

        // Not on allowlist - should fail
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(VaultShareToken.NotOnAllowlist.selector, alice)
        );
        token.transfer(bob, 50 ether);

        // Add both to allowlist
        token.addToAllowlist(alice);
        token.addToAllowlist(bob);

        // Now should succeed
        vm.prank(alice);
        token.transfer(bob, 50 ether);
        assertEq(token.balanceOf(bob), 50 ether);
    }

    function test_transferMode_allowlist_recipient_not_listed() public {
        token.mint(alice, 100 ether);
        token.setTransferMode(IVaultShareToken.TransferMode.Allowlist);
        token.addToAllowlist(alice);
        // bob not on allowlist

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(VaultShareToken.NotOnAllowlist.selector, bob)
        );
        token.transfer(bob, 50 ether);
    }

    function testFuzz_transferMode_enforcement(
        uint8 modeRaw,
        bool aliceAllowlisted,
        bool bobAllowlisted,
        uint256 amount
    ) public {
        // Feature: mantle-migration, Property 7: Transfer Mode Enforcement
        IVaultShareToken.TransferMode mode = IVaultShareToken.TransferMode(modeRaw % 3);
        amount = bound(amount, 1, 100 ether);

        token.mint(alice, 100 ether);
        token.setTransferMode(mode);

        if (aliceAllowlisted) token.addToAllowlist(alice);
        if (bobAllowlisted) token.addToAllowlist(bob);

        vm.prank(alice);

        if (mode == IVaultShareToken.TransferMode.Paused) {
            vm.expectRevert();
            token.transfer(bob, amount);
        } else if (mode == IVaultShareToken.TransferMode.Allowlist) {
            if (!aliceAllowlisted || !bobAllowlisted) {
                vm.expectRevert();
                token.transfer(bob, amount);
            } else {
                token.transfer(bob, amount);
                assertEq(token.balanceOf(bob), amount);
            }
        } else {
            // Open mode
            token.transfer(bob, amount);
            assertEq(token.balanceOf(bob), amount);
        }
    }

    // ============ Property 8: Authorized Minting Only ============
    // Feature: mantle-migration, Property 8: Authorized Minting Only

    function test_mint_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        token.mint(alice, 100 ether);
    }

    function test_mint_owner_succeeds() public {
        token.mint(alice, 100 ether);
        assertEq(token.balanceOf(alice), 100 ether);
    }

    function testFuzz_mint_onlyOwner(address caller, uint256 amount) public {
        // Feature: mantle-migration, Property 8: Authorized Minting Only
        vm.assume(caller != owner);
        vm.assume(caller != address(0));
        amount = bound(amount, 1, MAX_SUPPLY);

        vm.prank(caller);
        vm.expectRevert();
        token.mint(caller, amount);

        // Only owner can mint
        token.mint(alice, amount);
        assertEq(token.balanceOf(alice), amount);
    }

    // ============ Additional Tests ============

    function test_burn() public {
        token.mint(alice, 100 ether);
        token.burn(alice, 50 ether);
        assertEq(token.balanceOf(alice), 50 ether);
        assertEq(token.totalSupply(), 50 ether);
    }

    function test_vaultId() public view {
        assertEq(token.vaultId(), VAULT_ID);
    }

    function test_transferModeChanged_event() public {
        vm.expectEmit(true, true, true, true);
        emit IVaultShareToken.TransferModeChanged(
            IVaultShareToken.TransferMode.Open,
            IVaultShareToken.TransferMode.Paused
        );
        token.setTransferMode(IVaultShareToken.TransferMode.Paused);
    }

    function test_allowlist_events() public {
        vm.expectEmit(true, true, true, true);
        emit IVaultShareToken.AddedToAllowlist(alice);
        token.addToAllowlist(alice);

        vm.expectEmit(true, true, true, true);
        emit IVaultShareToken.RemovedFromAllowlist(alice);
        token.removeFromAllowlist(alice);
    }

    function test_isAllowlisted() public {
        assertFalse(token.isAllowlisted(alice));
        token.addToAllowlist(alice);
        assertTrue(token.isAllowlisted(alice));
        token.removeFromAllowlist(alice);
        assertFalse(token.isAllowlisted(alice));
    }

    // ============ Unlimited Supply Tests ============

    function test_unlimitedSupply() public {
        VaultShareToken unlimitedToken = new VaultShareToken(
            "Unlimited",
            "UNL",
            keccak256("unlimited-vault"),
            0, // 0 = unlimited
            owner
        );

        // Should be able to mint any amount
        unlimitedToken.mint(alice, type(uint256).max / 2);
        assertEq(unlimitedToken.balanceOf(alice), type(uint256).max / 2);
    }
}
