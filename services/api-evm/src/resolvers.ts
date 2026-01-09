/**
 * GraphQL Resolvers for MantleFrac EVM API
 */

import type { Client as Cassandra } from 'cassandra-driver';
import { z } from 'zod';
import { ENV } from './config.js';

export function buildResolvers(cassandra: Cassandra) {
  const network = ENV.NETWORK;

  return {
    Query: {
      // Network info
      networkInfo() {
        return {
          network: ENV.NETWORK,
          chainId: ENV.CHAIN_ID,
          rpcUrl: ENV.RPC_URL,
          contracts: {
            vault: ENV.VAULT_ADDRESS,
            marketplace: ENV.MARKETPLACE_ADDRESS,
            amm: ENV.AMM_ADDRESS,
            distributor: ENV.DISTRIBUTOR_ADDRESS,
          },
        };
      },

      // Vaults
      async vault(_: unknown, args: { vaultId: string }) {
        const schema = z.object({ vaultId: z.string().min(1) });
        const { vaultId } = schema.parse(args);

        const result = await cassandra.execute(
          'SELECT * FROM vaults WHERE network = ? AND vault_id = ?',
          [network, vaultId],
          { prepare: true }
        );

        const row = result.first();
        if (!row) return null;

        return mapVaultRow(row);
      },

      async vaults(_: unknown, args: { limit?: number; offset?: number }) {
        const schema = z.object({
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
        });
        const { limit } = schema.parse(args);

        const result = await cassandra.execute(
          'SELECT * FROM vaults WHERE network = ? LIMIT ?',
          [network, limit],
          { prepare: true }
        );

        return result.rows.map(mapVaultRow);
      },

      async vaultsByCreator(_: unknown, args: { creator: string; limit?: number }) {
        const schema = z.object({
          creator: z.string().min(1),
          limit: z.number().int().min(1).max(100).default(50),
        });
        const { creator, limit } = schema.parse(args);

        const result = await cassandra.execute(
          'SELECT * FROM vaults WHERE network = ? LIMIT ? ALLOW FILTERING',
          [network, limit],
          { prepare: true }
        );

        return result.rows
          .filter((row) => row.get('creator')?.toLowerCase() === creator.toLowerCase())
          .map(mapVaultRow);
      },

      // Listings
      async listing(_: unknown, args: { listingId: string }) {
        const schema = z.object({ listingId: z.string().min(1) });
        const { listingId } = schema.parse(args);

        const result = await cassandra.execute(
          'SELECT * FROM listings WHERE network = ? AND listing_id = ?',
          [network, listingId],
          { prepare: true }
        );

        const row = result.first();
        if (!row) return null;

        return mapListingRow(row);
      },

      async listings(_: unknown, args: { vaultId: string; limit?: number }) {
        const schema = z.object({
          vaultId: z.string().min(1),
          limit: z.number().int().min(1).max(100).default(50),
        });
        const { vaultId, limit } = schema.parse(args);

        const result = await cassandra.execute(
          'SELECT * FROM listings_by_vault WHERE network = ? AND vault_id = ? LIMIT ?',
          [network, vaultId, limit],
          { prepare: true }
        );

        return result.rows.map(mapListingRow);
      },

      async listingsBySeller(_: unknown, args: { seller: string; limit?: number }) {
        const schema = z.object({
          seller: z.string().min(1),
          limit: z.number().int().min(1).max(100).default(50),
        });
        const { seller, limit } = schema.parse(args);

        const result = await cassandra.execute(
          'SELECT * FROM listings WHERE network = ? LIMIT ? ALLOW FILTERING',
          [network, limit],
          { prepare: true }
        );

        return result.rows
          .filter((row) => row.get('seller')?.toLowerCase() === seller.toLowerCase())
          .map(mapListingRow);
      },

      async marketplaceListings(
        _: unknown,
        args: {
          limit?: number;
          offset?: number;
          sortBy?: string;
          filterByStatus?: string;
        }
      ) {
        const schema = z.object({
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
          sortBy: z.string().optional(),
          filterByStatus: z.string().optional(),
        });
        const { limit, offset, filterByStatus } = schema.parse(args);

        const result = await cassandra.execute(
          'SELECT * FROM listings WHERE network = ? LIMIT ?',
          [network, limit + offset],
          { prepare: true }
        );

        let listings = result.rows.map(mapListingRow);

        if (filterByStatus) {
          listings = listings.filter(
            (l) => l.status?.toUpperCase() === filterByStatus.toUpperCase()
          );
        }

        const totalCount = listings.length;
        listings = listings.slice(offset, offset + limit);

        return {
          listings,
          totalCount,
          hasMore: offset + listings.length < totalCount,
        };
      },

      async marketplaceStats() {
        const result = await cassandra.execute(
          'SELECT * FROM listings WHERE network = ?',
          [network],
          { prepare: true }
        );

        const listings = result.rows;
        const openListings = listings.filter((r) => r.get('status') === 'open');
        const uniqueVaults = new Set(listings.map((r) => r.get('vault_id'))).size;

        let totalVolume = 0n;
        for (const row of listings) {
          if (row.get('status') === 'filled') {
            totalVolume += BigInt(row.get('price_amount') || '0');
          }
        }

        return {
          totalListings: listings.length,
          openListings: openListings.length,
          totalVolume: totalVolume.toString(),
          uniqueVaults,
        };
      },

      // Pools
      async pool(_: unknown, args: { poolId: string }) {
        const schema = z.object({ poolId: z.string().min(1) });
        const { poolId } = schema.parse(args);

        const result = await cassandra.execute(
          'SELECT * FROM pools WHERE network = ? AND pool_id = ?',
          [network, poolId],
          { prepare: true }
        );

        const row = result.first();
        if (!row) return null;

        return mapPoolRow(row);
      },

      async pools(_: unknown, args: { limit?: number; offset?: number }) {
        const schema = z.object({
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
        });
        const { limit } = schema.parse(args);

        const result = await cassandra.execute(
          'SELECT * FROM pools WHERE network = ? LIMIT ?',
          [network, limit],
          { prepare: true }
        );

        return result.rows.map(mapPoolRow);
      },

      async poolsByToken(_: unknown, args: { tokenAddress: string; limit?: number }) {
        const schema = z.object({
          tokenAddress: z.string().min(1),
          limit: z.number().int().min(1).max(100).default(50),
        });
        const { tokenAddress, limit } = schema.parse(args);

        const result = await cassandra.execute(
          'SELECT * FROM pools WHERE network = ? LIMIT ? ALLOW FILTERING',
          [network, limit],
          { prepare: true }
        );

        return result.rows
          .filter(
            (row) =>
              row.get('token_a')?.toLowerCase() === tokenAddress.toLowerCase() ||
              row.get('token_b')?.toLowerCase() === tokenAddress.toLowerCase()
          )
          .map(mapPoolRow);
      },

      async swaps(_: unknown, args: { poolId: string; limit?: number }) {
        const schema = z.object({
          poolId: z.string().min(1),
          limit: z.number().int().min(1).max(100).default(50),
        });
        const { poolId, limit } = schema.parse(args);

        const result = await cassandra.execute(
          'SELECT * FROM swaps WHERE network = ? AND pool_id = ? LIMIT ?',
          [network, poolId, limit],
          { prepare: true }
        );

        return result.rows.map(mapSwapRow);
      },

      // Distributions
      async distribution(_: unknown, args: { programId: string }) {
        const schema = z.object({ programId: z.string().min(1) });
        const { programId } = schema.parse(args);

        const result = await cassandra.execute(
          'SELECT * FROM distributions WHERE network = ? AND program_id = ?',
          [network, programId],
          { prepare: true }
        );

        const row = result.first();
        if (!row) return null;

        return mapDistributionRow(row);
      },

      async distributions(_: unknown, args: { vaultId: string; limit?: number }) {
        const schema = z.object({
          vaultId: z.string().min(1),
          limit: z.number().int().min(1).max(100).default(50),
        });
        const { vaultId, limit } = schema.parse(args);

        const result = await cassandra.execute(
          'SELECT * FROM distributions WHERE network = ? LIMIT ? ALLOW FILTERING',
          [network, limit],
          { prepare: true }
        );

        return result.rows
          .filter((row) => row.get('vault_id') === vaultId)
          .map(mapDistributionRow);
      },

      async claims(_: unknown, args: { programId: string; limit?: number }) {
        const schema = z.object({
          programId: z.string().min(1),
          limit: z.number().int().min(1).max(200).default(100),
        });
        const { programId, limit } = schema.parse(args);

        const result = await cassandra.execute(
          'SELECT * FROM claims WHERE network = ? AND program_id = ? LIMIT ?',
          [network, programId, limit],
          { prepare: true }
        );

        return result.rows.map(mapClaimRow);
      },

      async claimsByAccount(_: unknown, args: { account: string; limit?: number }) {
        const schema = z.object({
          account: z.string().min(1),
          limit: z.number().int().min(1).max(200).default(100),
        });
        const { account, limit } = schema.parse(args);

        const result = await cassandra.execute(
          'SELECT * FROM claims WHERE network = ? LIMIT ? ALLOW FILTERING',
          [network, limit],
          { prepare: true }
        );

        return result.rows
          .filter((row) => row.get('account')?.toLowerCase() === account.toLowerCase())
          .map(mapClaimRow);
      },

      // Events
      async events(_: unknown, args: { limit?: number }) {
        const schema = z.object({
          limit: z.number().int().min(1).max(100).default(50),
        });
        const { limit } = schema.parse(args);

        const result = await cassandra.execute(
          'SELECT * FROM events WHERE network = ? LIMIT ?',
          [network, limit],
          { prepare: true }
        );

        return result.rows.map(mapEventRow);
      },

      async eventsByContract(_: unknown, args: { contract: string; limit?: number }) {
        const schema = z.object({
          contract: z.string().min(1),
          limit: z.number().int().min(1).max(100).default(50),
        });
        const { contract, limit } = schema.parse(args);

        const result = await cassandra.execute(
          'SELECT * FROM events WHERE network = ? LIMIT ? ALLOW FILTERING',
          [network, limit],
          { prepare: true }
        );

        return result.rows
          .filter((row) => row.get('contract')?.toLowerCase() === contract.toLowerCase())
          .map(mapEventRow);
      },
    },
  };
}

