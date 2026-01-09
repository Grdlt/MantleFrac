/**
 * Configuration for MantleFrac EVM API
 */

export const ENV = {
  // Server
  HOST: process.env.HOST || '0.0.0.0',
  PORT: Number(process.env.PORT || '4000'),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  // Network
  NETWORK: process.env.NETWORK || 'mantle-sepolia',
  RPC_URL: process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz',
  CHAIN_ID: Number(process.env.CHAIN_ID || '5003'),

  // Contract addresses (Mantle Sepolia Testnet)
  VAULT_ADDRESS: process.env.VAULT_ADDRESS || '0xCc59F6FC768612659BEB827c0345c65F1C7ABe17',
  MARKETPLACE_ADDRESS: process.env.MARKETPLACE_ADDRESS || '0x751dC26E9d66aC60B29D395a11C96523ACd94487',
  AMM_ADDRESS: process.env.AMM_ADDRESS || '0x293fA675B73931a20F30b0c68A18d3cd39cF9Af0',
  DISTRIBUTOR_ADDRESS: process.env.DISTRIBUTOR_ADDRESS || '0x7E871dfEBAEC9E3e9f2458E5B5Fd90F3283356cD',

  // Database - Local Cassandra/ScyllaDB
  CASSANDRA_CONTACT_POINTS: (process.env.CASSANDRA_CONTACT_POINTS || 'localhost').split(','),
  CASSANDRA_KEYSPACE: process.env.CASSANDRA_KEYSPACE || 'default_keyspace',
  CASSANDRA_LOCAL_DC: process.env.CASSANDRA_LOCAL_DC || 'datacenter1',

  // Database - Astra DB (云端)
  // 方式1: 使用 Secure Connect Bundle
  ASTRA_SECURE_BUNDLE_BASE64: process.env.ASTRA_SECURE_BUNDLE_BASE64 || '',
  ASTRA_SECURE_BUNDLE_PATH: process.env.ASTRA_SECURE_BUNDLE_PATH || '',

  // 方式2: 使用 Token 直连 (推荐 Serverless Vector)
  ASTRA_DB_APPLICATION_TOKEN: process.env.ASTRA_DB_APPLICATION_TOKEN || '',
  ASTRA_DB_ID: process.env.ASTRA_DB_ID || '',
  ASTRA_DB_REGION: process.env.ASTRA_DB_REGION || '',

  // 判断是否使用 Astra DB
  USE_ASTRA: Boolean(process.env.ASTRA_DB_APPLICATION_TOKEN),
} as const;
