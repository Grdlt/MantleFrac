'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useAccount } from 'wagmi';
import { type Address } from 'viem';
import { getContractAddresses } from '@/lib/contracts';
import { DISTRIBUTOR_ABI } from '@/lib/abis';

/**
 * Distribution program data structure
 */
export interface Program {
  vaultId: `0x${string}`;
  asset: Address;
  totalAmount: bigint;
  claimedAmount: bigint;
  startsAt: bigint;
  endsAt: bigint;
  snapshotBlock: bigint;
  active: boolean;
}

/**
 * Hook for reading program data
 */
export function useProgramRead(programId: `0x${string}` | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { data, isLoading, error, refetch } = useReadContract({
    address: addresses?.distributor,
    abi: DISTRIBUTOR_ABI,
    functionName: 'getProgram',
    args: programId ? [programId] : undefined,
    query: {
      enabled: !!programId && !!addresses,
    },
  });

  return {
    program: data as Program | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting programs by vault
 */
export function useProgramsByVault(vaultId: `0x${string}` | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { data, isLoading, error, refetch } = useReadContract({
    address: addresses?.distributor,
    abi: DISTRIBUTOR_ABI,
    functionName: 'getProgramsByVault',
    args: vaultId ? [vaultId] : undefined,
    query: {
      enabled: !!vaultId && !!addresses,
    },
  });

  return {
    programIds: data as `0x${string}`[] | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting claimable amount
 */
export function useClaimableAmount(programId: `0x${string}` | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: addresses?.distributor,
    abi: DISTRIBUTOR_ABI,
    functionName: 'getClaimableAmount',
    args: programId && address ? [programId, address] : undefined,
    query: {
      enabled: !!programId && !!address && !!addresses,
    },
  });

  return {
    claimableAmount: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for checking if user has claimed
 */
export function useHasClaimed(programId: `0x${string}` | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: addresses?.distributor,
    abi: DISTRIBUTOR_ABI,
    functionName: 'hasClaimed',
    args: programId && address ? [programId, address] : undefined,
    query: {
      enabled: !!programId && !!address && !!addresses,
    },
  });

  return {
    hasClaimed: data as boolean | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for scheduling a distribution
 */
export function useScheduleDistribution() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const scheduleDistribution = async (params: {
    vaultId: `0x${string}`;
    asset: Address;
    totalAmount: bigint;
    startsAt: bigint;
    endsAt: bigint;
  }) => {
    if (!addresses) throw new Error('Contract addresses not found');

    writeContract({
      address: addresses.distributor,
      abi: DISTRIBUTOR_ABI,
      functionName: 'scheduleDistribution',
      args: [params.vaultId, params.asset, params.totalAmount, params.startsAt, params.endsAt],
    });
  };

  return {
    scheduleDistribution,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook for claiming payout
 */
export function useClaimPayout() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimPayout = async (programId: `0x${string}`) => {
    if (!addresses) throw new Error('Contract addresses not found');

    writeContract({
      address: addresses.distributor,
      abi: DISTRIBUTOR_ABI,
      functionName: 'claimPayout',
      args: [programId],
    });
  };

  return {
    claimPayout,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook for claiming multiple payouts
 */
export function useClaimMultiple() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimMultiple = async (programIds: `0x${string}`[]) => {
    if (!addresses) throw new Error('Contract addresses not found');

    writeContract({
      address: addresses.distributor,
      abi: DISTRIBUTOR_ABI,
      functionName: 'claimMultiple',
      args: [programIds],
    });
  };

  return {
    claimMultiple,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
