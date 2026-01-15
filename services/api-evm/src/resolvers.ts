import { IResolvers } from 'mercurius';
import { db } from './db/sqlite.js';

// Define DB Types
type VaultRow = {
    vault_id: string;
    nft_contract: string;
    token_id: string;
    share_token: string;
    creator: string;
    state: number;
    max_supply: string;
};

type ListingRow = {
    listing_id: string;
    vault_id: string;
    seller: string;
    share_amount: string;
    price_asset: string;
    price_amount: string;
    status: number;
    created_at: number;
};

export const resolvers: IResolvers = {
    Query: {
        vaults: async (_, { creator, limit = 50 }) => {
            let query = "SELECT * FROM vaults";
            const params = [];

            if (creator) {
                query += " WHERE creator = ?";
                params.push(creator);
            }

            query += " ORDER BY created_at DESC LIMIT ?";
            params.push(limit);

            const rows = db.prepare(query).all(...params) as VaultRow[];

            return rows.map(row => ({
                vaultId: row.vault_id,
                nftContract: row.nft_contract,
                tokenId: row.token_id,
                shareToken: row.share_token,
                creator: row.creator,
                state: row.state,
                maxSupply: row.max_supply,
                network: 'mantle-sepolia' // hardcoded for now
            }));
        },

        marketplaceListings: async (_, { limit = 50 }) => {
            const rows = db.prepare("SELECT * FROM listings WHERE status = 0 ORDER BY created_at DESC LIMIT ?").all(limit) as ListingRow[];
            const count = db.prepare("SELECT COUNT(*) as count FROM listings WHERE status = 0").get() as { count: number };

            return {
                listings: rows.map(row => ({
                    listingId: row.listing_id,
                    vaultId: row.vault_id,
                    seller: row.seller,
                    shareAmount: row.share_amount,
                    priceAsset: row.price_asset,
                    priceAmount: row.price_amount,
                    status: row.status === 0 ? 'Open' : 'Filled',
                    createdAt: new Date(row.created_at * 1000).toISOString()
                })),
                totalCount: count.count
            };
        },

        marketplaceStats: async () => {
            const totalListings = db.prepare("SELECT COUNT(*) as count FROM listings").get() as { count: number };
            const openListings = db.prepare("SELECT COUNT(*) as count FROM listings WHERE status = 0").get() as { count: number };
            // Simple aggregated stats
            return {
                totalListings: totalListings.count,
                openListings: openListings.count,
                totalVolume: "0", // Need more complex logic/table for volume tracking
                uniqueVaults: 0
            };
        },

        vaultNftDisplay: async (_, { vaultId }) => {
            const vault = db.prepare("SELECT * FROM vaults WHERE vault_id = ?").get(vaultId) as VaultRow;
            if (!vault) return null;

            return {
                contractAddress: vault.nft_contract,
                tokenId: vault.token_id,
                name: `Vault Asset #${vault.token_id}`,
                description: `Underlying asset for ${vault.share_token}`,
                imageUrl: `https://picsum.photos/seed/${vault.vault_id}/400/400`,
                attributes: {}
            };
        },

        // Pools - return empty array since pools table doesn't exist yet
        pools: async () => {
            return [];
        },

        pool: async () => {
            return null;
        },

        allPools: async () => {
            return [];
        },

        poolsByAsset: async () => {
            return [];
        },

        poolsByToken: async () => {
            return [];
        },

        // Listings
        listings: async (_, { vaultId }) => {
            const rows = db.prepare("SELECT * FROM listings WHERE vault_id = ? ORDER BY created_at DESC").all(vaultId) as ListingRow[];
            return rows.map(row => ({
                network: 'mantle-sepolia',
                listingId: row.listing_id,
                vaultId: row.vault_id,
                seller: row.seller,
                shareAmount: row.share_amount,
                priceAsset: row.price_asset,
                priceAmount: row.price_amount,
                status: row.status === 0 ? 'Open' : 'Filled',
                createdAt: new Date(row.created_at * 1000).toISOString()
            }));
        }
    }
};
