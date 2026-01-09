'use client';

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { mantleSepoliaTestnet, mantleMainnet, isSupportedChain } from '@/lib/chains';

/**
 * Connect wallet button component
 */
export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isWrongNetwork = isConnected && !isSupportedChain(chainId);

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Handle network switch
  const handleSwitchNetwork = () => {
    switchChain({ chainId: mantleSepoliaTestnet.id });
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {isWrongNetwork ? (
          <button
            onClick={handleSwitchNetwork}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Switch to Mantle
          </button>
        ) : (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            {chainId === mantleMainnet.id ? 'Mainnet' : 'Testnet'}
          </span>
        )}
        <span className="px-3 py-2 bg-gray-100 rounded-lg font-mono text-sm">
          {formatAddress(address)}
        </span>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          disabled={isPending}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Connecting...' : `Connect ${connector.name}`}
        </button>
      ))}
    </div>
  );
}

/**
 * Simple connect button (single button)
 */
export function SimpleConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isWrongNetwork = isConnected && !isSupportedChain(chainId);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (isConnected && address) {
    if (isWrongNetwork) {
      return (
        <button
          onClick={() => switchChain({ chainId: mantleSepoliaTestnet.id })}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
        >
          Switch to Mantle
        </button>
      );
    }

    return (
      <button
        onClick={() => disconnect()}
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
      >
        {formatAddress(address)}
      </button>
    );
  }

  // Use injected (MetaMask) as default
  const injectedConnector = connectors.find((c) => c.id === 'injected');

  return (
    <button
      onClick={() => injectedConnector && connect({ connector: injectedConnector })}
      disabled={isPending}
      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
