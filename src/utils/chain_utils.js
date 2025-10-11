// Chain ID to Name mapping
export const CHAIN_NAMES = {
  // Ethereum
  '1': 'Ethereum Mainnet',
  '0x1': 'Ethereum Mainnet',
  '17000': 'Ethereum Holesky Testnet',
  '0x4268': 'Ethereum Holesky Testnet',
  '11155111': 'Ethereum Sepolia Testnet',
  '0xaa36a7': 'Ethereum Sepolia Testnet',
  '560048': 'Ethereum Hoodi Testnet',

  // Binance Smart Chain
  '56': 'BSC Mainnet',
  '0x38': 'BSC Mainnet',
  '97': 'BSC Testnet',
  '0x61': 'BSC Testnet',

  // Avalanche
  '43114': 'Avalanche C-Chain',
  '0xa86a': 'Avalanche C-Chain',
  '43115': 'Avalanche P-Chain',
  '43116': 'Avalanche X-Chain',
  '43113': 'Avalanche Fuji Testnet',
  '0xa869': 'Avalanche Fuji Testnet',

  // Polygon
  '137': 'Polygon Mainnet',
  '0x89': 'Polygon Mainnet',
  '80002': 'Polygon Amoy Testnet',

  // Cronos
  '25': 'Cronos Mainnet',
  '0x19': 'Cronos Mainnet',
  '338': 'Cronos Testnet',
  '0x152': 'Cronos Testnet',

  // Arbitrum
  '42161': 'Arbitrum One',
  '0xa4b1': 'Arbitrum One',
  '421613': 'Arbitrum Goerli Testnet',
  '0x66ee9': 'Arbitrum Goerli Testnet',
  '421614': 'Arbitrum Sepolia Testnet',
  '0x66eee': 'Arbitrum Sepolia Testnet',

  // Fantom
  '250': 'Fantom Opera',
  '0xfa': 'Fantom Opera',
  '4002': 'Fantom Testnet',
  '0xfa2': 'Fantom Testnet',

  // zkSync
  '324': 'zkSync Era Mainnet',
  '0x144': 'zkSync Era Mainnet',
  '300': 'zkSync Era Testnet',
  '0x12c': 'zkSync Era Testnet',

  // Solana
  '900': 'Solana Mainnet',
  '901': 'Solana Devnet',

  // Tron
  '728126428': 'Tron Mainnet',
  '2494104990': 'Tron Shasta Testnet',
  '3448148188': 'Tron Nile Testnet',

  // TON
  '1100': 'TON Mainnet',
  '1101': 'TON Testnet',

  // Near
  '1200': 'Near Mainnet',
  '1201': 'Near Testnet',

  // Algorand
  '1300': 'Algorand Mainnet',
  '1301': 'Algorand Testnet',

  // Optimism
  '10': 'Optimism Mainnet',
  '0xa': 'Optimism Mainnet',
  '11155420': 'Optimism Sepolia Testnet',

  // Starknet
  '400': 'Starknet Mainnet',
  '401': 'Starknet Testnet',

  // Aptos
  '1400': 'Aptos Mainnet',
  '1401': 'Aptos Testnet',

  // Solana (using the project's internal chain numbering)
  '101': 'Solana Mainnet Beta',
  '102': 'Solana Testnet',
  '103': 'Solana Devnet',
  
  // Sui
  '201': 'Sui Mainnet',
  '202': 'Sui Testnet', 
  '203': 'Sui Devnet',

  // Base
  '8453': 'Base Mainnet',
  '0x2105': 'Base Mainnet',
  '84532': 'Base Sepolia Testnet',

  // Stellar
  '1500': 'Stellar Mainnet',
  '1501': 'Stellar Testnet',

  // XRP Ledger
  '1600': 'XRP Ledger Mainnet',
  '1601': 'XRP Ledger Testnet',

  // Cosmoshub
  'cosmoshub-4': 'Cosmoshub Mainnet',
  'osmosis-1': 'Osmosis Mainnet',
  'osmo-test-5': 'Osmosis Testnet',

  // Stacks
  '1700': 'Stacks Mainnet',
  '1701': 'Stacks Testnet',

  // Bitcoin
  '1800': 'Bitcoin Mainnet',
  '1801': 'Bitcoin Testnet',

  // Mantle
  '5000': 'Mantle Mainnet',
  '0x1388': 'Mantle Mainnet',
  '5003': 'Mantle Testnet',

  // Botanix
  '3637': 'Botanix Mainnet',
  '3636': 'Botanix Testnet',

  // Kaia
  '8217': 'Kaia Mainnet',
  '1001': 'Kaia Testnet',

  // Local development
  '31337': 'Localhost',
  '0x7a69': 'Localhost',

  // Non-EVM chains (symbol-based)
  'solana': 'Solana Mainnet',
  'solana:devnet': 'Solana Devnet',
  'ton': 'TON Mainnet',
  'ton:testnet': 'TON Testnet',
  'near': 'Near Mainnet',
  'near:testnet': 'Near Testnet',
  'algorand': 'Algorand Mainnet',
  'algorand:testnet': 'Algorand Testnet',
  'aptos': 'Aptos Mainnet',
  'aptos:testnet': 'Aptos Testnet',
  'sui': 'Sui Mainnet',
  'sui:devnet': 'Sui Devnet',
  'sui:testnet': 'Sui Testnet',
  'stellar': 'Stellar Mainnet',
  'stellar:testnet': 'Stellar Testnet',
  'xrpl': 'XRP Ledger Mainnet',
  'xrpl:testnet': 'XRP Ledger Testnet',
  'cosmos': 'Cosmoshub Mainnet',
  'cosmos:testnet': 'Cosmoshub Testnet',
  'osmosis': 'Osmosis Mainnet',
  'osmosis:testnet': 'Osmosis Testnet',
  'stacks': 'Stacks Mainnet',
  'stacks:testnet': 'Stacks Testnet',
  'bitcoin': 'Bitcoin Mainnet',
  'bitcoin:testnet': 'Bitcoin Testnet',
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