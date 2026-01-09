'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { type Address } from 'viem';
import { getContractAddresses } from '@/lib/contracts';
import { MARKETPLACE_ABI } from '@/lib/abis';

/**
 * Listing status enum matching the contract
 */
export enum ListingStatus {
  Open = 0,
  Filled = 1,
  Cancelled = 2,
  Expired = 3,
}

/**
 * Listing data structure
 */
export interface Listing {
  vaultId: `0x${string}`;
  seller: Address;
  shareToken: Address;
  shareAmount: bigint;
  priceAsset: Address;
  priceAmount: bigint;
  status: ListingStatus;
  createdAt: bigint;
  expiresAt: bigint;
}

/**
 * Hook for reading listing data
 */
export function useListingRead(listingId: `0x${string}` | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { data, isLoading, error, refetch } = useReadContract({
    address: addresses?.marketplace,
    abi: MARKETPLACE_ABI,
    functionName: 'getListing',
    args: listingId ? [listingId] : undefined,
    query: {
      enabled: !!listingId && !!addresses,
    },
  });

  return {
    listing: data as Listing | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting listings by vault
 */
export function useListingsByVault(vaultId: `0x${string}` | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { data, isLoading, error, refetch } = useReadContract({
    address: addresses?.marketplace,
    abi: MARKETPLACE_ABI,
    functionName: 'getListingsByVault',
    args: vaultId ? [vaultId] : undefined,
    query: {
      enabled: !!vaultId && !!addresses,
    },
  });

  return {
    listingIds: data as `0x${string}`[] | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting listings by seller
 */
export function useListingsBySeller(seller: Address | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { data, isLoading, error, refetch } = useReadContract({
    address: addresses?.marketplace,
    abi: MARKETPLACE_ABI,
    functionName: 'getListingsBySeller',
    args: seller ? [seller] : undefined,
    query: {
      enabled: !!seller && !!addresses,
    },
  });

  return {
    listingIds: data as `0x${string}`[] | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for creating a listing
 */
export function useCreateListing() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createListing = async (params: {
    vaultId: `0x${string}`;
    shareAmount: bigint;
    priceAsset: Address;
    priceAmount: bigint;
    duration: bigint;
  }) => {
    if (!addresses) throw new Error('Contract addresses not found');

    writeContract({
      address: addresses.marketplace,
      abi: MARKETPLACE_ABI,
      functionName: 'createListing',
      args: [
        params.vaultId,
        params.shareAmount,
        params.priceAsset,
        params.priceAmount,
        params.duration,
      ],
    });
  };

  return {
    createListing,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook for filling a listing
 */
export function useFillListing() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const fillListing = async (listingId: `0x${string}`) => {
    if (!addresses) throw new Error('Contract addresses not found');

    writeContract({
      address: addresses.marketplace,
      abi: MARKETPLACE_ABI,
      functionName: 'fillListing',
      args: [listingId],
    });
  };

  return {
    fillListing,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook for cancelling a listing
 */
export function useCancelListing() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const cancelListing = async (listingId: `0x${string}`) => {
    if (!addresses) throw new Error('Contract addresses not found');

    writeContract({
      address: addresses.marketplace,
      abi: MARKETPLACE_ABI,
      functionName: 'cancelListing',
      args: [listingId],
    });
  };

  return {
    cancelListing,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
