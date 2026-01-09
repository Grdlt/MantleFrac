import { http, createConfig } from 'wagmi';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { mantleMainnet, mantleSepoliaTestnet, defaultChain } from './chains';

// WalletConnect Project ID - Get from https://cloud.walletconnect.com
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

/**
 * Wagmi configuration for MantleFrac
 */
export const wagmiConfig = createConfig({
  chains: [mantleSepoliaTestnet, mantleMainnet],
  connectors: [
    injected(),
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: 'MantleFrac',
        description: 'RWA Fractionalization Platform on Mantle',
        url: 'https://mantlefrac.xyz',
        icons: ['https://mantlefrac.xyz/icon.png'],
      },
    }),
    coinbaseWallet({
      appName: 'MantleFrac',
    }),
  ],
  transports: {
    [mantleSepoliaTestnet.id]: http(),
    [mantleMainnet.id]: http(),
  },
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
