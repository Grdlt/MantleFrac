import { Address } from 'viem';
import { MANTLE_MAINNET_CHAIN_ID, MANTLE_TESTNET_CHAIN_ID } from './chains';

/**
 * Contract addresses per network
 */
export interface ContractAddresses {
  mantleFracVault: Address;
  marketplace: Address;
  constantProductAMM: Address;
  distributor: Address;
}

/**
 * Contract addresses by chain ID
 * Deployed to Mantle Sepolia Testnet (chainId: 5003)
 * Deployment TX: 0xe821bb967e4b4f618493b3cd526e90a764f17d4ee0e4841e10186f09f55800a9
 */
export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  [MANTLE_TESTNET_CHAIN_ID]: {
    mantleFracVault: '0xCc59F6FC768612659BEB827c0345c65F1C7ABe17' as Address,
    marketplace: '0x751dC26E9d66aC60B29D395a11C96523ACd94487' as Address,
    constantProductAMM: '0x293fA675B73931a20F30b0c68A18d3cd39cF9Af0' as Address,
    distributor: '0x7E871dfEBAEC9E3e9f2458E5B5Fd90F3283356cD' as Address,
  },
  [MANTLE_MAINNET_CHAIN_ID]: {
    mantleFracVault: '0x0000000000000000000000000000000000000000' as Address,
    marketplace: '0x0000000000000000000000000000000000000000' as Address,
    constantProductAMM: '0x0000000000000000000000000000000000000000' as Address,
    distributor: '0x0000000000000000000000000000000000000000' as Address,
  },
};

/**
 * Get contract addresses for a chain
 */
export function getContractAddresses(chainId: number): ContractAddresses | undefined {
  return CONTRACT_ADDRESSES[chainId];
}

/**
 * Common token addresses on Mantle
 */
export const COMMON_TOKENS: Record<number, Record<string, Address>> = {
  [MANTLE_TESTNET_CHAIN_ID]: {
    USDC: '0x0000000000000000000000000000000000000000' as Address, // TODO: Add testnet USDC
    USDT: '0x0000000000000000000000000000000000000000' as Address, // TODO: Add testnet USDT
    WETH: '0x0000000000000000000000000000000000000000' as Address, // TODO: Add testnet WETH
  },
  [MANTLE_MAINNET_CHAIN_ID]: {
    USDC: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9' as Address, // Mantle USDC
    USDT: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE' as Address, // Mantle USDT
    WETH: '0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111' as Address, // Mantle WETH
    WMNT: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8' as Address, // Wrapped MNT
  },
};
