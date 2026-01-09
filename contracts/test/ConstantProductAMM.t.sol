// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ConstantProductAMM.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Mock ERC20 for testing
contract MockToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @title ConstantProductAMMTest
 * @notice Tests for ConstantProductAMM contract
 * @dev Feature: mantle-migration
 */
contract ConstantProductAMMTest is Test {
    ConstantProductAMM public amm;
    MockToken public tokenA;
    MockToken public tokenB;

    address public owner = address(this);
    address public alice = address(0x1);
    address public bob = address(0x2);

    uint256 public constant INITIAL_A = 10_000 ether;
    uint256 public constant INITIAL_B = 10_000 ether;
    uint256 public constant FEE_BPS = 30; // 0.3%

    bytes32 public poolId;

    function setUp() public {
        amm = new ConstantProductAMM(owner);
        tokenA = new MockToken("Token A", "TKA");
        tokenB = new MockToken("Token B", "TKB");

        // Mint tokens to alice
        tokenA.mint(alice, 100_000 ether);
        tokenB.mint(alice, 100_000 ether);

        // Mint tokens to bob
        tokenA.mint(bob, 100_000 ether);
        tokenB.mint(bob, 100_000 ether);

        // Alice creates pool
        vm.startPrank(alice);
        tokenA.approve(address(amm), INITIAL_A);
        tokenB.approve(address(amm), INITIAL_B);
        poolId = amm.createPool(address(tokenA), address(tokenB), INITIAL_A, INITIAL_B, FEE_BPS);
        vm.stopPrank();
    }

    // ============ Property 11: AMM Constant Product Invariant ============
    // Feature: mantle-migration, Property 11: AMM Constant Product Invariant

    function test_swap_maintainsInvariant() public {
        IConstantProductAMM.Pool memory poolBefore = amm.getPool(poolId);
        uint256 kBefore = poolBefore.reserveA * poolBefore.reserveB;

        uint256 swapAmount = 100 ether;

        vm.startPrank(bob);
        tokenA.approve(address(amm), swapAmount);
        amm.swap(poolId, address(tokenA), swapAmount, 0);
        vm.stopPrank();

        IConstantProductAMM.Pool memory poolAfter = amm.getPool(poolId);
        uint256 kAfter = poolAfter.reserveA * poolAfter.reserveB;

        // k should increase or stay same (due to fees)
        assertGe(kAfter, kBefore);
    }

    function testFuzz_swap_maintainsInvariant(uint256 swapAmount) public {
        // Feature: mantle-migration, Property 11: AMM Constant Product Invariant
        swapAmount = bound(swapAmount, 1 ether, 1000 ether);

        IConstantProductAMM.Pool memory poolBefore = amm.getPool(poolId);
        uint256 kBefore = poolBefore.reserveA * poolBefore.reserveB;

        vm.startPrank(bob);
        tokenA.approve(address(amm), swapAmount);
        amm.swap(poolId, address(tokenA), swapAmount, 0);
        vm.stopPrank();

        IConstantProductAMM.Pool memory poolAfter = amm.getPool(poolId);
        uint256 kAfter = poolAfter.reserveA * poolAfter.reserveB;

        // Invariant: k never decreases
        assertGe(kAfter, kBefore);
    }

    function test_swap_outputCalculation() public {
        uint256 swapAmount = 100 ether;

        // Calculate expected output
        uint256 expectedOut = amm.getAmountOut(poolId, address(tokenA), swapAmount);

        uint256 bobBBefore = tokenB.balanceOf(bob);

        vm.startPrank(bob);
        tokenA.approve(address(amm), swapAmount);
        uint256 actualOut = amm.swap(poolId, address(tokenA), swapAmount, 0);
        vm.stopPrank();

        assertEq(actualOut, expectedOut);
        assertEq(tokenB.balanceOf(bob), bobBBefore + actualOut);
    }

    // ============ Property 12: Liquidity Round-Trip ============
    // Feature: mantle-migration, Property 12: Liquidity Round-Trip

    function test_addRemoveLiquidity_roundTrip() public {
        uint256 addAmountA = 1000 ether;
        uint256 addAmountB = 1000 ether;

        uint256 aliceABefore = tokenA.balanceOf(alice);
        uint256 aliceBBefore = tokenB.balanceOf(alice);

        vm.startPrank(alice);
        tokenA.approve(address(amm), addAmountA);
        tokenB.approve(address(amm), addAmountB);
        (uint256 actualA, uint256 actualB, uint256 lpMinted) = amm.addLiquidity(
            poolId, addAmountA, addAmountB, 0, 0
        );

        // Remove all liquidity
        (uint256 removedA, uint256 removedB) = amm.removeLiquidity(poolId, lpMinted, 0, 0);
        vm.stopPrank();

        // Should get back approximately what was added (minus rounding)
        assertApproxEqRel(removedA, actualA, 0.01e18); // 1% tolerance
        assertApproxEqRel(removedB, actualB, 0.01e18);
    }

    function testFuzz_addRemoveLiquidity_roundTrip(uint256 addAmount) public {
        // Feature: mantle-migration, Property 12: Liquidity Round-Trip
        addAmount = bound(addAmount, 100 ether, 10_000 ether);

        vm.startPrank(alice);
        tokenA.approve(address(amm), addAmount);
        tokenB.approve(address(amm), addAmount);
        (uint256 actualA, uint256 actualB, uint256 lpMinted) = amm.addLiquidity(
            poolId, addAmount, addAmount, 0, 0
        );

        (uint256 removedA, uint256 removedB) = amm.removeLiquidity(poolId, lpMinted, 0, 0);
        vm.stopPrank();

        // Invariant: removed amounts should be close to added amounts
        assertApproxEqRel(removedA, actualA, 0.01e18);
        assertApproxEqRel(removedB, actualB, 0.01e18);
    }

    // ============ Additional Tests ============

    function test_createPool_emitsEvent() public {
        MockToken tokenC = new MockToken("Token C", "TKC");
        MockToken tokenD = new MockToken("Token D", "TKD");

        tokenC.mint(alice, 1000 ether);
        tokenD.mint(alice, 1000 ether);

        vm.startPrank(alice);
        tokenC.approve(address(amm), 1000 ether);
        tokenD.approve(address(amm), 1000 ether);

        vm.expectEmit(false, true, true, false);
        emit IConstantProductAMM.PoolCreated(bytes32(0), address(tokenC), address(tokenD), 1000 ether, 1000 ether);

        amm.createPool(address(tokenC), address(tokenD), 1000 ether, 1000 ether, FEE_BPS);
        vm.stopPrank();
    }

    function test_swap_slippageProtection() public {
        uint256 swapAmount = 100 ether;
        uint256 expectedOut = amm.getAmountOut(poolId, address(tokenA), swapAmount);

        vm.startPrank(bob);
        tokenA.approve(address(amm), swapAmount);

        // Set minAmountOut higher than expected - should fail
        vm.expectRevert(
            abi.encodeWithSelector(
                ConstantProductAMM.SlippageExceeded.selector,
                expectedOut + 1,
                expectedOut
            )
        );
        amm.swap(poolId, address(tokenA), swapAmount, expectedOut + 1);
        vm.stopPrank();
    }

    function test_swap_invalidToken() public {
        MockToken tokenC = new MockToken("Token C", "TKC");
        tokenC.mint(bob, 1000 ether);

        vm.startPrank(bob);
        tokenC.approve(address(amm), 100 ether);

        vm.expectRevert(
            abi.encodeWithSelector(ConstantProductAMM.InvalidToken.selector)
        );
        amm.swap(poolId, address(tokenC), 100 ether, 0);
        vm.stopPrank();
    }

    function test_getLpBalance() public {
        uint256 lpBalance = amm.getLpBalance(poolId, alice);
        assertGt(lpBalance, 0);

        uint256 bobLpBalance = amm.getLpBalance(poolId, bob);
        assertEq(bobLpBalance, 0);
    }

    function test_addLiquidity_proportional() public {
        // Add liquidity with different ratio - should adjust
        vm.startPrank(bob);
        tokenA.approve(address(amm), 2000 ether);
        tokenB.approve(address(amm), 1000 ether);

        (uint256 actualA, uint256 actualB, ) = amm.addLiquidity(
            poolId, 2000 ether, 1000 ether, 0, 0
        );
        vm.stopPrank();

        // Should add proportionally (1:1 ratio in this pool)
        assertEq(actualA, actualB);
    }

    function test_removeLiquidity_insufficientLp() public {
        uint256 lpBalance = amm.getLpBalance(poolId, alice);

        vm.startPrank(alice);
        vm.expectRevert();
        amm.removeLiquidity(poolId, lpBalance + 1, 0, 0);
        vm.stopPrank();
    }

    function test_getPool() public view {
        IConstantProductAMM.Pool memory pool = amm.getPool(poolId);

        assertEq(pool.tokenA, address(tokenA));
        assertEq(pool.tokenB, address(tokenB));
        assertEq(pool.reserveA, INITIAL_A);
        assertEq(pool.reserveB, INITIAL_B);
        assertEq(pool.feeBps, FEE_BPS);
        assertGt(pool.totalLpSupply, 0);
    }
}
