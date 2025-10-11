import { WalletProviderResolver } from './services/wallet_provider_resolver.js';
import { WALLET_ICONS } from '../config.js';

class WalletDiscovery {
  constructor(mipdStore) {
    this.mipdStore = mipdStore;
    this.providerResolver = new WalletProviderResolver(mipdStore);
  }

  _debug(...args) {
    if (window.WALLET_DEBUG) {
      console.log('[WalletDiscovery]', ...args);
    }
  }

  _getFamiliesFromChains(chains) {
    const families = [];

    if (!chains) {
      this._debug('No chain info provided for wallet family detection');
      return families;
    }

    this._debug('Detecting wallet families from chains:', chains);

    if (chains.some(chain => chain.startsWith('eip155:'))) {
      this._debug('  -> Identified as EVM wallet');
      families.push('evm');
    }
    if (chains.some(chain => chain.startsWith('solana:'))) {
      this._debug('  -> Identified as Solana wallet');
      families.push('solana');
    }
    if (chains.some(chain => chain.startsWith('tron:'))) {
      this._debug('  -> Identified as Tron wallet');
      families.push('tron');
    }

    if (families.length === 0) {
      this._debug('  -> Could not identify wallet family from chains');
    }

    return families;
  }

  _getFamiliesFromRdns(rdns) {
    const families = [];

    // EVM wallets
    if (rdns.includes('metamask') || rdns.includes('coinbase') ||
        rdns.includes('rabby') || rdns.includes('trust') ||
        rdns.includes('mathwallet')) {
      families.push('evm');
      this._debug(`  -> Categorized as EVM based on RDNS: ${rdns}`);
    }
    // Multi-chain wallets
    else if (rdns.includes('phantom')) {
      families.push('evm', 'solana');
      this._debug(`  -> Categorized as Multi-chain (EVM and Solana) based on RDNS: ${rdns}`);
    }
    // Solana wallets
    else if (rdns.includes('solflare') || rdns.includes('sollet')) {
      families.push('solana');
      this._debug(`  -> Categorized as Solana based on RDNS: ${rdns}`);
    }
    // Tron wallets
    else if (rdns.includes('tron') || rdns.includes('tokenpocket')) {
      families.push('tron');
      this._debug(`  -> Categorized as Tron based on RDNS: ${rdns}`);
    }
    else {
      this._debug(`  -> Skipping wallet with RDNS ${rdns} - not recognized as EVM, Solana, or Tron wallet`);
    }

    return families;
  }

  _categorizeWallet(wallet) {
    this._debug(`Processing wallet: ${wallet.info.name} (RDNS: ${wallet.info.rdns}), chains:`, wallet.info.chains);

    // Primary: Use MIPD chain info (most reliable)
    const families = this._getFamiliesFromChains(wallet.info.chains);

    // Only return families if we found supported chains (EVM, Solana, Tron)
    const supportedFamilies = families.filter(family => ['evm', 'solana', 'tron'].includes(family));

    if (supportedFamilies.length > 0) {
      return supportedFamilies;
    }

    // Fallback: RDNS matching for known wallets
    if (wallet.info.rdns) {
      return this._getFamiliesFromRdns(wallet.info.rdns);
    }

    this._debug(`  -> Skipping wallet ${wallet.info.name} - doesn't support EVM, Solana, or Tron chains`);
    return [];
  }

  _getGlobalProviders() {
    const globalWallets = [];

    // Check for Phantom (window.solana)
    if (window.solana) {
      this._debug('Phantom/Solana wallet detected in browser');
      globalWallets.push({
        info: {
          name: 'Phantom',
          icon: WALLET_ICONS.phantom,
          rdns: 'phantom'
        },
        families: ['evm', 'solana']
      });
    }

    // Check for TronLink (window.tronWeb or window.tronLink)
    if (window.tronWeb || window.tronLink) {
      this._debug('TronLink/Tron wallet detected in browser');
      globalWallets.push({
        info: {
          name: 'TronLink',
          icon: WALLET_ICONS.tronlink,
          rdns: 'tronlink'
        },
        families: ['tron']
      });
    }

    return globalWallets;
  }

