// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IConstantProductAMM
 * @notice Interface for the constant product AMM (x * y = k)
 * @dev Provides liquidity pools for share token trading
 */
interface IConstantProductAMM {
    /// @notice Pool data structure
    struct Pool {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLpSupply;
        uint256 feeBps;
        uint256 createdAt;
    }

    /// @notice Emitted when a pool is created
    event PoolCreated(
        bytes32 indexed poolId, address indexed tokenA, address indexed tokenB, uint256 reserveA, uint256 reserveB
    );

    /// @notice Emitted when liquidity is added
    event LiquidityAdded(
        bytes32 indexed poolId, address indexed provider, uint256 amountA, uint256 amountB, uint256 lpMinted
    );

    /// @notice Emitted when liquidity is removed
    event LiquidityRemoved(
        bytes32 indexed poolId, address indexed provider, uint256 amountA, uint256 amountB, uint256 lpBurned
    );

    /// @notice Emitted when a swap occurs
    event Swap(
        bytes32 indexed poolId,
        address indexed trader,
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        uint256 amountOut
    );

    /// @notice Creates a new liquidity pool
    /// @param tokenA First token address
    /// @param tokenB Second token address
    /// @param amountA Initial amount of tokenA
    /// @param amountB Initial amount of tokenB
    /// @param feeBps Fee in basis points (e.g., 30 = 0.3%)
    /// @return poolId The created pool ID
    function createPool(address tokenA, address tokenB, uint256 amountA, uint256 amountB, uint256 feeBps)
        external
        returns (bytes32 poolId);

    /// @notice Adds liquidity to a pool
    /// @param poolId The pool ID
    /// @param amountADesired Desired amount of tokenA
    /// @param amountBDesired Desired amount of tokenB
    /// @param amountAMin Minimum amount of tokenA
    /// @param amountBMin Minimum amount of tokenB
    /// @return amountA Actual amount of tokenA added
    /// @return amountB Actual amount of tokenB added
    /// @return lpMinted Amount of LP tokens minted
    function addLiquidity(
        bytes32 poolId,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) external returns (uint256 amountA, uint256 amountB, uint256 lpMinted);

    /// @notice Removes liquidity from a pool
    /// @param poolId The pool ID
    /// @param lpAmount Amount of LP tokens to burn
    /// @param amountAMin Minimum amount of tokenA to receive
    /// @param amountBMin Minimum amount of tokenB to receive
    /// @return amountA Amount of tokenA received
    /// @return amountB Amount of tokenB received
    function removeLiquidity(bytes32 poolId, uint256 lpAmount, uint256 amountAMin, uint256 amountBMin)
        external
        returns (uint256 amountA, uint256 amountB);

    /// @notice Swaps tokens
    /// @param poolId The pool ID
    /// @param tokenIn Input token address
    /// @param amountIn Amount of input tokens
    /// @param minAmountOut Minimum output amount (slippage protection)
    /// @return amountOut Amount of output tokens received
    function swap(bytes32 poolId, address tokenIn, uint256 amountIn, uint256 minAmountOut)
        external
        returns (uint256 amountOut);

    /// @notice Gets pool information
    /// @param poolId The pool ID
    /// @return pool The pool data
    function getPool(bytes32 poolId) external view returns (Pool memory pool);

    /// @notice Calculates output amount for a swap
    /// @param poolId The pool ID
    /// @param tokenIn Input token address
    /// @param amountIn Input amount
    /// @return amountOut Expected output amount
    function getAmountOut(bytes32 poolId, address tokenIn, uint256 amountIn) external view returns (uint256 amountOut);

    /// @notice Gets LP token balance
    /// @param poolId The pool ID
    /// @param account The account address
    /// @return balance LP token balance
    function getLpBalance(bytes32 poolId, address account) external view returns (uint256 balance);
}
