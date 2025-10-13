import metamaskIcon from '../icons/metamask.svg';
import phantomIcon from '../icons/phantom.svg';
import tronlinkIcon from '../icons/tronlink.svg';
import rabbyIcon from '../icons/rabby.svg';

export const WALLET_ICONS = {
  metamask: metamaskIcon,
  phantom: phantomIcon,
  tronlink: tronlinkIcon,
  rabby: rabbyIcon,
};

// Chain ID constants
export const CHAIN_IDS = {
  // Solana genesis hashes
  SOLANA_MAINNET: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  SOLANA_DEVNET: 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
  SOLANA_TESTNET: '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',

  // Tron chain IDs
  TRON_MAINNET: '728126428',
  TRON_SHASTA_TESTNET: '2494104990',
  TRON_NILE_TESTNET: '3448148188',
};

// Chain mappings for RDNS-based chain inference
export const CHAIN_MAPPINGS = {
  metamask: ['eip155:1'],
  coinbase: ['eip155:1'],
  rabby: ['eip155:1'],
  trust: ['eip155:1'],
  mathwallet: ['eip155:1'],
  phantom: ['solana:101'],
  solflare: ['solana:101'],
  sollet: ['solana:101'],
  tron: ['tron:0x2b6653dc'],
  tokenpocket: ['tron:0x2b6653dc'],
};

// Global provider configurations
export const GLOBAL_PROVIDERS = {
  'io.metamask': {
    name: 'MetaMask',
    rdns: 'io.metamask',
    chains: ['eip155:1'],
    icon: 'metamask',
    windowProperty: 'ethereum',
  },
  'io.rabby': {
    name: 'Rabby Wallet',
    rdns: 'io.rabby',
    chains: ['eip155:1'],
    icon: 'rabby',
    windowProperty: 'ethereum',
  },
  phantom: {
    name: 'Phantom',
    rdns: 'phantom',
    chains: ['solana:101'],
    icon: 'phantom',
    windowProperty: 'solana',
  },
  tronlink: {
    name: 'TronLink',
    rdns: 'tronlink',
    chains: ['tron:0x2b6653dc'],
    icon: 'tronlink',
    windowProperty: 'tronWeb',
  },
};
