/**
 * Configuration for MantleFrac EVM Indexer
 */

export const ENV = {
  // Network configuration
  NETWORK: process.env.NETWORK || 'mantle-testnet',
  RPC_URL: process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz',
  CHAIN_ID: Number(process.env.CHAIN_ID || '5003'),
  
  // Contract addresses (deployed to Mantle Sepolia Testnet)
  // Block: 33153271-33153279
  VAULT_ADDRESS: process.env.VAULT_ADDRESS || '0xCc59F6FC768612659BEB827c0345c65F1C7ABe17',
  MARKETPLACE_ADDRESS: process.env.MARKETPLACE_ADDRESS || '0x751dC26E9d66aC60B29D395a11C96523ACd94487',
  AMM_ADDRESS: process.env.AMM_ADDRESS || '0x293fA675B73931a20F30b0c68A18d3cd39cF9Af0',
  DISTRIBUTOR_ADDRESS: process.env.DISTRIBUTOR_ADDRESS || '0x7E871dfEBAEC9E3e9f2458E5B5Fd90F3283356cD',
  
  // Database
  CASSANDRA_CONTACT_POINTS: (process.env.CASSANDRA_CONTACT_POINTS || 'scylla').split(','),
  CASSANDRA_KEYSPACE: process.env.CASSANDRA_KEYSPACE || 'mantlefrac',
  
  // Indexer settings
  START_BLOCK: BigInt(process.env.START_BLOCK || '0'),
  POLL_INTERVAL_MS: Number(process.env.POLL_INTERVAL_MS || '5000'),
  BATCH_SIZE: Number(process.env.BATCH_SIZE || '1000'),
  
  // Metrics
  METRICS_PORT: Number(process.env.METRICS_PORT || '9101'),
} as const;

// Mantle chain definitions
export const MANTLE_CHAINS = {
  mainnet: {
    id: 5000,
    name: 'Mantle',
    rpcUrl: 'https://rpc.mantle.xyz',
  },
  testnet: {
    id: 5003,
    name: 'Mantle Sepolia Testnet',
    rpcUrl: 'https://rpc.sepolia.mantle.xyz',
  },
} as const;
