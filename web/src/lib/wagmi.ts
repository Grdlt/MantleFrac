import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { mantleMainnet, mantleSepoliaTestnet, defaultChain } from './chains';

/**
 * Wagmi configuration for MantleFrac
 * 
 * Note: WalletConnect and CoinbaseWallet removed to avoid SSR issues.
 * Only injected (MetaMask) is used for now.
 * To enable WalletConnect, set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env.local
 */
export const wagmiConfig = createConfig({
  chains: [mantleSepoliaTestnet, mantleMainnet],
  connectors: [
    injected(),
  ],
  transports: {
    [mantleSepoliaTestnet.id]: http(),
    [mantleMainnet.id]: http(),
  },
  ssr: true, // Enable SSR support
});

/**
 * Default chain for the app
 */
export { defaultChain };

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
