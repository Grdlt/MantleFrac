"use client";

import { useAccount, useBalance } from "wagmi";
import { mantleSepoliaTestnet } from "@/lib/chains";

/**
 * Hook to get user's native token (MNT) balance on Mantle
 */
export function useUserBalance() {
    const { address, isConnected } = useAccount();

    const { data, isLoading } = useBalance({
        address: address,
        chainId: mantleSepoliaTestnet.id,
    });

    return {
        balance: data?.formatted ?? "0",
        address: isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : undefined,
        loading: isLoading,
    };
}
