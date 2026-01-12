"use client";

import Link from "next/link";

type MarketplaceListing = {
    network: string;
    vaultId: string;
    listingId: string;
    seller: string;
    priceAsset: string;
    priceAmount: string;
    amount: string;
    status: string;
    createdAt: string;
    vaultSymbol?: string;
    vaultName?: string;
};

function formatAddress(address: string): string {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatAmount(amount: string): string {
    try {
        const num = parseFloat(amount) / 1e18;
        return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
    } catch {
        return amount;
    }
}

export default function MarketplaceListingCard({
    listing,
}: {
    listing: MarketplaceListing;
}) {
    return (
        <Link
            href={`/marketplace/${listing.listingId}`}
            className="block bg-neutral-950 border border-neutral-800 rounded-lg p-3 hover:border-neutral-600 transition-colors"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                        {listing.vaultSymbol?.slice(0, 2) || "?"}
                    </div>
                    <div>
                        <div className="text-sm font-medium text-neutral-100">
                            {listing.vaultSymbol || listing.vaultId.slice(0, 8)}
                        </div>
                        <div className="text-xs text-neutral-400">
                            {formatAmount(listing.amount)} shares
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm font-semibold text-green-400">
                        {formatAmount(listing.priceAmount)} MNT
                    </div>
                    <div className="text-xs text-neutral-400">
                        by {formatAddress(listing.seller)}
                    </div>
                </div>
            </div>
        </Link>
    );
}
