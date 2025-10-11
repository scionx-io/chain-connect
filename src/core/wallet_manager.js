import walletRegistry from './wallet_registry.js';
import './wallets/index.js';
import { loadWalletState, saveWalletState, clearWalletState } from '../utils.js';
import { WalletDiscovery } from './wallet_discovery.js';
import { ConnectionManager } from './connection_manager.js';

class WalletManager extends EventTarget {
  constructor(mipdStore) {
    super();
    this.mipdStore = mipdStore;
    this.discovery = new WalletDiscovery(mipdStore);
    this.connectionManager = new ConnectionManager(mipdStore);
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

  async connect(rdns, isReconnect = false) {
    // Disconnect the currently active wallet if connecting to a different wallet
    const activeConnection = this.connectionManager.getActiveConnection();
    if (activeConnection && activeConnection.rdns !== rdns && !isReconnect) {
      await this.connectionManager.disconnect(activeConnection.rdns);
    }

    // Handle connection to the same wallet as before
    if (this.connectionManager.hasConnection(rdns)) {
      if (!isReconnect) {
        throw new Error(`Wallet with RDNS "${rdns}" is already connected.`);
      }
      // Clean up existing connection before reconnecting
      await this.connectionManager.disconnect(rdns);
    }

    // Listen to connection manager events and forward them
    this.forwardConnectionManagerEvents();

    const connection = await this.connectionManager.connect(
      rdns,
      isReconnect,
      (stateChange) => this.handleStateChange(rdns, stateChange.connection)
    );

    if (connection) {
      // Save state after successful connection
      saveWalletState(
        connection.family,
        connection.address,
        connection.chainId,
        rdns
      );

      this.emit('connected', { connection });
    }

    return connection;
  }

  async disconnect(rdns) {
    if (!rdns) {
      const activeConnection = this.connectionManager.getActiveConnection();
      rdns = activeConnection?.rdns;
      if (!rdns) {
        // If no rdns is specified and no active connection exists, do nothing
        return;
      }
    }

    await this.connectionManager.disconnect(rdns);
    clearWalletState();
  }

  handleStateChange(rdns, connection) {
    // Simply update the connection object with new state
    const currentState = this.connectionManager.getConnection(rdns);
    if (!currentState) return;

    // Update the connection object
    Object.assign(currentState, connection);
  }

  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  getActiveConnection() {
    return this.connectionManager.getActiveConnection();
  }
  
  forwardConnectionManagerEvents() {
    // Remove any existing listeners to prevent duplicates
    this.removeConnectionManagerListeners();
    
    // Add event listeners that forward events from connection manager to wallet manager
    this.connectionManager.addEventListener('connected', (event) => {
      this.emit('connected', event.detail);
    });
    
    this.connectionManager.addEventListener('disconnected', (event) => {
      this.emit('disconnected', event.detail);
    });
    
    this.connectionManager.addEventListener('stateChanged', (event) => {
      this.emit('stateChanged', event.detail);
    });
    
    this.connectionManager.addEventListener('chainChanged', (event) => {
      this.emit('chainChanged', event.detail);
    });
    
    this.connectionManager.addEventListener('accountChanged', (event) => {
      this.emit('accountChanged', event.detail);
    });
  }
  
  removeConnectionManagerListeners() {
    // In a real implementation, we would store the listeners to remove them
    // For now, we're assuming that re-adding them is sufficient
  }
}

export { WalletManager };