// Row mappers
function mapVaultRow(row: any) {
  return {
    network: row.get('network'),
    vaultId: row.get('vault_id'),
    nftContract: row.get('nft_contract'),
    tokenId: row.get('token_id'),
    shareSymbol: row.get('share_symbol'),
    shareToken: row.get('share_token'),
    creator: row.get('creator'),
    state: row.get('state'),
    redeemedBy: row.get('redeemed_by'),
    redeemedAt: row.get('redeemed_at')?.toISOString?.() || null,
    createdAt: row.get('created_at')?.toISOString?.() || null,
    blockNumber: row.get('block_number'),
    txHash: row.get('tx_hash'),
  };
}

function mapListingRow(row: any) {
  return {
    network: row.get('network'),
    vaultId: row.get('vault_id'),
    listingId: row.get('listing_id'),
    seller: row.get('seller'),
    buyer: row.get('buyer'),
    shareAmount: row.get('share_amount'),
    priceAsset: row.get('price_asset'),
    priceAmount: row.get('price_amount'),
    status: row.get('status'),
    createdAt: row.get('created_at')?.toISOString?.() || null,
    filledAt: row.get('filled_at')?.toISOString?.() || null,
    cancelledAt: row.get('cancelled_at')?.toISOString?.() || null,
    blockNumber: row.get('block_number'),
    txHash: row.get('tx_hash'),
  };
}

