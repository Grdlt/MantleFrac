-- Astra DB Serverless Schema for MantleFrac
-- 在 Astra CQL Console 中执行
-- 注意：Astra Serverless 使用 default_keyspace

USE default_keyspace;

CREATE TABLE IF NOT EXISTS vaults (
  network text,
  vault_id text,
  collection text,
  token_id text,
  share_symbol text,
  policy text,
  creator text,
  created_at timestamp,
  state text,
  metadata map<text, text>,
  PRIMARY KEY ((network, vault_id))
);

CREATE TABLE IF NOT EXISTS events (
  network text,
  vault_id text,
  block_height bigint,
  tx_index int,
  ev_index int,
  tx_id text,
  type text,
  payload text,
  ts timestamp,
  PRIMARY KEY ((network, vault_id), block_height, tx_index, ev_index)
) WITH CLUSTERING ORDER BY (block_height ASC, tx_index ASC, ev_index ASC);

CREATE TABLE IF NOT EXISTS listings (
  network text,
  vault_id text,
  listing_id text,
  seller text,
  price_asset text,
  price_amount text,
  amount text,
  status text,
  created_at timestamp,
  PRIMARY KEY ((network, vault_id), listing_id)
);

CREATE TABLE IF NOT EXISTS listings_by_seller (
  network text,
  seller text,
  listing_id text,
  vault_id text,
  price_asset text,
  price_amount text,
  amount text,
  status text,
  created_at timestamp,
  PRIMARY KEY ((network, seller), listing_id)
);

CREATE TABLE IF NOT EXISTS pools (
  network text,
  vault_id text,
  pool_id text,
  owner text,
  asset_a text,
  asset_b text,
  reserve_a text,
  reserve_b text,
  fee_bps int,
  created_at timestamp,
  PRIMARY KEY ((network, vault_id), pool_id)
);

CREATE TABLE IF NOT EXISTS pools_by_asset (
  network text,
  asset_symbol text,
  pool_id text,
  vault_id text,
  owner text,
  other_asset text,
  reserve_self text,
  reserve_other text,
  fee_bps int,
  created_at timestamp,
  PRIMARY KEY ((network, asset_symbol), pool_id)
);

CREATE TABLE IF NOT EXISTS distributions (
  network text,
  vault_id text,
  program_id text,
  asset text,
  total_amount text,
  schedule text,
  starts_at timestamp,
  ends_at timestamp,
  created_at timestamp,
  PRIMARY KEY ((network, vault_id), program_id)
);

CREATE TABLE IF NOT EXISTS balances (
  network text,
  asset_symbol text,
  account text,
  amount text,
  updated_at timestamp,
  PRIMARY KEY ((network, asset_symbol), account)
);

CREATE TABLE IF NOT EXISTS share_tokens (
  network text,
  symbol text,
  vault_id text,
  decimals int,
  total_supply text,
  mode text,
  treasury text,
  created_at timestamp,
  PRIMARY KEY ((network, symbol))
);

CREATE TABLE IF NOT EXISTS fees (
  network text,
  vault_id text,
  kind text,
  "token" text,
  amount text,
  vault_share text,
  protocol_share text,
  payer text,
  tx_id text,
  created_at timestamp,
  PRIMARY KEY ((network, vault_id), created_at, tx_id)
);

CREATE TABLE IF NOT EXISTS fee_totals (
  network text,
  "token" text,
  amount_total text,
  vault_total text,
  protocol_total text,
  updated_at timestamp,
  PRIMARY KEY ((network), "token")
);

CREATE TABLE IF NOT EXISTS vault_fee_state (
  network text,
  vault_id text,
  current_fee_bps text,
  current_vault_split_bps text,
  current_protocol_split_bps text,
  pending_fee_bps text,
  pending_vault_split_bps text,
  pending_protocol_split_bps text,
  pending_effective_at text,
  updated_at timestamp,
  PRIMARY KEY ((network), vault_id)
);

CREATE TABLE IF NOT EXISTS processed_events (
  network text,
  tx_id text,
  ev_index int,
  processed_at timestamp,
  PRIMARY KEY ((network), tx_id, ev_index)
);
