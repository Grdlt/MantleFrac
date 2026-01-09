// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IConstantProductAMM.sol";

/**
 * @title ConstantProductAMM
 * @notice Constant product AMM (x * y = k) for share token trading
 * @dev Implements liquidity pools with LP token tracking
 */
contract ConstantProductAMM is IConstantProductAMM, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Minimum liquidity locked forever
    uint256 public constant MINIMUM_LIQUIDITY = 1000;

    /// @notice Mapping of pool ID to pool data
    mapping(bytes32 => Pool) private _pools;

    /// @notice Mapping of pool ID to LP balances
    mapping(bytes32 => mapping(address => uint256)) private _lpBalances;

    /// @notice Mapping of token pair to pool ID
    mapping(bytes32 => bytes32) private _pairToPool;

    /// @notice Protocol fee recipient
    address public feeRecipient;

    /// @notice Counter for generating unique pool IDs
    uint256 private _poolCounter;

    /// @notice Custom errors
    error PoolNotFound(bytes32 poolId);
    error PoolAlreadyExists(address tokenA, address tokenB);
    error InvalidAmount();
    error InvalidToken();
    error InsufficientLiquidity();
    error SlippageExceeded(uint256 expected, uint256 actual);
    error InsufficientLpBalance();
    error IdenticalTokens();
    error ZeroAddress();

    /// @notice Constructor
    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
    }

    /// @inheritdoc IConstantProductAMM
    function createPool(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 feeBps
    ) external nonReentrant returns (bytes32 poolId) {
        if (tokenA == address(0) || tokenB == address(0)) revert ZeroAddress();
        if (tokenA == tokenB) revert IdenticalTokens();
        if (amountA == 0 || amountB == 0) revert InvalidAmount();
        if (feeBps > 1000) revert InvalidAmount(); // Max 10%

        // Sort tokens for consistent pair key
        (address token0, address token1, uint256 amount0, uint256 amount1) = 
            tokenA < tokenB ? (tokenA, tokenB, amountA, amountB) : (tokenB, tokenA, amountB, amountA);

        // Check pool doesn't exist
        bytes32 pairKey = keccak256(abi.encodePacked(token0, token1));
        if (_pairToPool[pairKey] != bytes32(0)) revert PoolAlreadyExists(token0, token1);

        // Generate pool ID
        poolId = keccak256(abi.encodePacked(block.chainid, address(this), ++_poolCounter));

        // Transfer tokens
        IERC20(token0).safeTransferFrom(msg.sender, address(this), amount0);
        IERC20(token1).safeTransferFrom(msg.sender, address(this), amount1);

        // Calculate initial LP tokens (geometric mean)
        uint256 lpTokens = _sqrt(amount0 * amount1);
        if (lpTokens <= MINIMUM_LIQUIDITY) revert InsufficientLiquidity();

        // Lock minimum liquidity
        uint256 userLpTokens = lpTokens - MINIMUM_LIQUIDITY;

        // Create pool
        _pools[poolId] = Pool({
            tokenA: token0,
            tokenB: token1,
            reserveA: amount0,
            reserveB: amount1,
            totalLpSupply: lpTokens,
            feeBps: feeBps,
            createdAt: block.timestamp
        });

        // Update mappings
        _pairToPool[pairKey] = poolId;
        _lpBalances[poolId][address(0)] = MINIMUM_LIQUIDITY; // Locked
        _lpBalances[poolId][msg.sender] = userLpTokens;

        emit PoolCreated(poolId, token0, token1, amount0, amount1);
        emit LiquidityAdded(poolId, msg.sender, amount0, amount1, userLpTokens);
    }

    /// @inheritdoc IConstantProductAMM
    function addLiquidity(
        bytes32 poolId,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant returns (uint256 amountA, uint256 amountB, uint256 lpMinted) {
        Pool storage pool = _pools[poolId];
        if (pool.tokenA == address(0)) revert PoolNotFound(poolId);

        // Calculate optimal amounts
        if (pool.reserveA == 0 && pool.reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = (amountADesired * pool.reserveB) / pool.reserveA;
            if (amountBOptimal <= amountBDesired) {
                if (amountBOptimal < amountBMin) revert SlippageExceeded(amountBMin, amountBOptimal);
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = (amountBDesired * pool.reserveA) / pool.reserveB;
                if (amountAOptimal < amountAMin) revert SlippageExceeded(amountAMin, amountAOptimal);
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }

        // Transfer tokens
        IERC20(pool.tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(pool.tokenB).safeTransferFrom(msg.sender, address(this), amountB);

        // Calculate LP tokens to mint
        if (pool.totalLpSupply == 0) {
            lpMinted = _sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
            _lpBalances[poolId][address(0)] = MINIMUM_LIQUIDITY;
        } else {
            lpMinted = _min(
                (amountA * pool.totalLpSupply) / pool.reserveA,
                (amountB * pool.totalLpSupply) / pool.reserveB
            );
        }

        if (lpMinted == 0) revert InsufficientLiquidity();

        // Update state
        pool.reserveA += amountA;
        pool.reserveB += amountB;
        pool.totalLpSupply += lpMinted;
        _lpBalances[poolId][msg.sender] += lpMinted;

        emit LiquidityAdded(poolId, msg.sender, amountA, amountB, lpMinted);
    }

    /// @inheritdoc IConstantProductAMM
    function removeLiquidity(
        bytes32 poolId,
        uint256 lpAmount,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        Pool storage pool = _pools[poolId];
        if (pool.tokenA == address(0)) revert PoolNotFound(poolId);
        if (_lpBalances[poolId][msg.sender] < lpAmount) revert InsufficientLpBalance();

        // Calculate amounts to return
        amountA = (lpAmount * pool.reserveA) / pool.totalLpSupply;
        amountB = (lpAmount * pool.reserveB) / pool.totalLpSupply;

        if (amountA < amountAMin) revert SlippageExceeded(amountAMin, amountA);
        if (amountB < amountBMin) revert SlippageExceeded(amountBMin, amountB);

        // Update state
        _lpBalances[poolId][msg.sender] -= lpAmount;
        pool.totalLpSupply -= lpAmount;
        pool.reserveA -= amountA;
        pool.reserveB -= amountB;

        // Transfer tokens
        IERC20(pool.tokenA).safeTransfer(msg.sender, amountA);
        IERC20(pool.tokenB).safeTransfer(msg.sender, amountB);

        emit LiquidityRemoved(poolId, msg.sender, amountA, amountB, lpAmount);
    }

    /// @inheritdoc IConstantProductAMM
    function swap(
        bytes32 poolId,
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        Pool storage pool = _pools[poolId];
        if (pool.tokenA == address(0)) revert PoolNotFound(poolId);
        if (amountIn == 0) revert InvalidAmount();
        if (tokenIn != pool.tokenA && tokenIn != pool.tokenB) revert InvalidToken();

        bool isTokenA = tokenIn == pool.tokenA;
        (uint256 reserveIn, uint256 reserveOut) = isTokenA 
            ? (pool.reserveA, pool.reserveB) 
            : (pool.reserveB, pool.reserveA);

        // Calculate output with fee
        uint256 amountInWithFee = amountIn * (10000 - pool.feeBps);
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * 10000 + amountInWithFee);

        if (amountOut < minAmountOut) revert SlippageExceeded(minAmountOut, amountOut);
        if (amountOut >= reserveOut) revert InsufficientLiquidity();

        // Transfer input token
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Update reserves
        if (isTokenA) {
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
        }

        // Transfer output token
        address tokenOut = isTokenA ? pool.tokenB : pool.tokenA;
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);

        emit Swap(poolId, msg.sender, tokenIn, amountIn, tokenOut, amountOut);
    }

    /// @inheritdoc IConstantProductAMM
    function getPool(bytes32 poolId) external view returns (Pool memory pool) {
        pool = _pools[poolId];
        if (pool.tokenA == address(0)) revert PoolNotFound(poolId);
    }

    /// @inheritdoc IConstantProductAMM
    function getAmountOut(
        bytes32 poolId,
        address tokenIn,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        Pool storage pool = _pools[poolId];
        if (pool.tokenA == address(0)) revert PoolNotFound(poolId);
        if (tokenIn != pool.tokenA && tokenIn != pool.tokenB) revert InvalidToken();

        bool isTokenA = tokenIn == pool.tokenA;
        (uint256 reserveIn, uint256 reserveOut) = isTokenA 
            ? (pool.reserveA, pool.reserveB) 
            : (pool.reserveB, pool.reserveA);

        uint256 amountInWithFee = amountIn * (10000 - pool.feeBps);
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * 10000 + amountInWithFee);
    }

    /// @inheritdoc IConstantProductAMM
    function getLpBalance(bytes32 poolId, address account) external view returns (uint256 balance) {
        return _lpBalances[poolId][account];
    }

    /// @notice Gets pool by token pair
    /// @param tokenA First token
    /// @param tokenB Second token
    /// @return poolId The pool ID (bytes32(0) if not found)
    function getPoolByPair(address tokenA, address tokenB) external view returns (bytes32 poolId) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return _pairToPool[keccak256(abi.encodePacked(token0, token1))];
    }

    /// @notice Sets fee recipient
    /// @param _feeRecipient New fee recipient
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }

    /// @notice Square root using Babylonian method
    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    /// @notice Returns minimum of two values
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
