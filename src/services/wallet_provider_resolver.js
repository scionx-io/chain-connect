import { WALLET_ICONS } from '../config.js';

class WalletProviderResolver {
  constructor(mipdStore) {
    this.mipdStore = mipdStore;
    this.chainMappings = {
      'metamask': ['eip155:1'],
      'coinbase': ['eip155:1'],
      'rabby': ['eip155:1'],
      'trust': ['eip155:1'],
      'mathwallet': ['eip155:1'],
      'phantom': ['solana:101'],
      'solflare': ['solana:101'],
      'sollet': ['solana:101'],
      'tron': ['tron:0x2b6653dc'],
      'tokenpocket': ['tron:0x2b6653dc'],
    };
  }

  findProvider(rdns) {
    // 1. Check MIPD store
    const mipdProvider = this.findMIPDProvider(rdns);
    if (mipdProvider) return mipdProvider;

    // 2. Fallback to global providers
    return this.getGlobalProvider(rdns);
  }

  findMIPDProvider(rdns) {
    const mipdProvider = this.mipdStore.getProviders().find(p => p.info.rdns === rdns);
    if (mipdProvider) {
      console.log(`Found MIPD provider for RDNS ${rdns}:`, mipdProvider.info.name, 'with chains:', mipdProvider.info.chains);
      if (!mipdProvider.info.chains) {
        mipdProvider.info.chains = this.inferChainsFromRDNS(rdns);
      }
      return mipdProvider;
    }
    return null;
  }

  inferChainsFromRDNS(rdns) {
    for (const [key, chains] of Object.entries(this.chainMappings)) {
      if (rdns.includes(key)) {
        console.log(`Inferred chains for ${rdns}:`, chains);
        return chains;
      }
    }
    return [];
  }

  getGlobalProvider(rdns) {
    // Dynamically check window properties at runtime
    const globalProviders = {
      'io.metamask': {
        provider: window.ethereum,
        info: { name: 'MetaMask', rdns: 'io.metamask', chains: ['eip155:1'], icon: WALLET_ICONS.metamask }
      },
      'phantom': {
        provider: window.solana,
        info: { name: 'Phantom', rdns: 'phantom', chains: ['solana:101'], icon: WALLET_ICONS.phantom }
      },
      'tronlink': {
        provider: window.tronWeb || window.tronLink,
        info: { name: 'TronLink', rdns: 'tronlink', chains: ['tron:0x2b6653dc'], icon: WALLET_ICONS.tronlink }
      }
    };

    const provider = globalProviders[rdns];
    if (provider && provider.provider) {
      console.log(`Found global provider for RDNS ${rdns}:`, provider.info.name);
      return provider;
    }
    console.log(`No provider found for RDNS ${rdns}`);
    return null;
  }
}

export { WalletProviderResolver };