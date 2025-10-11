import walletRegistry from './wallet_registry.js';
import './wallets/index.js';
import { loadWalletState, saveWalletState, clearWalletState } from './utils.js';
import { WalletProviderResolver } from './services/wallet_provider_resolver.js';

class WalletManager extends EventTarget {
  constructor(mipdStore) {
    super();
    this.mipdStore = mipdStore;
    this.connections = new Map();
    this.activeConnection = null;
    this.handlers = new Map();
    this.isConnecting = false;
    this.providerResolver = new WalletProviderResolver(mipdStore);
  }

  _debug(...args) {
    if (window.WALLET_DEBUG) {
      console.log('[WalletManager]', ...args);
    }
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
    
    // Disconnect the currently active wallet if connecting to a different wallet
    if (this.activeConnection && this.activeConnection.rdns !== rdns && !isReconnect) {
      await this.disconnect(this.activeConnection.rdns);
    }
    
    // Handle connection to the same wallet as before
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

      // Create a closure to ensure rdns is associated with the callback for test mock compatibility
      const handler = new HandlerClass((newState) => {
        this.handleStateChange(rdns, newState);
      });
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
    return this.providerResolver.findProvider(rdns);
  }
}

export { WalletManager };