import { cookieStorage, createStorage } from '@wagmi/core';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { arbitrumSepolia } from '@reown/appkit/networks';

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'b16882842344ea7a3f1a64a5cedb1007';

export const networks = [arbitrumSepolia];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});

export const config = wagmiAdapter.wagmiConfig;
