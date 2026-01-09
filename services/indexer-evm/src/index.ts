/**
 * MantleFrac EVM Event Indexer
 * Indexes events from MantleFrac contracts on Mantle Network
 */

import { createPublicClient, http, parseAbiItem, type Log, formatUnits } from 'viem';
import { mantle, mantleSepoliaTestnet } from 'viem/chains';
import { Client as Cassandra } from 'cassandra-driver';
import * as promClient from 'prom-client';
import http from 'node:http';
import { ENV } from './config.js';
import { VAULT_EVENTS, MARKETPLACE_EVENTS, AMM_EVENTS, DISTRIBUTOR_EVENTS } from './abis.js';

// Metrics setup
const registry = new promClient.Registry();
promClient.collectDefaultMetrics({ register: registry, prefix: 'mantlefrac_indexer_' });

const eventsProcessed = new promClient.Counter({
  name: 'mantlefrac_indexer_events_processed_total',
  help: 'Total events processed',
  registers: [registry],
  labelNames: ['type', 'contract'],
});

const blocksProcessed = new promClient.Counter({
  name: 'mantlefrac_indexer_blocks_processed_total',
  help: 'Total blocks processed',
  registers: [registry],
});

const lastBlockGauge = new promClient.Gauge({
  name: 'mantlefrac_indexer_last_block',
  help: 'Last processed block number',
  registers: [registry],
});

const errorsTotal = new promClient.Counter({
  name: 'mantlefrac_indexer_errors_total',
  help: 'Total errors',
  registers: [registry],
  labelNames: ['type'],
});

// Select chain based on config
const chain = ENV.CHAIN_ID === 5000 ? mantle : mantleSepoliaTestnet;

// Create viem client
const client = createPublicClient({
  chain,
  transport: http(ENV.RPC_URL),
});

// Cassandra client
let cassandra: Cassandra;

// Checkpoint management
let lastProcessedBlock = ENV.START_BLOCK;

async function initDatabase() {
  cassandra = new Cassandra({
    contactPoints: ENV.CASSANDRA_CONTACT_POINTS,
    localDataCenter: 'datacenter1',
    keyspace: ENV.CASSANDRA_KEYSPACE,
    queryOptions: { consistency: 1 },
  });
  
  await cassandra.connect();
  console.log('Connected to Cassandra');
  
  // Load last checkpoint
  try {
    const result = await cassandra.execute(
      'SELECT block_number FROM mantlefrac.indexer_checkpoint WHERE network = ?',
      [ENV.NETWORK],
      { prepare: true }
    );
    if (result.rows.length > 0) {
      lastProcessedBlock = BigInt(result.rows[0].get('block_number'));
      console.log(`Resuming from block ${lastProcessedBlock}`);
    }
  } catch (e) {
    console.log('No checkpoint found, starting from configured block');
  }
}

async function saveCheckpoint(blockNumber: bigint) {
  await cassandra.execute(
    'INSERT INTO mantlefrac.indexer_checkpoint (network, block_number, updated_at) VALUES (?, ?, toTimestamp(now()))',
    [ENV.NETWORK, blockNumber.toString()],
    { prepare: true }
  );
  lastProcessedBlock = blockNumber;
  lastBlockGauge.set(Number(blockNumber));
}


// Event handlers
async function handleVaultCreated(log: Log, decoded: any) {
  const { vaultId, nftContract, tokenId, shareSymbol, shareToken, creator } = decoded.args;
  
  await cassandra.execute(
    `INSERT INTO mantlefrac.vaults (network, vault_id, nft_contract, token_id, share_symbol, share_token, creator, state, created_at, block_number, tx_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, toTimestamp(now()), ?, ?)`,
    [ENV.NETWORK, vaultId, nftContract, tokenId.toString(), shareSymbol, shareToken, creator, 'open', log.blockNumber?.toString(), log.transactionHash],
    { prepare: true }
  );
  
  console.log(`VaultCreated: ${vaultId} by ${creator}`);
}

async function handleVaultRedeemed(log: Log, decoded: any) {
  const { vaultId, redeemer } = decoded.args;
  
  await cassandra.execute(
    'UPDATE mantlefrac.vaults SET state = ?, redeemed_by = ?, redeemed_at = toTimestamp(now()) WHERE network = ? AND vault_id = ?',
    ['redeemed', redeemer, ENV.NETWORK, vaultId],
    { prepare: true }
  );
  
  console.log(`VaultRedeemed: ${vaultId} by ${redeemer}`);
}

