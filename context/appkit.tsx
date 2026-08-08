'use client';

import { wagmiAdapter, projectId, networks } from '@/config/appkit';
import { createAppKit } from '@reown/appkit/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';

const queryClient = new QueryClient();

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: networks as [typeof networks[0], ...typeof networks],
  defaultNetwork: networks[0],
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#D4940A',
    '--w3m-color-mix': '#FAFAF7',
    '--w3m-color-mix-strength': 10,
    '--w3m-font-family': 'var(--font-sans)',
    '--w3m-border-radius-master': '12px'
  }
});

export function AppKitProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
