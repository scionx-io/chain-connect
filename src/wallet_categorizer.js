// wallet_categorizer.js
// Pure functions for chain/RDNS → families

export class WalletCategorizer {
  static getFamiliesFromChains(chains) {
    const families = [];

    if (!chains) {
      return families;
    }

    if (chains.some(chain => chain.startsWith('eip155:'))) {
      families.push('evm');
    }
    if (chains.some(chain => chain.startsWith('solana:'))) {
      families.push('solana');
    }
    if (chains.some(chain => chain.startsWith('tron:'))) {
      families.push('tron');
    }

    return families;
  }

  static getFamiliesFromRdns(rdns) {
    const families = [];

    // EVM wallets
    if (rdns.includes('metamask') || rdns.includes('coinbase') ||
        rdns.includes('rabby') || rdns.includes('trust') ||
        rdns.includes('mathwallet')) {
      families.push('evm');
    }
    // Multi-chain wallets
    else if (rdns.includes('phantom')) {
      families.push('evm', 'solana');
    }
    // Solana wallets
    else if (rdns.includes('solflare') || rdns.includes('sollet')) {
      families.push('solana');
    }
    // Tron wallets
    else if (rdns.includes('tron') || rdns.includes('tokenpocket')) {
      families.push('tron');
    }

    return families;
  }

  static categorizeWallet(wallet) {
    // Primary: Use MIPD chain info (most reliable)
    const families = WalletCategorizer.getFamiliesFromChains(wallet.info.chains);

    // Only return families if we found supported chains (EVM, Solana, Tron)
    const supportedFamilies = families.filter(family => ['evm', 'solana', 'tron'].includes(family));

    if (supportedFamilies.length > 0) {
      return supportedFamilies;
    }

    // Fallback: RDNS matching for known wallets
    if (wallet.info.rdns) {
      return WalletCategorizer.getFamiliesFromRdns(wallet.info.rdns);
    }

    return [];
  }
}