async function handleListingCreated(log: Log, decoded: any) {
  const { listingId, vaultId, seller, shareAmount, priceAsset, priceAmount } = decoded.args;
  
  await cassandra.execute(
    `INSERT INTO mantlefrac.listings (network, vault_id, listing_id, seller, share_amount, price_asset, price_amount, status, created_at, block_number, tx_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, toTimestamp(now()), ?, ?)`,
    [ENV.NETWORK, vaultId, listingId, seller, shareAmount.toString(), priceAsset, priceAmount.toString(), 'open', log.blockNumber?.toString(), log.transactionHash],
    { prepare: true }
  );
  
  console.log(`ListingCreated: ${listingId} for vault ${vaultId}`);
}

async function handleListingFilled(log: Log, decoded: any) {
  const { listingId, buyer, shareAmount, priceAmount } = decoded.args;
  
  await cassandra.execute(
    'UPDATE mantlefrac.listings SET status = ?, buyer = ?, filled_at = toTimestamp(now()) WHERE network = ? AND listing_id = ?',
    ['filled', buyer, ENV.NETWORK, listingId],
    { prepare: true }
  );
  
  console.log(`ListingFilled: ${listingId} by ${buyer}`);
}

async function handleListingCancelled(log: Log, decoded: any) {
  const { listingId } = decoded.args;
  
  await cassandra.execute(
    'UPDATE mantlefrac.listings SET status = ?, cancelled_at = toTimestamp(now()) WHERE network = ? AND listing_id = ?',
    ['cancelled', ENV.NETWORK, listingId],
    { prepare: true }
  );
  
  console.log(`ListingCancelled: ${listingId}`);
}

async function handlePoolCreated(log: Log, decoded: any) {
  const { poolId, tokenA, tokenB, reserveA, reserveB } = decoded.args;
  
  await cassandra.execute(
    `INSERT INTO mantlefrac.pools (network, pool_id, token_a, token_b, reserve_a, reserve_b, created_at, block_number, tx_hash)
     VALUES (?, ?, ?, ?, ?, ?, toTimestamp(now()), ?, ?)`,
    [ENV.NETWORK, poolId, tokenA, tokenB, reserveA.toString(), reserveB.toString(), log.blockNumber?.toString(), log.transactionHash],
    { prepare: true }
  );
  
  console.log(`PoolCreated: ${poolId}`);
}

async function handleSwap(log: Log, decoded: any) {
  const { poolId, trader, tokenIn, amountIn, tokenOut, amountOut } = decoded.args;
  
  await cassandra.execute(
    `INSERT INTO mantlefrac.swaps (network, pool_id, trader, token_in, amount_in, token_out, amount_out, created_at, block_number, tx_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, toTimestamp(now()), ?, ?)`,
    [ENV.NETWORK, poolId, trader, tokenIn, amountIn.toString(), tokenOut, amountOut.toString(), log.blockNumber?.toString(), log.transactionHash],
    { prepare: true }
  );
  
  console.log(`Swap: ${poolId} by ${trader}`);
}

async function handleDistributionScheduled(log: Log, decoded: any) {
  const { programId, vaultId, asset, totalAmount, startsAt, endsAt, snapshotBlock } = decoded.args;
  
  await cassandra.execute(
    `INSERT INTO mantlefrac.distributions (network, vault_id, program_id, asset, total_amount, starts_at, ends_at, snapshot_block, created_at, block_number, tx_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, toTimestamp(now()), ?, ?)`,
    [ENV.NETWORK, vaultId, programId, asset, totalAmount.toString(), new Date(Number(startsAt) * 1000), new Date(Number(endsAt) * 1000), snapshotBlock.toString(), log.blockNumber?.toString(), log.transactionHash],
    { prepare: true }
  );
  
  console.log(`DistributionScheduled: ${programId} for vault ${vaultId}`);
}

async function handlePayoutClaimed(log: Log, decoded: any) {
  const { programId, account, amount } = decoded.args;
  
  await cassandra.execute(
    `INSERT INTO mantlefrac.claims (network, program_id, account, amount, claimed_at, block_number, tx_hash)
     VALUES (?, ?, ?, ?, toTimestamp(now()), ?, ?)`,
    [ENV.NETWORK, programId, account, amount.toString(), log.blockNumber?.toString(), log.transactionHash],
    { prepare: true }
  );
  
  console.log(`PayoutClaimed: ${programId} by ${account}`);
}


