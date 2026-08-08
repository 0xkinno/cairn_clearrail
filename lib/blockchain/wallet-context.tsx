"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";

interface WalletContextType {
  isConnected: boolean;
  connecting: boolean;
  accountId: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  provider: any;
  chainId: string | null;
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  connecting: true,
  accountId: null,
  connect: async () => {},
  disconnect: async () => {},
  provider: null,
  chainId: null,
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [provider, setProvider] = useState<any>(null);

  const ARBITRUM_SEPOLIA_CHAIN_ID = "0x66eee"; // 421614 in decimal

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedAccount = localStorage.getItem("clearrail_wallet_address");
    if (savedAccount) {
      setAccountId(savedAccount);
    }

    const checkConnection = async () => {
      const anyWindow = window as any;
      if (anyWindow.ethereum) {
        try {
          const browserProvider = new ethers.BrowserProvider(anyWindow.ethereum);
          setProvider(browserProvider);

          // Get current network chain ID
          const currentChainId = await anyWindow.ethereum.request({ method: "eth_chainId" });
          setChainId(currentChainId);

          const accounts = await anyWindow.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            const normalized = ethers.getAddress(accounts[0]);
            setAccountId(normalized);
            localStorage.setItem("clearrail_wallet_address", normalized);
          } else {
            setAccountId(null);
            localStorage.removeItem("clearrail_wallet_address");
          }
        } catch (err) {
          console.error("Failed to check wallet connection status:", err);
        }
      }
      setConnecting(false);
    };

    checkConnection();

    // Listeners for Metamask / Wallet updates
    const anyWindow = window as any;
    if (anyWindow.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          const normalized = ethers.getAddress(accounts[0]);
          setAccountId(normalized);
          localStorage.setItem("clearrail_wallet_address", normalized);
        } else {
          setAccountId(null);
          localStorage.removeItem("clearrail_wallet_address");
        }
      };

      const handleChainChanged = (newChainId: string) => {
        setChainId(newChainId);
        window.location.reload();
      };

      anyWindow.ethereum.on("accountsChanged", handleAccountsChanged);
      anyWindow.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        anyWindow.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        anyWindow.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  const switchNetwork = async () => {
    const anyWindow = window as any;
    if (!anyWindow.ethereum) return;
    try {
      await anyWindow.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARBITRUM_SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // 4902 error code indicates the chain has not been added to Metamask
      if (switchError.code === 4902) {
        try {
          await anyWindow.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
                chainName: "Arbitrum Sepolia Testnet",
                nativeCurrency: {
                  name: "Ethereum",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
                blockExplorerUrls: ["https://sepolia.arbiscan.io"],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add Arbitrum Sepolia network:", addError);
        }
      } else {
        console.error("Failed to switch to Arbitrum Sepolia network:", switchError);
      }
    }
  };

  const connect = async () => {
    const anyWindow = window as any;
    if (!anyWindow.ethereum) {
      alert("No Ethereum wallet extension detected. Please install Metamask or Rabby.");
      return;
    }

    setConnecting(true);
    try {
      const accounts = await anyWindow.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) {
        const normalized = ethers.getAddress(accounts[0]);
        setAccountId(normalized);
        localStorage.setItem("clearrail_wallet_address", normalized);

        const currentChainId = await anyWindow.ethereum.request({ method: "eth_chainId" });
        setChainId(currentChainId);

        if (currentChainId !== ARBITRUM_SEPOLIA_CHAIN_ID) {
          await switchNetwork();
        }
      }
    } catch (err) {
      console.error("User rejected wallet connection:", err);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    setAccountId(null);
    localStorage.removeItem("clearrail_wallet_address");
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected: !!accountId,
        connecting,
        accountId,
        connect,
        disconnect,
        provider,
        chainId,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useNearWallet = () => {
  // Alias context hook to useNearWallet to minimize changes across other UI pages
  const context = useContext(WalletContext);
  return {
    isConnected: context.isConnected,
    connecting: context.connecting,
    accountId: context.accountId,
    connect: context.connect,
    disconnect: context.disconnect,
    wallet: context.provider ? {} : null, // mock selector wallet
    selector: null,
  };
};

export const useEVMWallet = () => useContext(WalletContext);

export default WalletContext;
