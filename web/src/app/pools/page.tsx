"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useChainId } from "wagmi";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { useSwap, useAmountOut } from "@/hooks/contracts";
import { gqlFetch, DEFAULT_NETWORK } from "@/lib/graphql";

type Pool = {
    poolId: string;
    tokenA: string;
    tokenB: string;
    reserveA: string;
    reserveB: string;
    feeBps: number;
};

export default function PoolsPage() {
    const { isConnected } = useAccount();
    const chainId = useChainId();
    const [pools, setPools] = useState<Pool[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
    const [swapAmount, setSwapAmount] = useState("");
    const [swapDirection, setSwapDirection] = useState<"AtoB" | "BtoA">("AtoB");

    const { swap, isPending, isConfirming, isSuccess, error: swapError } = useSwap();

    useEffect(() => {
        async function fetchPools() {
            try {
                const query = `
          query Pools($network: String) {
            pools(network: $network, limit: 50) {
              poolId
              tokenA
              tokenB
              reserveA
              reserveB
              feeBps
            }
          }
        `;
                const data = await gqlFetch<{ pools: Pool[] }>(query, {
                    network: DEFAULT_NETWORK,
                });
                setPools(data.pools || []);
            } catch (err) {
                console.error("Failed to fetch pools:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchPools();
    }, []);

    const formatAddress = (addr: string) =>
        addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

    const formatReserve = (amount: string) => {
        try {
            return parseFloat(formatUnits(BigInt(amount || "0"), 18)).toLocaleString(undefined, {
                maximumFractionDigits: 2,
            });
        } catch {
            return "0";
        }
    };

    const handleSwap = async () => {
        if (!selectedPool || !swapAmount) return;

        const tokenIn = swapDirection === "AtoB"
            ? selectedPool.tokenA
            : selectedPool.tokenB;

        try {
            await swap({
                poolId: selectedPool.poolId as `0x${string}`,
                tokenIn: tokenIn as `0x${string}`,
                amountIn: BigInt(parseFloat(swapAmount) * 1e18),
                minAmountOut: BigInt(0), // In production, calculate slippage
            });
        } catch (err) {
            console.error("Failed to swap:", err);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100">
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Liquidity Pools</h1>
                        <p className="text-neutral-400 mt-1">
                            Trade and provide liquidity to earn fees
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Pool List */}
                    <div className="lg:col-span-2 space-y-3">
                        <h2 className="text-lg font-semibold mb-4">Available Pools</h2>

                        {loading ? (
                            <div className="text-center py-12 text-neutral-400">
                                Loading pools...
                            </div>
                        ) : pools.length === 0 ? (
                            <div className="text-center py-12 bg-neutral-900 border border-neutral-800 rounded-lg">
                                <div className="text-lg font-medium mb-2">No pools yet</div>
                                <p className="text-neutral-400">
                                    Create the first liquidity pool!
                                </p>
                            </div>
                        ) : (
                            pools.map((pool) => (
                                <div
                                    key={pool.poolId}
                                    onClick={() => setSelectedPool(pool)}
                                    className={`bg-neutral-900 border rounded-lg p-4 cursor-pointer transition-colors ${selectedPool?.poolId === pool.poolId
                                        ? "border-purple-500"
                                        : "border-neutral-800 hover:border-neutral-600"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex -space-x-2">
                                                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold border-2 border-neutral-900">
                                                    A
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold border-2 border-neutral-900">
                                                    B
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-medium">
                                                    {formatAddress(pool.tokenA)} / {formatAddress(pool.tokenB)}
                                                </div>
                                                <div className="text-sm text-neutral-400">
                                                    Fee: {pool.feeBps / 100}%
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-neutral-400">TVL</div>
                                            <div className="font-bold">
                                                {formatReserve(pool.reserveA)} / {formatReserve(pool.reserveB)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Swap Panel */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 h-fit">
                        <h2 className="text-lg font-semibold mb-4">Swap</h2>

                        {!selectedPool ? (
                            <div className="text-center py-8 text-neutral-400">
                                Select a pool to swap
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-neutral-400 mb-2">
                                        From
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={swapAmount}
                                            onChange={(e) => setSwapAmount(e.target.value)}
                                            placeholder="0.0"
                                            className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100"
                                        />
                                        <select
                                            value={swapDirection}
                                            onChange={(e) => setSwapDirection(e.target.value as "AtoB" | "BtoA")}
                                            className="px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100"
                                        >
                                            <option value="AtoB">Token A</option>
                                            <option value="BtoA">Token B</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="text-center text-neutral-500">↓</div>

                                <div>
                                    <label className="block text-sm text-neutral-400 mb-2">
                                        To (estimated)
                                    </label>
                                    <div className="px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-lg text-neutral-400">
                                        Calculating...
                                    </div>
                                </div>

                                {swapError && (
                                    <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
                                        {swapError.message}
                                    </div>
                                )}

                                {isSuccess && (
                                    <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-300 text-sm">
                                        Swap successful!
                                    </div>
                                )}

                                {isConnected ? (
                                    <Button
                                        onClick={handleSwap}
                                        disabled={!swapAmount || isPending || isConfirming}
                                        className="w-full"
                                    >
                                        {isPending ? "Waiting..." : isConfirming ? "Confirming..." : "Swap"}
                                    </Button>
                                ) : (
                                    <div className="text-center text-neutral-400 text-sm">
                                        Connect wallet to swap
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
