import { createPublicClient, http, parseAbiItem, Log, defineChain } from 'viem';
import { db } from '../db/sqlite.js';
import { ENV } from '../config.js';

const mantleSepolia = defineChain({
    id: 5003,
    name: 'Mantle Sepolia Testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Mantle',
        symbol: 'MNT',
    },
    rpcUrls: {
        default: { http: ['https://rpc.sepolia.mantle.xyz'] },
    },
    blockExplorers: {
        default: { name: 'MantleScan', url: 'https://sepolia.mantlescan.xyz' },
    },
    testnet: true,
});

const client = createPublicClient({
    chain: mantleSepolia,
    transport: http(ENV.RPC_URL)
});

// ABIs
const VAULT_CREATED_EVENT = parseAbiItem(
    'event VaultCreated(bytes32 indexed vaultId, address indexed nftContract, uint256 indexed tokenId, string shareSymbol, address shareToken, address creator)'
);

const LISTING_CREATED_EVENT = parseAbiItem(
    'event ListingCreated(bytes32 indexed listingId, bytes32 indexed vaultId, address indexed seller, uint256 shareAmount, address priceAsset, uint256 priceAmount, uint40 deadline)'
);

const LISTING_FILLED_EVENT = parseAbiItem(
    'event ListingFilled(bytes32 indexed listingId, address indexed buyer, uint256 shareAmount, uint256 priceAmount)'
);

async function getLastBlock(): Promise<bigint> {
    try {
        const row = db.prepare("SELECT value FROM app_state WHERE key = 'last_sync_block'").get() as { value: string } | undefined;
        // Default start block (MantleFrac deployment)
        return row ? BigInt(row.value) : BigInt(33410000);
    } catch (e) {
        console.error("Failed to read last block from DB", e);
        return BigInt(33410000);
    }
}

function updateLastBlock(block: bigint) {
    try {
        db.prepare("INSERT OR REPLACE INTO app_state (key, value) VALUES ('last_sync_block', ?)").run(block.toString());
    } catch (e) {
        console.error("Failed to update last block", e);
    }
}

export async function startSync() {
    console.log('Starting Indexer Sync...');

    // Initial Probe to check connection
    try {
        const tip = await client.getBlockNumber();
        console.log(`Indexer connected to Mantle. Current block: ${tip}`);
    } catch (err) {
        console.error('Indexer failed to connect to RPC. Sync paused.', err);
        // Do not return here, let the interval retry
    }

    setInterval(async () => {
        try {
            const fromBlock = await getLastBlock();
            let currentBlock;

            try {
                currentBlock = await client.getBlockNumber();
            } catch (rpcErr) {
                console.error('RPC Error fetching block number:', rpcErr);
                return;
            }

            if (fromBlock >= currentBlock) return;

            // Limit range to avoid RPC errors (e.g. 5000 blocks)
            const toBlock = (currentBlock - fromBlock) > 5000n
                ? fromBlock + 5000n
                : currentBlock;

            console.log(`Syncing blocks ${fromBlock} to ${toBlock}...`);

            // 1. Sync VaultCreated
            const vaultLogs = await client.getLogs({
                address: ENV.VAULT_ADDRESS as `0x${string}`,
                event: VAULT_CREATED_EVENT,
                fromBlock,
                toBlock
            });

            const vaultStmt = db.prepare(`
        INSERT OR IGNORE INTO vaults (vault_id, nft_contract, token_id, share_token, creator, state, created_at)
        VALUES (?, ?, ?, ?, ?, 0, ?)
      `);

            for (const log of vaultLogs) {
                // We'd ideally fetch block timestamp, but using Date.now() for simplicity or fetch block
                vaultStmt.run(
                    log.args.vaultId,
                    log.args.nftContract,
                    log.args.tokenId?.toString(),
                    log.args.shareToken,
                    log.args.creator,
                    Math.floor(Date.now() / 1000)
                );
                console.log(`Indexed Vault: ${log.args.vaultId}`);
            }

            // 2. Sync ListingCreated
            const listingLogs = await client.getLogs({
                address: ENV.MARKETPLACE_ADDRESS as `0x${string}`,
                event: LISTING_CREATED_EVENT,
                fromBlock,
                toBlock
            });

            const listingStmt = db.prepare(`
        INSERT OR IGNORE INTO listings (listing_id, vault_id, seller, share_amount, price_asset, price_amount, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)
      `);

            for (const log of listingLogs) {
                listingStmt.run(
                    log.args.listingId,
                    log.args.vaultId,
                    log.args.seller,
                    log.args.shareAmount?.toString(),
                    log.args.priceAsset,
                    log.args.priceAmount?.toString(),
                    Math.floor(Date.now() / 1000)
                );
                console.log(`Indexed Listing: ${log.args.listingId}`);
            }

            // 2.1 Sync ListingFilled (Update status)
            const filledLogs = await client.getLogs({
                address: ENV.MARKETPLACE_ADDRESS as `0x${string}`,
                event: LISTING_FILLED_EVENT,
                fromBlock,
                toBlock
            });

            const fillStmt = db.prepare("UPDATE listings SET status = 1 WHERE listing_id = ?"); // 1 = Filled
            for (const log of filledLogs) {
                fillStmt.run(log.args.listingId);
                console.log(`Updated Listing Filled: ${log.args.listingId}`);
            }

            updateLastBlock(toBlock);

        } catch (error) {
            console.error('Sync Error:', error);
        }
    }, 5000); // Run every 5 seconds
}
