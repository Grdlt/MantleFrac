'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useAccount } from 'wagmi';
import { type Address } from 'viem';
import { getContractAddresses } from '@/lib/contracts';
import { CONSTANT_PRODUCT_AMM_ABI } from '@/lib/abis';

/**
 * Pool data structure
 */
export interface Pool {
  tokenA: Address;
  tokenB: Address;
  reserveA: bigint;
  reserveB: bigint;
  totalLpSupply: bigint;
  feeBps: bigint;
  createdAt: bigint;
}

/**
 * Hook for reading pool data
 */
export function usePoolRead(poolId: `0x${string}` | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { data, isLoading, error, refetch } = useReadContract({
    address: addresses?.constantProductAMM,
    abi: CONSTANT_PRODUCT_AMM_ABI,
    functionName: 'getPool',
    args: poolId ? [poolId] : undefined,
    query: {
      enabled: !!poolId && !!addresses,
    },
  });

  return {
    pool: data as Pool | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting LP balance
 */
export function useLpBalance(poolId: `0x${string}` | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: addresses?.constantProductAMM,
    abi: CONSTANT_PRODUCT_AMM_ABI,
    functionName: 'getLpBalance',
    args: poolId && address ? [poolId, address] : undefined,
    query: {
      enabled: !!poolId && !!address && !!addresses,
    },
  });

  return {
    balance: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting swap output amount
 */
export function useAmountOut(
  poolId: `0x${string}` | undefined,
  tokenIn: Address | undefined,
  amountIn: bigint | undefined
) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { data, isLoading, error, refetch } = useReadContract({
    address: addresses?.constantProductAMM,
    abi: CONSTANT_PRODUCT_AMM_ABI,
    functionName: 'getAmountOut',
    args: poolId && tokenIn && amountIn ? [poolId, tokenIn, amountIn] : undefined,
    query: {
      enabled: !!poolId && !!tokenIn && amountIn !== undefined && !!addresses,
    },
  });

  return {
    amountOut: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for creating a pool
 */
export function useCreatePool() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createPool = async (params: {
    tokenA: Address;
    tokenB: Address;
    amountA: bigint;
    amountB: bigint;
    feeBps: bigint;
  }) => {
    if (!addresses) throw new Error('Contract addresses not found');

    writeContract({
      address: addresses.constantProductAMM,
      abi: CONSTANT_PRODUCT_AMM_ABI,
      functionName: 'createPool',
      args: [params.tokenA, params.tokenB, params.amountA, params.amountB, params.feeBps],
    });
  };

  return {
    createPool,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook for adding liquidity
 */
export function useAddLiquidity() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const addLiquidity = async (params: {
    poolId: `0x${string}`;
    amountADesired: bigint;
    amountBDesired: bigint;
    amountAMin: bigint;
    amountBMin: bigint;
  }) => {
    if (!addresses) throw new Error('Contract addresses not found');

    writeContract({
      address: addresses.constantProductAMM,
      abi: CONSTANT_PRODUCT_AMM_ABI,
      functionName: 'addLiquidity',
      args: [
        params.poolId,
        params.amountADesired,
        params.amountBDesired,
        params.amountAMin,
        params.amountBMin,
      ],
    });
  };

  return {
    addLiquidity,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook for removing liquidity
 */
export function useRemoveLiquidity() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const removeLiquidity = async (params: {
    poolId: `0x${string}`;
    lpAmount: bigint;
    amountAMin: bigint;
    amountBMin: bigint;
  }) => {
    if (!addresses) throw new Error('Contract addresses not found');

    writeContract({
      address: addresses.constantProductAMM,
      abi: CONSTANT_PRODUCT_AMM_ABI,
      functionName: 'removeLiquidity',
      args: [params.poolId, params.lpAmount, params.amountAMin, params.amountBMin],
    });
  };

  return {
    removeLiquidity,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook for swapping tokens
 */
export function useSwap() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const swap = async (params: {
    poolId: `0x${string}`;
    tokenIn: Address;
    amountIn: bigint;
    minAmountOut: bigint;
  }) => {
    if (!addresses) throw new Error('Contract addresses not found');

    writeContract({
      address: addresses.constantProductAMM,
      abi: CONSTANT_PRODUCT_AMM_ABI,
      functionName: 'swap',
      args: [params.poolId, params.tokenIn, params.amountIn, params.minAmountOut],
    });
  };

  return {
    swap,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
