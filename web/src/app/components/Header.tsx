"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletButtons from "./WalletButtons";
import { usePlatformTreasuryBalance } from "@/hooks/usePlatformTreasury";
import { useUserBalance } from "@/hooks/useUserBalance";

const navItems = [
  { href: "/", label: "Vaults", icon: "◈" },
  { href: "/marketplace", label: "Marketplace", icon: "⚡" },
  { href: "/pools", label: "Pools", icon: "◎" },
];

export default function Header() {
  const pathname = usePathname();
  const treasuryBalance = usePlatformTreasuryBalance();
  const { balance: userBalance, address, loading } = useUserBalance();

  const formatBalance = (bal: string) => {
    const num = Number.parseFloat(bal || "0");
    if (num === 0) return "0";
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(4).replace(/\.?0+$/, "");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-9 w-9 rounded-lg overflow-hidden shadow-[0_0_20px_-5px_var(--color-primary)] group-hover:shadow-[0_0_30px_-5px_var(--color-primary)] transition-shadow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="MantleFrac Logo"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="hidden sm:block text-lg font-bold tracking-tight">
              <span className="text-white">Mantle</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Frac</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1 rounded-full bg-white/5 border border-white/10 p-1 backdrop-blur-sm">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive
                    ? "bg-primary/20 text-primary shadow-[0_0_15px_-5px_var(--color-primary)]"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                  <span className="text-xs opacity-70">{item.icon}</span>
                  {item.label}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full border border-primary/30" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Treasury Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-neutral-500">Protocol:</span>
              <span className="text-white font-medium">{treasuryBalance}</span>
            </div>

            {/* User Balance */}
            {address && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[10px] text-white font-bold">
                  {address.slice(2, 4).toUpperCase()}
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-neutral-500 font-mono">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </div>
                  <div className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    {loading ? "..." : `${formatBalance(userBalance)} MNT`}
                  </div>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <Link
              href="/wizard/deposit"
              className="group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-primary to-secondary px-5 text-sm font-bold text-white shadow-[0_0_20px_-5px_var(--color-primary)] transition-all duration-300 hover:shadow-[0_0_30px_-5px_var(--color-secondary)] hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                <span className="text-base">+</span>
                <span className="hidden sm:inline">Fractionalize</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            </Link>

            {/* Wallet */}
            <WalletButtons />
          </div>
        </div>
      </div>
    </header>
  );
}
