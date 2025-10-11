import walletRegistry from './wallet_registry.js';
import './wallets/index.js';
import { loadWalletState, saveWalletState, clearWalletState } from './utils.js';
import { WalletProviderResolver } from './services/wallet_provider_resolver.js';

class DebugWalletManager extends EventTarget {
  constructor(mipdStore) {
    super();
    this.mipdStore = mipdStore;
    this.connections = new Map();
    this.activeConnection = null;
    this.handlers = new Map();
    this.isConnecting = false;
    this.providerResolver = new WalletProviderResolver(mipdStore);
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
    console.log(`DEBUG: Attempting to connect to RDNS: ${rdns}`);
    console.log(`DEBUG: Current active connection: ${this.activeConnection ? this.activeConnection.rdns : 'none'}`);
    console.log(`DEBUG: Connections map contains RDNS: ${this.connections.has(rdns)}`);
    console.log(`DEBUG: Is reconnect: ${isReconnect}`);
    
    if (this.isConnecting) {
      throw new Error('Connection already in progress');
    }
    
    // If we're connecting to a different wallet than the currently active one,
    // disconnect the active wallet first
    if (this.activeConnection && this.activeConnection.rdns !== rdns) {
      console.log(`DEBUG: Disconnecting active wallet: ${this.activeConnection.rdns}`);
      await this.disconnect(this.activeConnection.rdns);
      console.log(`DEBUG: Active wallet disconnected`);
    }
    
    // If this specific wallet is already connected and it's not a reconnection,
    // throw an error (shouldn't happen in normal flow now, but keeping for safety)
    if (this.connections.has(rdns) && !isReconnect) {
      console.log(`DEBUG: Wallet already in connections map, throwing error`);
      throw new Error(`Wallet with RDNS "${rdns}" is already connected.`);
    }

    this.isConnecting = true;
    console.log(`DEBUG: Starting connection process for RDNS: ${rdns}`);
    
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

      // If this wallet was previously connected and is reconnecting, disconnect the old handler first
      if (this.handlers.has(rdns) && isReconnect) {
        console.log(`DEBUG: Disconnecting previous handler for RDNS: ${rdns}`);
        await this.disconnect(rdns);
      }

      console.log(`DEBUG: Creating new handler for RDNS: ${rdns}`);
      const handler = new HandlerClass(this.handleStateChange.bind(this, rdns));
      this.handlers.set(rdns, handler);

      console.log(`DEBUG: Attempting to connect handler for RDNS: ${rdns}`);
      const connection = await handler.connect(providerDetails, isReconnect);
      if (connection) {
        connection.rdns = rdns;
        this.connections.set(rdns, connection);
        this.activeConnection = connection;
        saveWalletState(family, connection.address, connection.chainId, rdns);
        console.log(`DEBUG: Connection established for RDNS: ${rdns}, emitting 'connected' event`);
        this.emit('connected', { connection });
      } else {
        console.log(`DEBUG: No connection returned from handler, removing handler from map`);
        this.handlers.delete(rdns);
      }
      
      return connection;
    } finally {
      this.isConnecting = false;
      console.log(`DEBUG: Connection process completed for RDNS: ${rdns}`);
    }
  }

  async disconnect(rdns) {
    console.log(`DEBUG: Attempting to disconnect RDNS: ${rdns}`);
    if (!rdns) {
      rdns = this.activeConnection?.rdns;
      if (!rdns) {
        // If no rdns is specified and no active connection exists, do nothing
        console.log(`DEBUG: No RDNS specified and no active connection, skipping disconnect`);
        return;
      }
    }

    const handler = this.handlers.get(rdns);
    const connection = this.connections.get(rdns);

    // If there's no handler and no connection for this rdns, just return
    if (!handler && !connection) {
      console.log(`DEBUG: No handler or connection found for RDNS: ${rdns}, skipping disconnect`);
      return;
    }

    try {
      if (handler) {
        console.log(`DEBUG: Disconnecting handler for RDNS: ${rdns}`);
        await handler.disconnect();
        console.log(`DEBUG: Handler disconnected for RDNS: ${rdns}`);
      }
    } catch (error) {
      console.error(`DEBUG: Error disconnecting handler for RDNS ${rdns}:`, error);
    } finally {
      // Always clean up, even if disconnect() fails
      console.log(`DEBUG: Cleaning up connection and handler for RDNS: ${rdns}`);
      this.handlers.delete(rdns);
      this.connections.delete(rdns);
      
      if (this.activeConnection?.rdns === rdns) {
        this.activeConnection = null;
        console.log(`DEBUG: Cleared active connection`);
      }
      
      clearWalletState();
      console.log(`DEBUG: Cleared wallet state`);
      
      if (connection) {
        console.log(`DEBUG: Emitting 'disconnected' event for RDNS: ${rdns}`);
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
    console.log(`DEBUG: Emitting event: ${type}`);
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  findProvider(rdns) {
    return this.providerResolver.findProvider(rdns);
  }
}

export { DebugWalletManager };