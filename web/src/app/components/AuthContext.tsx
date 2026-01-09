"use client";

import { createContext, useContext, ReactNode, useCallback } from "react";
import { useAccount, useConnect } from "wagmi";

interface AuthContextType {
  isLoggedIn: boolean;
  address: string | undefined;
  authenticate: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  address: undefined,
  authenticate: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();

  const authenticate = useCallback(() => {
    // Use injected (MetaMask) as default connector
    const injectedConnector = connectors.find((c) => c.id === "injected");
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    } else if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [connect, connectors]);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: isConnected,
        address,
        authenticate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