  _sortByPriority(wallets) {
    const priorityWallets = ['Phantom', 'MetaMask', 'Coinbase Wallet'];

    return wallets.sort((a, b) => {
      const aPriority = priorityWallets.indexOf(a.info.name);
      const bPriority = priorityWallets.indexOf(b.info.name);

      // If both are in priority list, sort by position in priority list
      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority;
      }

      // If only a is in priority list, a comes first
      if (aPriority !== -1) {
        return -1;
      }

      // If only b is in priority list, b comes first
      if (bPriority !== -1) {
        return 1;
      }

      // If neither is in priority list, maintain original order
      return 0;
    });
  }

  getDetectedWallets() {
    // Group all wallets by blockchain family
    const allGroupedWallets = {
      evm: [],
      solana: [],
      tron: [],
      multiChain: []
    };

    // Get MIPD wallets
    const mipdWallets = this.mipdStore.getProviders();
    this._debug('Total MIPD wallets detected:', mipdWallets.length);

    // Categorize MIPD wallets
    mipdWallets.forEach(wallet => {
      const families = this._categorizeWallet(wallet);

      if (families.length === 0) return; // Skip unsupported wallets

      const walletWithFamilies = { ...wallet, families };

      if (families.length > 1) {
        // Multi-chain wallet
        allGroupedWallets.multiChain.push(walletWithFamilies);
        this._debug(`  -> Categorized as Multi-chain (${families.join(', ')}) based on chain info`);
      } else {
        allGroupedWallets[families[0]].push(walletWithFamilies);
        this._debug(`  -> Categorized as ${families[0]} based on chain info`);
      }
    });

    // Add global providers (non-MIPD wallets)
    const globalWallets = this._getGlobalProviders();
    globalWallets.forEach(wallet => {
      // Check if wallet already exists in grouped wallets (avoid duplicates)
      const existsInMultiChain = allGroupedWallets.multiChain.some(w => w.info.name === wallet.info.name);
      const existsInSingleChain = [...allGroupedWallets.evm, ...allGroupedWallets.solana, ...allGroupedWallets.tron]
        .some(w => w.info.name === wallet.info.name);

      if (!existsInMultiChain && !existsInSingleChain) {
        if (wallet.families.length > 1) {
          allGroupedWallets.multiChain.push(wallet);
        } else {
          allGroupedWallets[wallet.families[0]].push(wallet);
        }
      }
    });

    this._debug('All grouped wallets:', {
      evm: allGroupedWallets.evm.map(w => w.info.name),
      solana: allGroupedWallets.solana.map(w => w.info.name),
      tron: allGroupedWallets.tron.map(w => w.info.name),
      multiChain: allGroupedWallets.multiChain.map(w => `${w.info.name} (${w.families.join(', ')})`)
    });

    // Flatten all wallets into a single array
    const allWallets = [
      ...allGroupedWallets.multiChain,
      ...allGroupedWallets.evm,
      ...allGroupedWallets.solana,
      ...allGroupedWallets.tron
    ];

    // Sort by priority
    this._sortByPriority(allWallets);

    this._debug('Sorted all wallets:', allWallets.map(w => w.info.name));

    // Split into top 4 and remaining
    const topWallets = allWallets.slice(0, 4);
    const remainingWallets = allWallets.slice(4);

    // Group remaining wallets by family
    const groupedWallets = {
      multiChain: [],
      evm: [],
      solana: [],
      tron: []
    };

    remainingWallets.forEach(wallet => {
      if (wallet.families.includes('evm') && wallet.families.includes('solana')) {
        groupedWallets.multiChain.push(wallet);
      } else if (wallet.families.includes('evm')) {
        groupedWallets.evm.push(wallet);
      } else if (wallet.families.includes('solana')) {
        groupedWallets.solana.push(wallet);
      } else if (wallet.families.includes('tron')) {
        groupedWallets.tron.push(wallet);
      }
    });

    return {
      topWallets,
      groupedWallets,
      totalCount: allWallets.length
    };
  }
}

export { WalletDiscovery };