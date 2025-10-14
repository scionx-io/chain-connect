import { WALLET_HANDLERS } from './wallets/index.js';
import { WALLET_ICONS } from '../utils/config.js';
import {
  loadWalletState,
  saveWalletState,
  clearWalletState,
} from '../utils/utils.js';

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

  getWalletFamily(wallet) {
    const { chains = [], rdns = '' } = wallet;

    if (chains.some((c) => c.startsWith('eip155:'))) return 'evm';
    if (chains.some((c) => c.startsWith('solana:'))) return 'solana';
    if (chains.some((c) => c.startsWith('tron:'))) return 'tron';

    // EIP-6963 doesn't require chains, fallback to rdns
    const lower = rdns.toLowerCase();
    if (lower.includes('metamask') || lower.includes('rabby')) return 'evm';
    if (lower.includes('phantom') || lower.includes('magiceden'))
      return 'solana';
    if (lower.includes('tronlink')) return 'tron';

    return null;
  }

  getDetectedWallets() {
    const wallets = [];
    const mipdWallets = this.mipdStore.getProviders();

    mipdWallets.forEach((wallet) => {
      // Skip Solana-only wallets - detect via window.solana instead
      if (
        wallet.info.rdns === 'app.phantom' ||
        wallet.info.rdns === 'io.magiceden.wallet'
      )
        return;

      const family = this.getWalletFamily(wallet.info);
      if (family) {
        wallets.push({
          name: wallet.info.name,
          rdns: wallet.info.rdns,
          icon: wallet.info.icon,
          family,
          provider: wallet.provider,
        });
      }
    });

    // Add global providers not in MIPD
    const globalProviders = [
      {
        name: 'Phantom',
        rdns: 'phantom',
        window: 'solana',
        family: 'solana',
        icon: WALLET_ICONS.phantom,
      },
      {
        name: 'TronLink',
        rdns: 'tronlink',
        window: 'tronWeb',
        family: 'tron',
        icon: WALLET_ICONS.tronlink,
      },
    ];

    globalProviders.forEach(
      ({ name, rdns, window: windowProp, family, icon }) => {
        if (window[windowProp] && !wallets.some((w) => w.rdns === rdns)) {
          wallets.push({
            name,
            rdns,
            icon,
            family,
            provider: window[windowProp],
          });
        }
      }
    );

    return wallets;
  }

  findProvider(rdns) {
    console.log('[findProvider] Looking for:', rdns);

    const mipdProvider = this.mipdStore
      .getProviders()
      .find((p) => p.info.rdns === rdns);
    if (mipdProvider) {
      console.log('[findProvider] Found in MIPD');
      return { provider: mipdProvider.provider, info: mipdProvider.info };
    }

    const globalMap = {
      phantom: { provider: window.solana, chains: ['solana:101'] },
      tronlink: { provider: window.tronWeb, chains: ['tron:0x2b6653dc'] },
    };

    const global = globalMap[rdns];
    if (global?.provider) {
      console.log('[findProvider] Found in global');
      return {
        provider: global.provider,
        info: { rdns, chains: global.chains },
      };
    }

    console.log('[findProvider] NOT FOUND');
    return null;
  }

  async init() {
    const savedState = loadWalletState();
    if (savedState?.rdns) {
      try {
        await this.connect(savedState.rdns, true);
      } catch (error) {
        console.error('Reconnection failed:', error);
        clearWalletState();
        // Emit a disconnected event to notify controllers that reconnection failed
        this.emit('disconnected', { rdns: savedState.rdns });
      }
    }
  }

  async connect(rdns, isReconnect = false) {
    if (this.isConnecting) throw new Error('Connection in progress');
    this.isConnecting = true;

    try {
      console.log('[WalletManager] Connecting to wallet:', rdns);
      // Disconnect existing
      const active = this.getActiveConnection();
      if (active && active.rdns !== rdns && !isReconnect) {
        await this.disconnect(active.rdns);
      }
      if (this.hasConnection(rdns)) {
        if (!isReconnect) throw new Error(`Wallet "${rdns}" already connected`);
        await this.disconnect(rdns);
      }

      // Get provider and handler
      const providerDetails = this.findProvider(rdns);
      if (!providerDetails) throw new Error(`Wallet "${rdns}" not found`);

      const family = this.getWalletFamily({
        chains: providerDetails.info.chains,
        rdns,
      });
      const HandlerClass = WALLET_HANDLERS[family];
      if (!HandlerClass) throw new Error(`No handler for "${family}"`);

      // Connect
      const handler = new HandlerClass((newState) =>
        this.handleStateChange(rdns, newState)
      );
      this.handlers.set(rdns, handler);

      console.log(
        '[WalletManager] About to connect with handler for family:',
        family
      );
      const connection = await handler.connect(providerDetails, isReconnect);
      console.log('[WalletManager] Handler connection result:', connection);

      if (!connection) {
        this.handlers.delete(rdns);
        throw new Error('Connection failed');
      }

      connection.rdns = rdns;
      this.connections.set(rdns, connection);
      this.activeConnection = connection;
      saveWalletState(
        connection.family,
        connection.address,
        connection.chainId,
        rdns
      );
      console.log('[WalletManager] Emitting connected event');
      this.emit('connected', { connection });

      return connection;
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect(rdns, shouldClearStorage = false) {
    if (!rdns) {
      rdns = this.getActiveConnection()?.rdns;
      if (!rdns) return;
    }

    const connection = this.connections.get(rdns);
    if (!connection) return;

    const handler = this.handlers.get(rdns);
    if (handler?.disconnect) await handler.disconnect();

    this.connections.delete(rdns);
    this.handlers.delete(rdns);

    if (this.activeConnection?.rdns === rdns) {
      this.activeConnection = null;
    }

    if (shouldClearStorage) {
      clearWalletState();
    }
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
    console.log(`[WalletManager] Emitting event: ${type}`, detail);
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
}

export { WalletManager };
