import walletRegistry from './wallet_registry.js';
import './wallets/index.js';
import { loadWalletState, saveWalletState, clearWalletState } from '../utils/utils.js';
import { WalletDiscovery } from './wallet_discovery.js';
import { WalletProviderResolver } from './services/wallet_provider_resolver.js';

class WalletManager extends EventTarget {
  constructor(mipdStore) {
    super();
    this.mipdStore = mipdStore;
    this.discovery = new WalletDiscovery(mipdStore);
    this.providerResolver = new WalletProviderResolver(mipdStore);
    this.connections = new Map();
    this.activeConnection = null;
    this.handlers = new Map();
    this.isConnecting = false;
  }

  _debug(...args) {
    if (window.WALLET_DEBUG) {
      console.log('[WalletManager]', ...args);
    }
  }

  getDetectedWallets() {
    return this.discovery.getDetectedWallets();
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

    this.isConnecting = true;

    try {
      // Disconnect the currently active wallet if connecting to a different wallet
      const activeConnection = this.getActiveConnection();
      if (activeConnection && activeConnection.rdns !== rdns && !isReconnect) {
        await this.disconnect(activeConnection.rdns);
      }

      // Handle connection to the same wallet as before
      if (this.hasConnection(rdns)) {
        if (!isReconnect) {
          throw new Error(`Wallet with RDNS "${rdns}" is already connected.`);
        }
        // Clean up existing connection before reconnecting
        await this.disconnect(rdns);
      }

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

        // Save state after successful connection
        saveWalletState(
          connection.family,
          connection.address,
          connection.chainId,
          rdns
        );

        this.emit('connected', { connection });
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
    if (!rdns) {
      const activeConnection = this.getActiveConnection();
      rdns = activeConnection?.rdns;
      if (!rdns) {
        // If no rdns is specified and no active connection exists, do nothing
        return;
      }
    }

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

    clearWalletState();
    this.emit('disconnected', { rdns });
  }

  handleStateChange(rdns, newState) {
    const connection = this.connections.get(rdns);
    if (!connection) return;

    Object.assign(connection, newState);

    // Emit specific events for chain and account changes
    if (newState.chainId !== undefined) {
      this.emit('chainChanged', { rdns, connection });
    }
    if (newState.address !== undefined) {
      this.emit('accountChanged', { rdns, connection });
    }
  }

  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
}

export { WalletManager };
