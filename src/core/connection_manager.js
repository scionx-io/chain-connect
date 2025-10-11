import walletRegistry from './wallet_registry.js';
import { WalletProviderResolver } from './services/wallet_provider_resolver.js';

class ConnectionManager extends EventTarget {
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
      console.log('[ConnectionManager]', ...args);
    }
  }

  getWalletFamily(chains) {
    if (!chains) return null;
    if (chains.some(chain => chain.startsWith('eip155:'))) return 'evm';
    if (chains.some(chain => chain.startsWith('solana:'))) return 'solana';
    if (chains.some(chain => chain.startsWith('tron:'))) return 'tron';
    return null;
  }

  async connect(rdns, isReconnect = false, stateChangeCallback) {
    if (this.isConnecting) {
      throw new Error('Connection already in progress');
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
        this.handleStateChange(rdns, newState, stateChangeCallback);
      });
      this.handlers.set(rdns, handler);

      const connection = await handler.connect(providerDetails, isReconnect);
      if (connection) {
        connection.rdns = rdns;
        this.connections.set(rdns, connection);
        this.activeConnection = connection;
      } else {
        this.handlers.delete(rdns);
      }

      return connection;
    } finally {
      this.isConnecting = false;
    }
  }

  findProvider(rdns) {
    return this.providerResolver.findProvider(rdns);
  }

  getActiveConnection() {
    return this.activeConnection;
  }

  getConnection(rdns) {
    return this.connections.get(rdns);
  }

  hasConnection(rdns) {
    return this.connections.has(rdns);
  }

  async disconnect(rdns) {
    const connection = this.connections.get(rdns);
    if (!connection) {
      return;
    }

    const handler = this.handlers.get(rdns);
    if (handler && handler.disconnect) {
      await handler.disconnect();
    }

    this.connections.delete(rdns);
    this.handlers.delete(rdns);

    if (this.activeConnection?.rdns === rdns) {
      this.activeConnection = null;
    }

    this.emit('disconnected', { rdns });
  }

  handleStateChange(rdns, newState, stateChangeCallback) {
    const connection = this.connections.get(rdns);
    if (!connection) return;

    Object.assign(connection, newState);

    if (stateChangeCallback) {
      stateChangeCallback({ connection });
    }

    this.emit('stateChanged', { rdns, connection });
  }

  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
}

export { ConnectionManager };