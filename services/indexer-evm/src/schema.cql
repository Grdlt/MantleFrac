-- MantleFrac EVM Indexer Schema for ScyllaDB/Cassandra

CREATE KEYSPACE IF NOT EXISTS mantlefrac
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE mantlefrac;

-- Indexer checkpoint for resumable indexing
CREATE TABLE IF NOT EXISTS indexer_checkpoint (
    network text PRIMARY KEY,
    block_number text,
    updated_at timestamp
);

-- Vaults table
CREATE TABLE IF NOT EXISTS vaults (
    network text,
    vault_id text,
    nft_contract text,
    token_id text,
    share_symbol text,
    share_token text,
    creator text,
    state text,
    redeemed_by text,
    redeemed_at timestamp,
    created_at timestamp,
    block_number text,
    tx_hash text,
    PRIMARY KEY ((network), vault_id)
);

-- Listings table
CREATE TABLE IF NOT EXISTS listings (
    network text,
    vault_id text,
    listing_id text,
    seller text,
    buyer text,
    share_amount text,
    price_asset text,
    price_amount text,
    status text,
    created_at timestamp,
    filled_at timestamp,
    cancelled_at timestamp,
    block_number text,
    tx_hash text,
    PRIMARY KEY ((network), listing_id)
);

-- Listings by vault for queries
CREATE TABLE IF NOT EXISTS listings_by_vault (
    network text,
    vault_id text,
    listing_id text,
    seller text,
    status text,
    created_at timestamp,
    PRIMARY KEY ((network, vault_id), listing_id)
);

-- Pools table
CREATE TABLE IF NOT EXISTS pools (
    network text,
    pool_id text,
    token_a text,
    token_b text,
    reserve_a text,
    reserve_b text,
    total_lp_supply text,
    fee_bps int,
    created_at timestamp,
    block_number text,
    tx_hash text,
    PRIMARY KEY ((network), pool_id)
);

-- Swaps history
CREATE TABLE IF NOT EXISTS swaps (
    network text,
    pool_id text,
    trader text,
    token_in text,
    amount_in text,
    token_out text,
    amount_out text,
    created_at timestamp,
    block_number text,
    tx_hash text,
    PRIMARY KEY ((network, pool_id), created_at, tx_hash)
) WITH CLUSTERING ORDER BY (created_at DESC);

-- Distributions table
CREATE TABLE IF NOT EXISTS distributions (
    network text,
    vault_id text,
    program_id text,
    asset text,
    total_amount text,
    claimed_amount text,
    starts_at timestamp,
    ends_at timestamp,
    snapshot_block text,
    active boolean,
    created_at timestamp,
    block_number text,
    tx_hash text,
    PRIMARY KEY ((network), program_id)
);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
    network text,
    program_id text,
    account text,
    amount text,
    claimed_at timestamp,
    block_number text,
    tx_hash text,
    PRIMARY KEY ((network, program_id), account)
);

-- Events log for audit trail
CREATE TABLE IF NOT EXISTS events (
    network text,
    block_number text,
    tx_hash text,
    log_index int,
    contract text,
    event_name text,
    payload text,
    created_at timestamp,
    PRIMARY KEY ((network), block_number, tx_hash, log_index)
) WITH CLUSTERING ORDER BY (block_number DESC);