// Process logs from a block range
async function processLogs(fromBlock: bigint, toBlock: bigint) {
  const contracts = [
    { address: ENV.VAULT_ADDRESS as `0x${string}`, events: VAULT_EVENTS, name: 'Vault' },
    { address: ENV.MARKETPLACE_ADDRESS as `0x${string}`, events: MARKETPLACE_EVENTS, name: 'Marketplace' },
    { address: ENV.AMM_ADDRESS as `0x${string}`, events: AMM_EVENTS, name: 'AMM' },
    { address: ENV.DISTRIBUTOR_ADDRESS as `0x${string}`, events: DISTRIBUTOR_EVENTS, name: 'Distributor' },
  ];

  for (const contract of contracts) {
    if (contract.address === '0x0000000000000000000000000000000000000000') continue;

    try {
      const logs = await client.getLogs({
        address: contract.address,
        fromBlock,
        toBlock,
      });

      for (const log of logs) {
        try {
          // Decode and handle each event
          for (const eventAbi of contract.events) {
            try {
              const decoded = {
                eventName: eventAbi.name,
                args: {} as Record<string, any>,
              };
              
              // Simple event routing based on topic
              const eventSignature = `${eventAbi.name}(${eventAbi.inputs.map(i => i.type).join(',')})`;
              
              switch (eventAbi.name) {
                case 'VaultCreated':
                  await handleVaultCreated(log, decoded);
                  break;
                case 'VaultRedeemed':
                  await handleVaultRedeemed(log, decoded);
                  break;
                case 'ListingCreated':
                  await handleListingCreated(log, decoded);
                  break;
                case 'ListingFilled':
                  await handleListingFilled(log, decoded);
                  break;
                case 'ListingCancelled':
                  await handleListingCancelled(log, decoded);
                  break;
                case 'PoolCreated':
                  await handlePoolCreated(log, decoded);
                  break;
                case 'Swap':
                  await handleSwap(log, decoded);
                  break;
                case 'DistributionScheduled':
                  await handleDistributionScheduled(log, decoded);
                  break;
                case 'PayoutClaimed':
                  await handlePayoutClaimed(log, decoded);
                  break;
              }
              
              eventsProcessed.inc({ type: eventAbi.name, contract: contract.name });
            } catch {
              // Event doesn't match this ABI, try next
            }
          }
        } catch (e) {
          console.error('Error processing log:', e);
          errorsTotal.inc({ type: 'log_processing' });
        }
      }
    } catch (e) {
      console.error(`Error fetching logs for ${contract.name}:`, e);
      errorsTotal.inc({ type: 'log_fetch' });
    }
  }
}

// Main indexing loop
async function indexLoop() {
  while (true) {
    try {
      const currentBlock = await client.getBlockNumber();
      
      if (currentBlock > lastProcessedBlock) {
        const fromBlock = lastProcessedBlock + 1n;
        const toBlock = currentBlock > fromBlock + BigInt(ENV.BATCH_SIZE) 
          ? fromBlock + BigInt(ENV.BATCH_SIZE) 
          : currentBlock;
        
        console.log(`Processing blocks ${fromBlock} to ${toBlock}`);
        
        await processLogs(fromBlock, toBlock);
        await saveCheckpoint(toBlock);
        
        blocksProcessed.inc(Number(toBlock - fromBlock + 1n));
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, ENV.POLL_INTERVAL_MS));
    } catch (e) {
      console.error('Error in index loop:', e);
      errorsTotal.inc({ type: 'index_loop' });
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Start metrics server
function startMetricsServer() {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/metrics') {
      try {
        res.setHeader('Content-Type', registry.contentType);
        res.end(await registry.metrics());
      } catch {
        res.statusCode = 500;
        res.end('metrics_error');
      }
      return;
    }
    if (req.url === '/health') {
      res.statusCode = 200;
      res.end('ok');
      return;
    }
    res.statusCode = 404;
    res.end('not_found');
  });

  server.listen(ENV.METRICS_PORT, '0.0.0.0', () => {
    console.log(`Metrics server listening on :${ENV.METRICS_PORT}`);
  });
}

// Main entry point
async function main() {
  console.log('MantleFrac EVM Indexer starting...');
  console.log('Config:', {
    network: ENV.NETWORK,
    chainId: ENV.CHAIN_ID,
    rpcUrl: ENV.RPC_URL,
    startBlock: ENV.START_BLOCK.toString(),
  });

  startMetricsServer();
  await initDatabase();
  await indexLoop();
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
