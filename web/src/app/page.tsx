"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./components/AuthContext";
import HomePage from "./components/HomePage";
import VaultCard from "./components/VaultCard";
import { getVaults } from "@/lib/api/home";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function fetchVaults() {
    return await getVaults(50);
}

function VaultList() {
    const [vaults, setVaults] = useState<Awaited<ReturnType<typeof fetchVaults>>>(
        []
    );
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        fetchVaults().then((v) => {
            if (!cancelled) {
                setVaults(v);
                setLoading(false);
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#08080c]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-center py-24">
                        <div className="flex items-center gap-3 text-neutral-400">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            Loading vaults...
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#08080c]">
            {/* Hero Section */}
            <div className="relative overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] translate-y-1/2" />

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
                                Explore Vaults
                            </h1>
                            <p className="text-neutral-400 max-w-xl">
                                Discover fractionalized NFTs and trade shares in exclusive
                                digital assets on Mantle Network.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/marketplace"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
                            >
                                Marketplace
                            </Link>
                            <Link
                                href="/wizard/deposit"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-sm font-medium text-white shadow-[0_0_20px_-5px_var(--color-primary)] hover:shadow-[0_0_30px_-5px_var(--color-secondary)] transition-all hover:scale-105"
                            >
                                + Create Vault
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="border-b border-white/5 bg-white/[0.02]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="text-neutral-500">Total Vaults:</span>
                                <span className="text-white font-medium">{vaults.length}</span>
                            </div>
                            <div className="w-px h-4 bg-white/10" />
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-neutral-500">Network:</span>
                                <span className="text-white font-medium">Mantle Sepolia</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vault Grid */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {vaults.length === 0 ? (
                    <div className="text-center py-24 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <span className="text-3xl">M</span>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            No vaults yet
                        </h2>
                        <p className="text-neutral-400 max-w-md mx-auto mb-8">
                            Be the first to fractionalize an NFT and create tradable shares on
                            Mantle Network.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <Button asChild variant="gradient" size="lg">
                                <Link href="/wizard/deposit">Fractionalize Your NFT</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg">
                                <Link href="/marketplace">Explore Marketplace</Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {vaults.map((v) => (
                            <li key={v.vaultId}>
                                <VaultCard v={v} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}

export default function Home() {
    const { isLoggedIn, authenticate } = useAuth();

    if (!isLoggedIn) {
        return <HomePage onConnect={authenticate} />;
    }

    return <VaultList />;
}
