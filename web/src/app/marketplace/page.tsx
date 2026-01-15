"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useChainId } from "wagmi";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { gqlFetch, DEFAULT_NETWORK } from "@/lib/graphql";

type Listing = {
    listingId: string;
    vaultId: string;
    seller: string;
    shareAmount: string;
    priceAsset: string;
    priceAmount: string;
    status: string;
    createdAt: string;
};

type MarketplaceStats = {
    totalListings: number;
    openListings: number;
    totalVolume: string;
    uniqueVaults: number;
};

export default function MarketplacePage() {
    const { isConnected } = useAccount();
    const chainId = useChainId();
    const [listings, setListings] = useState<Listing[]>([]);
    const [stats, setStats] = useState<MarketplaceStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const query = `
          query MarketplaceData($network: String) {
            marketplaceListings(limit: 50) {
              listings {
                listingId
                vaultId
                seller
                shareAmount
                priceAsset
                priceAmount
                status
                createdAt
              }
              totalCount
            }
            marketplaceStats {
              totalListings
              openListings
              totalVolume
              uniqueVaults
            }
          }
        `;
                const data = await gqlFetch<{
                    marketplaceListings: { listings: Listing[]; totalCount: number };
                    marketplaceStats: MarketplaceStats;
                }>(query, { network: DEFAULT_NETWORK });

                setListings(data.marketplaceListings?.listings || []);
                setStats(data.marketplaceStats);
            } catch (err) {
                console.error("Failed to fetch marketplace data:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const formatAddress = (addr: string) =>
        addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

    const formatAmount = (amount: string) => {
        try {
            return parseFloat(formatUnits(BigInt(amount || "0"), 18)).toLocaleString(undefined, {
                maximumFractionDigits: 4,
            });
        } catch {
            return "0";
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100">
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Marketplace</h1>
                        <p className="text-neutral-400 mt-1">
                            Buy and sell fractionalized NFT shares
                        </p>
                    </div>
                    {isConnected && (
                        <Button asChild>
                            <Link href="/wizard/deposit">Create Vault</Link>
                        </Button>
                    )}
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                            <div className="text-2xl font-bold">{stats.openListings}</div>
                            <div className="text-sm text-neutral-400">Open Listings</div>
                        </div>
                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                            <div className="text-2xl font-bold">{stats.totalListings}</div>
                            <div className="text-sm text-neutral-400">Total Listings</div>
                        </div>
                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                            <div className="text-2xl font-bold">{formatAmount(stats.totalVolume)}</div>
                            <div className="text-sm text-neutral-400">Total Volume (MNT)</div>
                        </div>
                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                            <div className="text-2xl font-bold">{stats.uniqueVaults}</div>
                            <div className="text-sm text-neutral-400">Unique Vaults</div>
                        </div>
                    </div>
                )}

                {/* Listings */}
                {loading ? (
                    <div className="text-center py-12 text-neutral-400">
                        Loading listings...
                    </div>
                ) : listings.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-900 border border-neutral-800 rounded-lg">
                        <div className="text-lg font-medium mb-2">No listings yet</div>
                        <p className="text-neutral-400 mb-6">
                            Be the first to list your shares for sale!
                        </p>
                        {isConnected && (
                            <Button asChild variant="secondary">
                                <Link href="/wizard/deposit">Create a Vault</Link>
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {listings.map((listing) => (
                            <Link
                                key={listing.listingId}
                                href={`/marketplace/${listing.listingId}`}
                                className="block bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-purple-500/50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                                            V
                                        </div>
                                        <div>
                                            <div className="font-medium">
                                                Vault {listing.vaultId.slice(0, 8)}...
                                            </div>
                                            <div className="text-sm text-neutral-400">
                                                {formatAmount(listing.shareAmount)} shares • by {formatAddress(listing.seller)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-green-400">
                                            {formatAmount(listing.priceAmount)} MNT
                                        </div>
                                        <div className="text-xs text-neutral-500 uppercase">
                                            {listing.status}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
