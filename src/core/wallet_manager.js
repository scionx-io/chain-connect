import { WALLET_HANDLERS } from './wallets/index.js';
import { WALLET_ICONS } from '../utils/config.js';
import { loadWalletState, saveWalletState, clearWalletState } from '../utils/utils.js';

class WalletManager extends EventTarget {
  constructor(mipdStore) {
    super();
    this.mipdStore = mipdStore;
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

  // Simple helper: get wallet family from chains array
  getWalletFamily(chains) {
    if (!chains || chains.length === 0) return null;
    if (chains.some(chain => chain.startsWith('eip155:'))) return 'evm';
    if (chains.some(chain => chain.startsWith('solana:'))) return 'solana';
    if (chains.some(chain => chain.startsWith('tron:'))) return 'tron';
    return null;
  }

  // Get all detected wallets (MIPD + global window objects)
  getDetectedWallets() {
    const wallets = [];

    // Get MIPD wallets
    const mipdWallets = this.mipdStore.getProviders();
    mipdWallets.forEach(wallet => {
      const family = this.getWalletFamily(wallet.info.chains);
      if (family) {
        wallets.push({
          name: wallet.info.name,
          rdns: wallet.info.rdns,
          icon: wallet.info.icon,
          family,
          provider: wallet.provider
        });
      }
    });

    // Check for global providers (non-MIPD wallets)
    const globalProviders = [
      { name: 'Phantom', rdns: 'phantom', window: 'solana', family: 'solana', icon: WALLET_ICONS.phantom },
      { name: 'TronLink', rdns: 'tronlink', window: 'tronWeb', family: 'tron', icon: WALLET_ICONS.tronlink }
    ];

    globalProviders.forEach(({ name, rdns, window: windowProp, family, icon }) => {
      if (typeof window !== 'undefined' && window[windowProp]) {
        // Only add if not already in MIPD list
        if (!wallets.some(w => w.rdns === rdns)) {
          wallets.push({ name, rdns, icon, family, provider: window[windowProp] });
        }
      }
    });

    return wallets;
  }

  // Find provider by RDNS
  findProvider(rdns) {
    // Check MIPD first
    const mipdProvider = this.mipdStore.getProviders().find(p => p.info.rdns === rdns);
    if (mipdProvider) {
      this._debug('Found MIPD provider:', rdns);
      return {
        provider: mipdProvider.provider,
        info: mipdProvider.info
      };
    }

    // Check global window objects
    const globalMap = {
      'phantom': { provider: typeof window !== 'undefined' ? window.solana : null, chains: ['solana:101'] },
      'tronlink': { provider: typeof window !== 'undefined' ? window.tronWeb : null, chains: ['tron:0x2b6653dc'] }
    };

    const global = globalMap[rdns];
    if (global && global.provider) {
      this._debug('Found global provider:', rdns);
      return {
        provider: global.provider,
        info: { rdns, chains: global.chains }
      };
    }

    this._debug('No provider found for:', rdns);
    return null;
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
    if (this.isConnecting) {
      throw new Error('Connection already in progress');
    }

    this.isConnecting = true;

    try {
      // Disconnect current wallet if connecting to different one
      const activeConnection = this.getActiveConnection();
      if (activeConnection && activeConnection.rdns !== rdns && !isReconnect) {
        await this.disconnect(activeConnection.rdns);
      }

      // Handle reconnect to same wallet
      if (this.hasConnection(rdns)) {
        if (!isReconnect) {
          throw new Error(`Wallet with RDNS "${rdns}" is already connected.`);
        }
        await this.disconnect(rdns);
      }

      const providerDetails = this.findProvider(rdns);
      if (!providerDetails) {
        throw new Error(`Wallet with RDNS "${rdns}" not found or not available.`);
      }

      const family = this.getWalletFamily(providerDetails.info.chains);
      const HandlerClass = WALLET_HANDLERS[family];

      if (!HandlerClass) {
        throw new Error(`No handler for wallet family "${family}"`);
      }

      const handler = new HandlerClass((newState) => {
        this.handleStateChange(rdns, newState);
      });
      this.handlers.set(rdns, handler);

      const connection = await handler.connect(providerDetails, isReconnect);
      if (connection) {
        connection.rdns = rdns;
        this.connections.set(rdns, connection);
        this.activeConnection = connection;

        saveWalletState(connection.family, connection.address, connection.chainId, rdns);
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
      const activeConnection = this.getActiveConnection();
      rdns = activeConnection?.rdns;
      if (!rdns) return;
    }

    const connection = this.connections.get(rdns);
    if (!connection) return;

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

    if (newState.chainId !== undefined) {
      this.emit('chainChanged', { rdns, connection });
    }
    if (newState.address !== undefined) {
      this.emit('accountChanged', { rdns, connection });
    }
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

  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
}

export { WalletManager };
