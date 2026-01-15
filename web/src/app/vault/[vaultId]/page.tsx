"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAccount, useChainId } from "wagmi";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { useVaultRead, useCreateListing, VaultState } from "@/hooks/contracts";
import { getVaultNftDisplay } from "@/lib/api/vault";

type NftDisplay = {
    name?: string | null;
    description?: string | null;
    thumbnail?: string | null;
} | null;

export default function VaultDetailPage() {
    const params = useParams();
    const vaultId = params.vaultId as `0x${string}`;
    const { address, isConnected } = useAccount();
    const chainId = useChainId();

    const { vault, isLoading, error } = useVaultRead(vaultId);
    const { createListing, isPending, isConfirming, isSuccess, error: listingError } = useCreateListing();

    // NFT display state
    const [nftDisplay, setNftDisplay] = useState<NftDisplay>(null);

    // Fetch NFT display
    useEffect(() => {
        if (vaultId) {
            getVaultNftDisplay(vaultId)
                .then(setNftDisplay)
                .catch(() => setNftDisplay(null));
        }
    }, [vaultId]);

    // Sell form state
    const [showSellForm, setShowSellForm] = useState(false);
    const [shareAmount, setShareAmount] = useState("");
    const [priceAmount, setPriceAmount] = useState("");
    const [duration, setDuration] = useState("7");
    const [copied, setCopied] = useState(false);

    const formatAddress = (addr: string) =>
        addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

    // Format vault name - truncate if contains long token ID
    const formatVaultName = (name: string | null | undefined): { display: string; full: string | null } => {
        if (!name) return { display: `Vault ${vaultId.slice(0, 10)}...`, full: null };

        // Check if name contains # followed by a long number
        const match = name.match(/^(.+?)#(\d{10,})$/);
        if (match) {
            const prefix = match[1];
            const tokenId = match[2];
            return {
                display: `${prefix}#${tokenId.slice(0, 6)}...${tokenId.slice(-4)}`,
                full: tokenId
            };
        }
        return { display: name, full: null };
    };

    const handleCopyTokenId = async (tokenId: string) => {
        await navigator.clipboard.writeText(tokenId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatAmount = (amount: bigint) => {
        try {
            return parseFloat(formatUnits(amount, 18)).toLocaleString(undefined, {
                maximumFractionDigits: 4,
            });
        } catch {
            return "0";
        }
    };

    const handleCreateListing = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vault) return;

        try {
            await createListing({
                vaultId,
                shareAmount: BigInt(parseFloat(shareAmount) * 1e18),
                priceAsset: "0x0000000000000000000000000000000000000000" as `0x${string}`, // Native MNT
                priceAmount: BigInt(parseFloat(priceAmount) * 1e18),
                duration: BigInt(parseInt(duration) * 24 * 60 * 60), // Days to seconds
            });
        } catch (err) {
            console.error("Failed to create listing:", err);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
                <div className="text-neutral-400">Loading vault...</div>
            </div>
        );
    }

    if (error || !vault) {
        return (
            <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
                <div className="max-w-xl mx-auto text-center py-12">
                    <h1 className="text-2xl font-bold mb-4">Vault Not Found</h1>
                    <p className="text-neutral-400 mb-6">
                        This vault may not exist or has been redeemed.
                    </p>
                    <Button asChild>
                        <Link href="/">Back to Home</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const stateLabel = ["Open", "Paused", "Redeemed"][vault.state] || "Unknown";
    const isOwner = address?.toLowerCase() === vault.creator.toLowerCase();

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
            <div className="max-w-3xl mx-auto">
                {/* Back link */}
                <Link href="/" className="text-neutral-400 hover:text-neutral-200 text-sm mb-6 inline-block">
                    ← Back to Vaults
                </Link>

                {/* Vault Header */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-6">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 rounded-xl overflow-hidden bg-neutral-800 shadow-[0_0_20px_-5px_var(--color-primary)]">
                                {nftDisplay?.thumbnail ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={nftDisplay.thumbnail}
                                        alt={nftDisplay.name || "NFT"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs font-mono">
                                        NO IMAGE
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    <span>{formatVaultName(nftDisplay?.name).display}</span>
                                    {formatVaultName(nftDisplay?.name).full && (
                                        <button
                                            onClick={() => handleCopyTokenId(formatVaultName(nftDisplay?.name).full!)}
                                            className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                                            title={copied ? "Copied!" : "Copy Token ID"}
                                        >
                                            {copied ? (
                                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                        </button>
                                    )}
                                </h1>
                                <p className="text-neutral-400">
                                    Created by {formatAddress(vault.creator)}
                                </p>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm ${vault.state === VaultState.Open
                            ? "bg-green-900/50 text-green-400"
                            : "bg-neutral-800 text-neutral-400"
                            }`}>
                            {stateLabel}
                        </div>
                    </div>

                    {/* Vault Info */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-neutral-800/50 rounded-lg p-4">
                            <div className="text-sm text-neutral-400 mb-1">NFT Contract</div>
                            <div className="font-mono text-sm truncate">{vault.nftContract}</div>
                        </div>
                        <div className="bg-neutral-800/50 rounded-lg p-4">
                            <div className="text-sm text-neutral-400 mb-1">Token ID</div>
                            <div className="font-mono text-sm break-all line-clamp-2" title={vault.tokenId.toString()}>
                                #{vault.tokenId.toString().length > 20
                                    ? `${vault.tokenId.toString().slice(0, 10)}...${vault.tokenId.toString().slice(-10)}`
                                    : vault.tokenId.toString()}
                            </div>
                        </div>
                        <div className="bg-neutral-800/50 rounded-lg p-4">
                            <div className="text-sm text-neutral-400 mb-1">Share Token</div>
                            <div className="font-mono text-sm truncate">{vault.shareToken}</div>
                        </div>
                        <div className="bg-neutral-800/50 rounded-lg p-4">
                            <div className="text-sm text-neutral-400 mb-1">Max Supply</div>
                            <div className="font-bold">{formatAmount(vault.maxSupply)}</div>
                        </div>
                        <div className="bg-neutral-800/50 rounded-lg p-4">
                            <div className="text-sm text-neutral-400 mb-1">Policy</div>
                            <div className="text-sm">{vault.policy || "Default"}</div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {isConnected && vault.state === VaultState.Open && (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                        <h2 className="text-lg font-bold mb-4">Actions</h2>

                        {!showSellForm ? (
                            <div className="flex gap-3">
                                <Button onClick={() => setShowSellForm(true)}>
                                    Sell Shares
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href="/pools">Add Liquidity</Link>
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateListing} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-neutral-400 mb-2">
                                            Share Amount
                                        </label>
                                        <input
                                            type="number"
                                            value={shareAmount}
                                            onChange={(e) => setShareAmount(e.target.value)}
                                            placeholder="100"
                                            required
                                            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-neutral-400 mb-2">
                                            Price (MNT)
                                        </label>
                                        <input
                                            type="number"
                                            value={priceAmount}
                                            onChange={(e) => setPriceAmount(e.target.value)}
                                            placeholder="10"
                                            step="0.001"
                                            required
                                            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-neutral-400 mb-2">
                                        Duration (days)
                                    </label>
                                    <select
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100"
                                    >
                                        <option value="1">1 day</option>
                                        <option value="7">7 days</option>
                                        <option value="30">30 days</option>
                                    </select>
                                </div>

                                {listingError && (
                                    <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
                                        {listingError.message || "An error occurred"}
                                    </div>
                                )}

                                {isSuccess && (
                                    <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-300 text-sm">
                                        Listing created successfully!
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button type="submit" disabled={isPending || isConfirming}>
                                        {isPending ? "Waiting..." : isConfirming ? "Confirming..." : "Create Listing"}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setShowSellForm(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* Marketplace Link */}
                <div className="mt-6 text-center">
                    <Link
                        href="/marketplace"
                        className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                        View Marketplace →
                    </Link>
                </div>
            </div>
        </div>
    );
}
