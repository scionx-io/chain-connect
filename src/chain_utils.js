// Chain ID to Name mapping
export const CHAIN_NAMES = {
  // Ethereum Mainnet
  '1': 'Ethereum Mainnet',
  '0x1': 'Ethereum Mainnet',
  
  // Ethereum Testnets
  '5': 'Goerli Testnet',
  '0x5': 'Goerli Testnet',
  '11155111': 'Sepolia Testnet',
  '0xaa36a7': 'Sepolia Testnet',
  '42161': 'Arbitrum One',
  '0xa4b1': 'Arbitrum One',
  '10': 'Optimism',
  '0xa': 'Optimism',
  
  // Solana
  'solana': 'Solana Mainnet',
  'solana:testnet': 'Solana Testnet',
  'solana:devnet': 'Solana Devnet',
  
  // Tron
  '728126428': 'Tron Mainnet',
  '0x2b6653dc': 'Tron Mainnet',
  '1': 'Tron Nile Testnet',  // Note: Tron also uses 1 for testnet, different from ETH
  '0x1': 'Tron Nile Testnet',
  
  // Polygon
  '137': 'Polygon Mainnet',
  '0x89': 'Polygon Mainnet',
  '80001': 'Polygon Mumbai Testnet',
  '0x13881': 'Polygon Mumbai Testnet',
  
  // Binance Smart Chain
  '56': 'Binance Smart Chain',
  '0x38': 'Binance Smart Chain',
  '97': 'BSC Testnet',
  '0x61': 'BSC Testnet',
  
  // Avalanche
  '43114': 'Avalanche C-Chain',
  '0xa86a': 'Avalanche C-Chain',
  '43113': 'Avalanche Fuji Testnet',
  '0xa869': 'Avalanche Fuji Testnet',
  
  // Fantom
  '250': 'Fantom Opera',
  '0xfa': 'Fantom Opera',
  '4002': 'Fantom Testnet',
  '0xfa2': 'Fantom Testnet',
  
  // Local development
  '31337': 'Localhost',
  '0x7a69': 'Localhost'
};

/**
 * Get the human-readable name of a chain from its ID
 * @param {string|number} chainId - The chain ID
 * @param {string} walletType - The type of wallet (evm, solana, tron)
 * @returns {string} Human-readable chain name or the original chain ID if not found
 */
export function getChainName(chainId, walletType = 'evm') {
  if (!chainId) return 'Unknown';
  
  // For EVM chains, normalize to string format
  if (walletType === 'evm') {
    // Convert from hex to decimal if needed
    if (typeof chainId === 'string' && chainId.startsWith('0x')) {
      const decimalChainId = parseInt(chainId, 16).toString();
      return CHAIN_NAMES[chainId] || CHAIN_NAMES[decimalChainId] || chainId;
    }
    return CHAIN_NAMES[chainId.toString()] || chainId.toString();
  }
  
  // For Solana and Tron chains
  return CHAIN_NAMES[chainId.toString()] || chainId.toString();
}

/**
 * Format chain display for UI
 * @param {string|number} chainId - The chain ID
 * @param {string} walletType - The wallet type
 * @param {string} customLabel - Optional custom label to prepend
 * @returns {string} Formatted chain display string
 */
export function formatChainDisplay(chainId, walletType = 'evm', customLabel = 'Chain') {
  const chainName = getChainName(chainId, walletType);
  return `${customLabel}: ${chainName}`;
}