function mapPoolRow(row: any) {
  return {
    network: row.get('network'),
    poolId: row.get('pool_id'),
    tokenA: row.get('token_a'),
    tokenB: row.get('token_b'),
    reserveA: row.get('reserve_a'),
    reserveB: row.get('reserve_b'),
    totalLpSupply: row.get('total_lp_supply'),
    feeBps: row.get('fee_bps'),
    createdAt: row.get('created_at')?.toISOString?.() || null,
    blockNumber: row.get('block_number'),
    txHash: row.get('tx_hash'),
  };
}

function mapSwapRow(row: any) {
  return {
    network: row.get('network'),
    poolId: row.get('pool_id'),
    trader: row.get('trader'),
    tokenIn: row.get('token_in'),
    amountIn: row.get('amount_in'),
    tokenOut: row.get('token_out'),
    amountOut: row.get('amount_out'),
    createdAt: row.get('created_at')?.toISOString?.() || null,
    blockNumber: row.get('block_number'),
    txHash: row.get('tx_hash'),
  };
}

function mapDistributionRow(row: any) {
  return {
    network: row.get('network'),
    vaultId: row.get('vault_id'),
    programId: row.get('program_id'),
    asset: row.get('asset'),
    totalAmount: row.get('total_amount'),
    claimedAmount: row.get('claimed_amount'),
    startsAt: row.get('starts_at')?.toISOString?.() || null,
    endsAt: row.get('ends_at')?.toISOString?.() || null,
    snapshotBlock: row.get('snapshot_block'),
    active: row.get('active'),
    createdAt: row.get('created_at')?.toISOString?.() || null,
    blockNumber: row.get('block_number'),
    txHash: row.get('tx_hash'),
  };
}

function mapClaimRow(row: any) {
  return {
    network: row.get('network'),
    programId: row.get('program_id'),
    account: row.get('account'),
    amount: row.get('amount'),
    claimedAt: row.get('claimed_at')?.toISOString?.() || null,
    blockNumber: row.get('block_number'),
    txHash: row.get('tx_hash'),
  };
}

function mapEventRow(row: any) {
  return {
    network: row.get('network'),
    blockNumber: row.get('block_number'),
    txHash: row.get('tx_hash'),
    logIndex: row.get('log_index'),
    contract: row.get('contract'),
    eventName: row.get('event_name'),
    payload: row.get('payload'),
    createdAt: row.get('created_at')?.toISOString?.() || null,
  };
}

export default buildResolvers;
