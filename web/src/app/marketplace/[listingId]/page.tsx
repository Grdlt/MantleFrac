"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { useFillListing, useListingRead } from "@/hooks/contracts";

export default function ListingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const listingId = params.listingId as `0x${string}`;
    const { address, isConnected } = useAccount();

    const { listing, isLoading, error } = useListingRead(listingId);
    const { fillListing, isPending, isConfirming, isSuccess, error: fillError } = useFillListing();

    const formatAddress = (addr: string) =>
        addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

    const formatAmount = (amount: bigint) => {
        try {
            return parseFloat(formatUnits(amount, 18)).toLocaleString(undefined, {
                maximumFractionDigits: 4,
            });
        } catch {
            return "0";
        }
    };

    const handleBuy = async () => {
        if (!listingId) return;
        try {
            await fillListing(listingId);
        } catch (err) {
            console.error("Failed to fill listing:", err);
        }
    };

    useEffect(() => {
        if (isSuccess) {
            setTimeout(() => router.push("/marketplace"), 2000);
        }
    }, [isSuccess, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
                <div className="text-neutral-400">Loading listing...</div>
            </div>
        );
    }

    if (error || !listing) {
        return (
            <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
                <div className="max-w-xl mx-auto text-center py-12">
                    <h1 className="text-2xl font-bold mb-4">Listing Not Found</h1>
                    <p className="text-neutral-400 mb-6">
                        This listing may have been filled or cancelled.
                    </p>
                    <Button asChild>
                        <Link href="/marketplace">Back to Marketplace</Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
                <div className="max-w-xl mx-auto text-center py-12">
                    <div className="text-green-400 text-5xl mb-4">✓</div>
                    <h1 className="text-2xl font-bold mb-4">Purchase Successful!</h1>
                    <p className="text-neutral-400 mb-6">
                        You have successfully purchased the shares.
                    </p>
                    <Button asChild>
                        <Link href="/marketplace">Back to Marketplace</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const isOwner = address?.toLowerCase() === listing.seller.toLowerCase();
    const isOpen = listing.status === 0;

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
            <div className="max-w-2xl mx-auto">
                {/* Back link */}
                <Link href="/marketplace" className="text-neutral-400 hover:text-neutral-200 text-sm mb-6 inline-block">
                    ← Back to Marketplace
                </Link>

                {/* Listing Card */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                                V
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">
                                    Vault {listing.vaultId.slice(0, 8)}...
                                </h1>
                                <p className="text-neutral-400">
                                    Listed by {formatAddress(listing.seller)}
                                </p>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm ${isOpen ? "bg-green-900/50 text-green-400" : "bg-neutral-800 text-neutral-400"
                            }`}>
                            {isOpen ? "Open" : "Closed"}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-neutral-800/50 rounded-lg p-4">
                            <div className="text-sm text-neutral-400 mb-1">Share Amount</div>
                            <div className="text-xl font-bold">{formatAmount(listing.shareAmount)}</div>
                        </div>
                        <div className="bg-neutral-800/50 rounded-lg p-4">
                            <div className="text-sm text-neutral-400 mb-1">Price</div>
                            <div className="text-xl font-bold text-green-400">
                                {formatAmount(listing.priceAmount)} MNT
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {fillError && (
                        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm mb-6">
                            {fillError.message || "An error occurred"}
                        </div>
                    )}

                    {/* Actions */}
                    {isConnected ? (
                        isOwner ? (
                            <div className="text-center text-neutral-400 py-4">
                                This is your listing
                            </div>
                        ) : isOpen ? (
                            <Button
                                onClick={handleBuy}
                                disabled={isPending || isConfirming}
                                className="w-full py-4 text-lg"
                            >
                                {isPending
                                    ? "Waiting for Approval..."
                                    : isConfirming
                                        ? "Confirming..."
                                        : `Buy for ${formatAmount(listing.priceAmount)} MNT`}
                            </Button>
                        ) : (
                            <div className="text-center text-neutral-400 py-4">
                                This listing is no longer available
                            </div>
                        )
                    ) : (
                        <div className="text-center text-neutral-400 py-4">
                            Connect wallet to purchase
                        </div>
                    )}
                </div>

                {/* Vault Link */}
                <div className="mt-6 text-center">
                    <Link
                        href={`/vault/${listing.vaultId}`}
                        className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                        View Vault Details →
                    </Link>
                </div>
            </div>
        </div>
    );
}
