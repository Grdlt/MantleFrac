'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { type Address, type Hash } from 'viem';
import { getContractAddresses } from '@/lib/contracts';
import { MANTLE_FRAC_VAULT_ABI } from '@/lib/abis';

/**
 * Vault state enum matching the contract
 */
export enum VaultState {
  Open = 0,
  Paused = 1,
  Redeemed = 2,
}

/**
 * Vault data structure
 */
export interface Vault {
  nftContract: Address;
  tokenId: bigint;
  shareToken: Address;
  creator: Address;
  custodian: Address;
  policy: string;
  state: VaultState;
  maxSupply: bigint;
  createdAt: bigint;
}

/**
 * Hook for reading vault data
 */
export function useVaultRead(vaultId: `0x${string}` | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { data, isLoading, error, refetch } = useReadContract({
    address: addresses?.mantleFracVault,
    abi: MANTLE_FRAC_VAULT_ABI,
    functionName: 'getVault',
    args: vaultId ? [vaultId] : undefined,
    query: {
      enabled: !!vaultId && !!addresses,
    },
  });

  return {
    vault: data as Vault | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for checking if vault exists
 */
export function useVaultExists(vaultId: `0x${string}` | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { data, isLoading, error } = useReadContract({
    address: addresses?.mantleFracVault,
    abi: MANTLE_FRAC_VAULT_ABI,
    functionName: 'vaultExists',
    args: vaultId ? [vaultId] : undefined,
    query: {
      enabled: !!vaultId && !!addresses,
    },
  });

  return {
    exists: data as boolean | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook for creating a vault
 */
export function useCreateVault() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createVault = async (params: {
    nftContract: Address;
    tokenId: bigint;
    shareSymbol: string;
    shareName: string;
    maxSupply: bigint;
    policy: string;
  }) => {
    if (!addresses) throw new Error('Contract addresses not found');

    writeContract({
      address: addresses.mantleFracVault,
      abi: MANTLE_FRAC_VAULT_ABI,
      functionName: 'createVault',
      args: [
        params.nftContract,
        params.tokenId,
        params.shareSymbol,
        params.shareName,
        params.maxSupply,
        params.policy,
      ],
    });
  };

  return {
    createVault,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook for redeeming a vault
 */
export function useRedeemVault() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const redeemVault = async (vaultId: `0x${string}`) => {
    if (!addresses) throw new Error('Contract addresses not found');

    writeContract({
      address: addresses.mantleFracVault,
      abi: MANTLE_FRAC_VAULT_ABI,
      functionName: 'redeemVault',
      args: [vaultId],
    });
  };

  return {
    redeemVault,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
