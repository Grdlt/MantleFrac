import { defineChain } from 'viem';

/**
 * Mantle Mainnet configuration
 */
export const mantleMainnet = defineChain({
  id: 5000,
  name: 'Mantle',
  nativeCurrency: {
    decimals: 18,
    name: 'Mantle',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.mantle.xyz'],
      webSocket: ['wss://ws.mantle.xyz'],
    },
    public: {
      http: ['https://rpc.mantle.xyz'],
      webSocket: ['wss://ws.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Explorer',
      url: 'https://explorer.mantle.xyz',
      apiUrl: 'https://explorer.mantle.xyz/api',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 304717,
    },
  },
});

/**
 * Mantle Sepolia Testnet configuration
 */
export const mantleSepoliaTestnet = defineChain({
  id: 5003,
  name: 'Mantle Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Mantle',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.mantle.xyz'],
      webSocket: ['wss://ws.sepolia.mantle.xyz'],
    },
    public: {
      http: ['https://rpc.sepolia.mantle.xyz'],
      webSocket: ['wss://ws.sepolia.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Sepolia Explorer',
      url: 'https://explorer.sepolia.mantle.xyz',
      apiUrl: 'https://explorer.sepolia.mantle.xyz/api',
    },
  },
  testnet: true,
});

/**
 * All supported chains
 */
export const supportedChains = [mantleMainnet, mantleSepoliaTestnet] as const;

/**
 * Default chain (testnet for development)
 */
export const defaultChain = mantleSepoliaTestnet;

/**
 * Chain IDs
 */
export const MANTLE_MAINNET_CHAIN_ID = 5000;
export const MANTLE_TESTNET_CHAIN_ID = 5003;

/**
 * Check if a chain ID is supported
 */
export function isSupportedChain(chainId: number): boolean {
  return supportedChains.some((chain) => chain.id === chainId);
}

/**
 * Get chain by ID
 */
export function getChainById(chainId: number) {
  return supportedChains.find((chain) => chain.id === chainId);
}
