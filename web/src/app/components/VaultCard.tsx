"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getFeeSchedule,
  getVaultEscrowBalance,
  getVaultTreasuryBalance,
  type Vault,
} from "@/lib/api/home";
import { getVaultNftDisplay } from "@/lib/api/vault";
import { getPoolsByVault, type Pool } from "@/lib/api/pools";
import {
  pickPrimaryPool,
  computeSharePrice,
  computeTvl,
} from "@/lib/market";
import { fetchListings } from "@/lib/api/listings";

type VaultCardData = {
  fee: Awaited<ReturnType<typeof getFeeSchedule>>;
  escrow: string;
  treasury: string;
  nft: Awaited<ReturnType<typeof getVaultNftDisplay>> | null;
  pools: Pool[];
  listings: Awaited<ReturnType<typeof fetchListings>>;
};

export default function VaultCard({ v }: { v: Vault }) {
  const [data, setData] = useState<VaultCardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getFeeSchedule(v.vaultId),
      getVaultEscrowBalance(v.vaultId),
      getVaultTreasuryBalance(v.vaultId),
      getVaultNftDisplay(v.vaultId).catch(() => null),
      getPoolsByVault(v.vaultId).catch(() => [] as Pool[]),
      fetchListings(v.vaultId).catch(() => []),
    ])
      .then(([fee, escrow, treasury, nft, pools, listings]) => {
        if (!cancelled) {
          setData({ fee, escrow, treasury, nft, pools, listings });
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [v.vaultId]);

  if (loading || !data) {
    return (
      <div className="rounded-md border border-neutral-800 bg-neutral-900 p-4">
        <div className="h-44 w-full animate-pulse bg-neutral-800 rounded" />
        <div className="mt-3 space-y-2">
          <div className="h-4 w-3/4 animate-pulse bg-neutral-800 rounded" />
          <div className="h-4 w-1/2 animate-pulse bg-neutral-800 rounded" />
        </div>
      </div>
    );
  }

  const { fee, treasury, nft, pools, listings } = data;

  const activeFeeBps = typeof fee?.feeBps === "number" ? fee.feeBps : 50;
  const activeVaultSplitBps =
    typeof fee?.vaultSplitBps === "number" ? fee.vaultSplitBps : 2000;
  const activeProtocolSplitBps =
    typeof fee?.protocolSplitBps === "number" ? fee.protocolSplitBps : 8000;
  const feeStr = `${activeFeeBps} bps`; // Simplified for cleaner UI

  // Derive price/TVL using same logic as vault page
  const poolsCount = pools.length;
  const primaryPool = poolsCount ? pickPrimaryPool(pools) : null;
  const sharePrice = computeSharePrice(primaryPool, v.shareSymbol);
  const tvl = computeTvl(pools);
  const quoteSymbol = primaryPool
    ? primaryPool.assetA === v.shareSymbol
      ? String(primaryPool.assetB || "MNT")
      : String(primaryPool.assetA || "MNT")
    : "MNT";
  const priceStr =
    sharePrice == null || !Number.isFinite(sharePrice)
      ? "-"
      : `${sharePrice.toFixed(4)} ${quoteSymbol}`;
  const tvlStr =
    tvl == null || !Number.isFinite(tvl)
      ? "-"
      : `${tvl.toFixed(2)} ${quoteSymbol}`;
  const title = nft?.name || v.shareSymbol || v.vaultId;
  const subtitle = `${v.collection ?? ""} ${v.tokenId ? `#${v.tokenId}` : ""
    }`.trim();
  const img = nft?.thumbnail || null;
  const openListings = listings.filter(
    (l) => String(l.status || "").toLowerCase() === "open"
  ).length;

  return (
    <div className="group relative overflow-hidden rounded-xl bg-neutral-900/40 border border-white/5 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_-10px_var(--color-primary)] hover:-translate-y-1">
      {/* Shine Effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out] z-20 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]" />
      </div>
      <Link
        href={`/vault/${encodeURIComponent(v.vaultId)}`}
        className="block"
        aria-label={`Open vault ${v.vaultId}`}
      >
        <div className="relative h-48 w-full overflow-hidden bg-neutral-950">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-950 text-neutral-600 text-xs font-mono border-b border-white/5">
              NO IMAGE
            </div>
          )}

          {/* Enhanced Gradient Overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />

          {/* Top Badges */}
          <div className="absolute left-3 top-3 flex items-center gap-2">
            {v.shareSymbol ? (
              <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md shadow-lg">
                ${v.shareSymbol}
              </span>
            ) : null}
          </div>

          <div className="absolute right-3 top-3 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-md border shadow-lg ${v.state === "Open"
              ? "bg-green-500/20 text-green-400 border-green-500/30"
              : "bg-neutral-800/80 text-neutral-400 border-neutral-700"
              }`}>
              {String(v.state || "Unknown").toUpperCase()}
            </span>
          </div>

          {/* Bottom Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black to-transparent">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="line-clamp-1 text-lg font-bold text-white tracking-tight group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <p className="line-clamp-1 text-xs text-neutral-400 font-mono mt-0.5">
                  {subtitle || "No Description"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <div className="p-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-white/5 p-2.5 border border-white/5 group-hover:border-primary/20 transition-colors">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Price</div>
            <div className="font-mono text-sm font-medium text-neutral-200">{priceStr}</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2.5 border border-white/5 group-hover:border-primary/20 transition-colors">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">TVL</div>
            <div className="font-mono text-sm font-medium text-neutral-200">{tvlStr}</div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono px-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
              Pools: <span className="text-neutral-300">{poolsCount}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary/50"></span>
              Listings: <span className="text-neutral-300">{openListings}</span>
            </span>
          </div>
          <div>Fee: <span className="text-neutral-300">{feeStr}</span></div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {poolsCount > 0 ? (
            <Link
              href={`/vault/${encodeURIComponent(v.vaultId)}/trade`}
              className="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-medium text-white transition-all hover:bg-white/10 hover:border-primary/30 hover:text-primary active:scale-95"
            >
              Trade
            </Link>
          ) : (
            <div className="flex items-center justify-center rounded-lg border border-white/5 bg-transparent py-2 text-xs font-medium text-neutral-600 cursor-not-allowed">
              No Pools
            </div>
          )}
          <Link
            href={`/vault/${encodeURIComponent(v.vaultId)}`}
            className="flex items-center justify-center rounded-lg bg-primary py-2 text-xs font-bold text-white shadow-[0_0_15px_-5px_var(--color-primary)] transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_-5px_var(--color-primary)] hover:-translate-y-0.5 active:scale-95"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
