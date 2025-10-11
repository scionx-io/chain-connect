import { WALLET_ICONS } from '../../utils/config.js';

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

  _debug(...args) {
    if (window.WALLET_DEBUG) {
      console.log('[WalletProviderResolver]', ...args);
    }
  }

  findProvider(rdns) {
    // 1. Check MIPD store
    const mipdProvider = this.findMIPDProvider(rdns);
    if (mipdProvider) return mipdProvider;

    // 2. Fallback to global providers
    return this.getGlobalProvider(rdns);
  }

  findMIPDProvider(rdns) {
    this._debug('Looking for MIPD provider:', rdns);
    const mipdProvider = this.mipdStore.getProviders().find(p => p.info.rdns === rdns);
    if (mipdProvider) {
      this._debug(`Found MIPD provider for RDNS ${rdns}:`, mipdProvider.info.name, 'with chains:', mipdProvider.info.chains);
      if (!mipdProvider.info.chains || (Array.isArray(mipdProvider.info.chains) && mipdProvider.info.chains.length === 0)) {
        mipdProvider.info.chains = this.inferChainsFromRDNS(rdns);
        this._debug(`Inferred chains for ${rdns}:`, mipdProvider.info.chains);
      }
      return mipdProvider;
    }
    return null;
  }

  inferChainsFromRDNS(rdns) {
    for (const [key, chains] of Object.entries(this.chainMappings)) {
      if (rdns.includes(key)) {
        this._debug(`Inferred chains for ${rdns}:`, chains);
        return chains;
      }
    }
    return [];
  }

  getGlobalProvider(rdns) {
    // Dynamically check window properties at runtime, ensuring window exists
    const globalProviders = {
      'io.metamask': {
        provider: typeof window !== 'undefined' ? window.ethereum : null,
        info: { name: 'MetaMask', rdns: 'io.metamask', chains: ['eip155:1'], icon: WALLET_ICONS.metamask }
      },
      'io.rabby': {
        provider: typeof window !== 'undefined' ? window.ethereum : null, // Rabby injects to window.ethereum like other EVM wallets
        info: { name: 'Rabby Wallet', rdns: 'io.rabby', chains: ['eip155:1'], icon: WALLET_ICONS.rabby || null }
      },
      'phantom': {
        provider: typeof window !== 'undefined' ? window.solana : null,
        info: { name: 'Phantom', rdns: 'phantom', chains: ['solana:101'], icon: WALLET_ICONS.phantom }
      },
      'tronlink': {
        provider: typeof window !== 'undefined' ? (window.tronWeb || window.tronLink) : null,
        info: { name: 'TronLink', rdns: 'tronlink', chains: ['tron:0x2b6653dc'], icon: WALLET_ICONS.tronlink }
      }
    };

    const provider = globalProviders[rdns];
    if (provider && provider.provider) {
      this._debug(`Found global provider for RDNS ${rdns}:`, provider.info.name);
      return provider;
    }
    this._debug(`No provider found for RDNS ${rdns}`);
    return null;
  }
}

export { WalletProviderResolver };