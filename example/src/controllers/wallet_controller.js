import { Controller } from "@hotwired/stimulus"
import { createStore } from 'mipd';
import { WalletManager } from '../core/wallet_manager.js';

export default class extends Controller {
  static outlets = ["modal"]

  // ============================================================================
  // Lifecycle
  // ============================================================================

  connect() {
    // Initialize services
    this.mipdStore = createStore();
    this.walletManager = new WalletManager(this.mipdStore);

    // Set up event listeners
    this.setupEventListeners();

    // Initialize wallet manager for auto-reconnect
    this.walletManager.init();

    // Initialize wallet detection
    this.initializeWalletDetection();

    // Dispatch initial connection state
    if (this.walletManager.getActiveConnection()) {
      const connection = this.walletManager.getActiveConnection();
      this.dispatch('connected', {
        detail: {
          address: connection.address,
          chainId: connection.chainId,
          name: connection.name,
          rdns: connection.rdns,
          family: connection.family,
          provider: connection.provider
        }
      });
    }
  }

  disconnect() {
    this.cleanupEventListeners();

    if (this.walletManager.getActiveConnection()) {
      this.walletManager.disconnect();
    }
  }

  // ============================================================================
  // Getters
  // ============================================================================

  get address() {
    return this.walletManager.getActiveConnection()?.address;
  }

  get chainId() {
    return this.walletManager.getActiveConnection()?.chainId;
  }

  get provider() {
    return this.walletManager.getActiveConnection()?.provider;
  }

  get isConnected() {
    return !!this.walletManager.getActiveConnection();
  }

  // ============================================================================
  // User Actions
  // ============================================================================

  connectWallet() {
    this.openModal();
  }

  async disconnectWallet() {
    if (this.walletManager.getActiveConnection()) {
      const rdns = this.walletManager.getActiveConnection().rdns;
      await this.walletManager.disconnect(rdns);
    }
  }

  async selectWallet(event) {
    const button = event.currentTarget;
    const rdns = button.dataset.walletRdns;

    if (!rdns) {
      this.dispatch('error', {
        detail: { message: 'Invalid wallet selection' }
      });
      return;
    }

    this.closeModal();

    // Dispatch connecting event so app can show loading
    this.dispatch('connecting', { detail: { rdns } });

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 30000);
      });

      await Promise.race([this.walletManager.connect(rdns), timeoutPromise]);
      // Success handled by handleConnected event
    } catch (error) {
      console.error('Wallet connection error:', error);
      this.dispatch('error', {
        detail: {
          message: error.message || 'Connection failed',
          error
        }
      });
    }
  }



  // ============================================================================
  // Modal
  // ============================================================================

  openModal() {
    if (this.hasModalOutlet) {
      this.modalOutlet.open();
    }
  }

  closeModal() {
    if (this.hasModalOutlet) {
      this.modalOutlet.close();
    }
  }

  // ============================================================================
  // Wallet Detection
  // ============================================================================

  initializeWalletDetection() {
    // Dispatch initial wallets
    this.dispatch('walletsDetected', {
      detail: { wallets: this.getAvailableWallets() }
    });

    // Re-dispatch when new wallets inject
    this.mipdStore.subscribe(() => {
      this.dispatch('walletsDetected', {
        detail: { wallets: this.getAvailableWallets() }
      });
    });
  }

  getAvailableWallets() {
    // Return array of available wallets from WalletManager
    return this.walletManager.getAvailableWallets();
  }

  // ============================================================================
  // Event Listener Management
  // ============================================================================

  setupEventListeners() {
    this.boundHandleConnected = this.handleConnected.bind(this);
    this.boundHandleDisconnected = this.handleDisconnected.bind(this);
    this.boundHandleChainChanged = this.handleChainChanged.bind(this);
    this.boundHandleAccountChanged = this.handleAccountChanged.bind(this);

    this.walletManager.addEventListener('connected', this.boundHandleConnected);
    this.walletManager.addEventListener('disconnected', this.boundHandleDisconnected);
    this.walletManager.addEventListener('chainChanged', this.boundHandleChainChanged);
    this.walletManager.addEventListener('accountChanged', this.boundHandleAccountChanged);
  }

  cleanupEventListeners() {
    if (this.walletManager) {
      this.walletManager.removeEventListener('connected', this.boundHandleConnected);
      this.walletManager.removeEventListener('disconnected', this.boundHandleDisconnected);
      this.walletManager.removeEventListener('chainChanged', this.boundHandleChainChanged);
      this.walletManager.removeEventListener('accountChanged', this.boundHandleAccountChanged);
    }
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  handleConnected(event) {
    const { connection } = event.detail;
    this.dispatch('connected', {
      detail: {
        address: connection.address,
        chainId: connection.chainId,
        name: connection.name,
        rdns: connection.rdns,
        family: connection.family,
        provider: connection.provider
      }
    });
  }

  handleDisconnected() {
    this.dispatch('disconnected');
  }

  handleChainChanged(event) {
    this.dispatch('chainChanged', {
      detail: { chainId: event.detail.connection.chainId }
    });
  }

  handleAccountChanged(event) {
    this.dispatch('accountChanged', {
      detail: { address: event.detail.connection.address }
    });
  }


}
