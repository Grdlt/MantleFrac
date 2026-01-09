// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Distributor.sol";
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

/// @notice Mock ERC20 for distribution
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
 * @title DistributorTest
 * @notice Tests for Distributor contract
 * @dev Feature: mantle-migration
 */
contract DistributorTest is Test {
    Distributor public distributor;
    MantleFracVault public vault;
    MockNFT public nft;
    MockUSDC public usdc;

    address public owner = address(this);
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);

    bytes32 public vaultId;
    address public shareToken;

    uint256 public constant MAX_SUPPLY = 1_000_000 ether;
    uint256 public constant DISTRIBUTION_AMOUNT = 10_000 * 1e6; // 10k USDC

    function setUp() public {
        vault = new MantleFracVault();
        distributor = new Distributor(address(vault));
        nft = new MockNFT();
        usdc = new MockUSDC();

        // Create a vault
        uint256 tokenId = nft.mint(alice);
        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        vaultId = vault.createVault(address(nft), tokenId, "TST", "Test Share", MAX_SUPPLY, "standard");

        // Mint shares to multiple holders
        vault.mintShares(vaultId, alice, 5000 ether); // 50%
        vault.mintShares(vaultId, bob, 3000 ether);   // 30%
        vault.mintShares(vaultId, charlie, 2000 ether); // 20%
        vm.stopPrank();

        shareToken = vault.getVault(vaultId).shareToken;

        // Mint USDC to alice (vault creator) for distributions
        usdc.mint(alice, DISTRIBUTION_AMOUNT * 10);
    }

    // Helper function to schedule distribution as alice (vault creator)
    function _scheduleDistribution(uint256 amount, uint256 startsAt, uint256 endsAt) internal returns (bytes32) {
        vm.startPrank(alice);
        usdc.approve(address(distributor), amount);
        bytes32 programId = distributor.scheduleDistribution(
            vaultId,
            address(usdc),
            amount,
            startsAt,
            endsAt
        );
        vm.stopPrank();
        return programId;
    }

    // ============ Property 13: Distribution No Double-Claim ============
    // Feature: mantle-migration, Property 13: Distribution No Double-Claim

    function test_claimPayout_noDoubleClaim() public {
        // Schedule distribution as alice (vault creator)
        bytes32 programId = _scheduleDistribution(DISTRIBUTION_AMOUNT, block.timestamp, block.timestamp + 30 days);

        // Alice claims
        vm.prank(alice);
        uint256 claimed = distributor.claimPayout(programId);
        assertGt(claimed, 0);

        // Alice tries to claim again - should fail
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(Distributor.AlreadyClaimed.selector, programId, alice)
        );
        distributor.claimPayout(programId);
    }

    function test_hasClaimed() public {
        bytes32 programId = _scheduleDistribution(DISTRIBUTION_AMOUNT, block.timestamp, block.timestamp + 30 days);

        assertFalse(distributor.hasClaimed(programId, alice));

        vm.prank(alice);
        distributor.claimPayout(programId);

        assertTrue(distributor.hasClaimed(programId, alice));
    }

    // ============ Property 14: Payout Proportional to Balance ============
    // Feature: mantle-migration, Property 14: Payout Proportional to Balance

    function test_claimPayout_proportional() public {
        bytes32 programId = _scheduleDistribution(DISTRIBUTION_AMOUNT, block.timestamp, block.timestamp + 30 days);

        // Get claimable amounts
        uint256 aliceClaimable = distributor.getClaimableAmount(programId, alice);
        uint256 bobClaimable = distributor.getClaimableAmount(programId, bob);
        uint256 charlieClaimable = distributor.getClaimableAmount(programId, charlie);

        // Alice has 50%, Bob 30%, Charlie 20%
        // Allow 1% tolerance for rounding
        assertApproxEqRel(aliceClaimable, DISTRIBUTION_AMOUNT * 50 / 100, 0.01e18);
        assertApproxEqRel(bobClaimable, DISTRIBUTION_AMOUNT * 30 / 100, 0.01e18);
        assertApproxEqRel(charlieClaimable, DISTRIBUTION_AMOUNT * 20 / 100, 0.01e18);
    }

    function testFuzz_claimPayout_proportional(
        uint256 aliceShare,
        uint256 bobShare,
        uint256 charlieShare,
        uint256 distributionAmount
    ) public {
        // Feature: mantle-migration, Property 14: Payout Proportional to Balance
        aliceShare = bound(aliceShare, 1 ether, 100_000 ether);
        bobShare = bound(bobShare, 1 ether, 100_000 ether);
        charlieShare = bound(charlieShare, 1 ether, 100_000 ether);
        distributionAmount = bound(distributionAmount, 1000 * 1e6, 1_000_000 * 1e6);

        // Create new vault with custom shares
        uint256 tokenId = nft.mint(alice);
        vm.startPrank(alice);
        nft.approve(address(vault), tokenId);
        bytes32 newVaultId = vault.createVault(address(nft), tokenId, "TST2", "Test Share 2", 0, "standard");
        vault.mintShares(newVaultId, alice, aliceShare);
        vault.mintShares(newVaultId, bob, bobShare);
        vault.mintShares(newVaultId, charlie, charlieShare);

        // Schedule distribution as alice (vault creator)
        usdc.mint(alice, distributionAmount);
        usdc.approve(address(distributor), distributionAmount);
        bytes32 programId = distributor.scheduleDistribution(
            newVaultId,
            address(usdc),
            distributionAmount,
            block.timestamp,
            block.timestamp + 30 days
        );
        vm.stopPrank();

        uint256 totalShares = aliceShare + bobShare + charlieShare;

        // Verify proportional claims
        uint256 aliceClaimable = distributor.getClaimableAmount(programId, alice);
        uint256 expectedAlice = (distributionAmount * aliceShare) / totalShares;

        // Allow 1% tolerance for rounding
        assertApproxEqRel(aliceClaimable, expectedAlice, 0.01e18);
    }

    // ============ Additional Tests ============

    function test_scheduleDistribution_emitsEvent() public {
        vm.startPrank(alice);
        usdc.approve(address(distributor), DISTRIBUTION_AMOUNT);

        vm.expectEmit(false, true, true, false);
        emit IDistributor.DistributionScheduled(
            bytes32(0),
            vaultId,
            address(usdc),
            DISTRIBUTION_AMOUNT,
            block.timestamp,
            block.timestamp + 30 days,
            block.number
        );

        distributor.scheduleDistribution(
            vaultId,
            address(usdc),
            DISTRIBUTION_AMOUNT,
            block.timestamp,
            block.timestamp + 30 days
        );
        vm.stopPrank();
    }

    function test_claimPayout_beforeStart() public {
        bytes32 programId = _scheduleDistribution(DISTRIBUTION_AMOUNT, block.timestamp + 1 days, block.timestamp + 30 days);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(Distributor.ProgramNotStarted.selector, programId, block.timestamp + 1 days)
        );
        distributor.claimPayout(programId);
    }

    function test_claimPayout_afterEnd() public {
        bytes32 programId = _scheduleDistribution(DISTRIBUTION_AMOUNT, block.timestamp, block.timestamp + 1 days);

        // Fast forward past end
        vm.warp(block.timestamp + 2 days);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(Distributor.ProgramEnded.selector, programId, block.timestamp - 1 days)
        );
        distributor.claimPayout(programId);
    }

    function test_claimMultiple() public {
        // Schedule two distributions as alice
        bytes32 programId1 = _scheduleDistribution(DISTRIBUTION_AMOUNT, block.timestamp, block.timestamp + 30 days);
        bytes32 programId2 = _scheduleDistribution(DISTRIBUTION_AMOUNT, block.timestamp, block.timestamp + 30 days);

        bytes32[] memory programIds = new bytes32[](2);
        programIds[0] = programId1;
        programIds[1] = programId2;

        uint256 aliceUsdcBefore = usdc.balanceOf(alice);

        vm.prank(alice);
        uint256[] memory amounts = distributor.claimMultiple(programIds);

        assertEq(amounts.length, 2);
        assertGt(amounts[0], 0);
        assertGt(amounts[1], 0);
        assertEq(usdc.balanceOf(alice), aliceUsdcBefore + amounts[0] + amounts[1]);
    }

    function test_getProgramsByVault() public {
        _scheduleDistribution(DISTRIBUTION_AMOUNT, block.timestamp, block.timestamp + 30 days);
        _scheduleDistribution(DISTRIBUTION_AMOUNT, block.timestamp, block.timestamp + 30 days);
        _scheduleDistribution(DISTRIBUTION_AMOUNT, block.timestamp, block.timestamp + 30 days);

        bytes32[] memory programs = distributor.getProgramsByVault(vaultId);
        assertEq(programs.length, 3);
    }

    function test_getProgram() public {
        uint256 startsAt = block.timestamp;
        uint256 endsAt = block.timestamp + 30 days;

        bytes32 programId = _scheduleDistribution(DISTRIBUTION_AMOUNT, startsAt, endsAt);

        IDistributor.Program memory program = distributor.getProgram(programId);

        assertEq(program.vaultId, vaultId);
        assertEq(program.asset, address(usdc));
        assertEq(program.totalAmount, DISTRIBUTION_AMOUNT);
        assertEq(program.claimedAmount, 0);
        assertEq(program.startsAt, startsAt);
        assertEq(program.endsAt, endsAt);
        assertTrue(program.active);
    }

    function test_cancelDistribution() public {
        bytes32 programId = _scheduleDistribution(DISTRIBUTION_AMOUNT, block.timestamp, block.timestamp + 30 days);

        // Alice claims her portion
        vm.prank(alice);
        distributor.claimPayout(programId);

        uint256 aliceUsdcBefore = usdc.balanceOf(alice);

        // Cancel distribution (alice is vault creator)
        vm.prank(alice);
        distributor.cancelDistribution(programId);

        // Remaining funds returned to alice (vault creator)
        uint256 aliceUsdcAfter = usdc.balanceOf(alice);
        assertGt(aliceUsdcAfter, aliceUsdcBefore);

        // Program should be inactive
        IDistributor.Program memory program = distributor.getProgram(programId);
        assertFalse(program.active);
    }
}
