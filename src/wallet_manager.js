import walletRegistry from './wallet_registry.js';
import './wallets/index.js';
import { loadWalletState, saveWalletState, clearWalletState } from './utils.js';
import { WALLET_ICONS } from './config.js';

class WalletManager extends EventTarget {
  constructor(mipdStore) {
    super();
    this.mipdStore = mipdStore;
    this.connections = new Map();
    this.activeConnection = null;
    this.handlers = new Map();
    this.isConnecting = false;
  }

  async init() {
    const savedState = loadWalletState();
    if (savedState && savedState.rdns) {
      try {
        await this.connect(savedState.rdns, true);
      } catch (error) {
        console.error('Automatic reconnection failed:', error);
        clearWalletState();
      }
    }
  }

  getWalletFamily(chains) {
    if (!chains) return null;
    if (chains.some(chain => chain.startsWith('eip155:'))) return 'evm';
    if (chains.some(chain => chain.startsWith('solana:'))) return 'solana';
    if (chains.some(chain => chain.startsWith('tron:'))) return 'tron';
    return null;
  }

  async connect(rdns, isReconnect = false) {
    if (this.isConnecting) {
      throw new Error('Connection already in progress');
    }
    
    if (this.connections.has(rdns)) {
      if (!isReconnect) {
        throw new Error(`Wallet with RDNS "${rdns}" is already connected.`);
      }
      // Clean up existing connection before reconnecting
      await this.disconnect(rdns);
    }

    this.isConnecting = true;
    
    try {
      const providerDetails = this.findProvider(rdns);
      if (!providerDetails) {
        throw new Error(`Wallet with RDNS "${rdns}" not found or not available.`);
      }

      const family = this.getWalletFamily(providerDetails.info.chains);
      const HandlerClass = walletRegistry.get(family);

      if (!HandlerClass) {
        throw new Error(`No handler for wallet family "${family}"`);
      }

      const handler = new HandlerClass(this.handleStateChange.bind(this, rdns));
      this.handlers.set(rdns, handler);

      const connection = await handler.connect(providerDetails, isReconnect);
      if (connection) {
        connection.rdns = rdns;
        this.connections.set(rdns, connection);
        this.activeConnection = connection;
        saveWalletState(family, connection.address, connection.chainId, rdns);
        this.emit('connected', { connection });
      } else {
        this.handlers.delete(rdns);
      }
      
      return connection;
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect(rdns) {
    if (!rdns) {
      rdns = this.activeConnection?.rdns;
      if (!rdns) {
        // If no rdns is specified and no active connection exists, do nothing
        return;
      }
    }

    const handler = this.handlers.get(rdns);
    const connection = this.connections.get(rdns);

    // If there's no handler and no connection for this rdns, just return
    if (!handler && !connection) {
      return;
    }

    try {
      if (handler) {
        await handler.disconnect();
      }
    } finally {
      // Always clean up, even if disconnect() fails
      this.handlers.delete(rdns);
      this.connections.delete(rdns);
      
      if (this.activeConnection?.rdns === rdns) {
        this.activeConnection = null;
      }
      
      clearWalletState();
      
      if (connection) {
        this.emit('disconnected', { rdns, family: connection.family });
      }
    }
  }

  handleStateChange(rdns, newState) {
    const connection = this.connections.get(rdns);
    if (connection) {
      // Determine if this is a chain change or account change
      const isChainChange = newState.chainId !== undefined && connection.chainId !== newState.chainId;
      const isAccountChange = newState.address !== undefined && connection.address !== newState.address;
      
      Object.assign(connection, newState);
      this.activeConnection = connection;
      const providerDetails = this.findProvider(rdns);
      const family = this.getWalletFamily(providerDetails.info.chains);
      saveWalletState(
        family,
        connection.address,
        connection.chainId,
        connection.rdns
      );
      
      // Emit different events based on the type of change
      if (isChainChange) {
        this.emit('chainChanged', { connection });
      }
      if (isAccountChange) {
        this.emit('accountChanged', { connection });
      }
      
      // Always emit the general stateChanged event
      this.emit('stateChanged', { connection });
    }
  }

  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  findProvider(rdns) {
    const mipdProvider = this.mipdStore.getProviders().find(p => p.info.rdns === rdns);
    if (mipdProvider) {
      // If MIPD provider doesn't have chains, try to infer from rdns
      if (!mipdProvider.info.chains) {
        let inferredChains = [];
        // Infer chain based on rdns for common wallets
        if (rdns.includes('metamask') || rdns.includes('coinbase') || rdns.includes('rabby') || 
            rdns.includes('trust') || rdns.includes('mathwallet')) {
          inferredChains = ['eip155:1'];  // Ethereum mainnet
        } else if (rdns.includes('phantom') || rdns.includes('solflare') || rdns.includes('sollet')) {
          inferredChains = ['solana:101'];  // Solana mainnet
        } else if (rdns.includes('tron') || rdns.includes('tokenpocket')) {
          inferredChains = ['tron:0x2b6653dc'];  // Tron mainnet
        }
        mipdProvider.info.chains = inferredChains;
      }
      return mipdProvider;
    }

    if (rdns === 'io.metamask' && window.ethereum) {
      return {
        provider: window.ethereum,
        info: { name: 'MetaMask', rdns: 'io.metamask', chains: ['eip155:1'], icon: WALLET_ICONS.metamask }
      };
    }
    if (rdns === 'phantom' && window.solana) {
      return {
        provider: window.solana,
        info: { name: 'Phantom', rdns: 'phantom', chains: ['solana:101'], icon: WALLET_ICONS.phantom }
      };
    }
    if (rdns === 'tronlink' && (window.tronWeb || window.tronLink)) {
      return {
        provider: window.tronWeb || window.tronLink,
        info: { name: 'TronLink', rdns: 'tronlink', chains: ['tron:0x2b6653dc'], icon: WALLET_ICONS.tronlink }
      };
    }

    return null;
  }
}

export { WalletManager };