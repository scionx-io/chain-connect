import { Controller } from "@hotwired/stimulus";
import { createStore } from 'mipd';
import { WalletManager } from '../core/wallet_manager.js';
import { renderWalletModal } from '../utils/modal_renderer.js';

/**
 * Main wallet controller - handles wallet connection, modal display, and state management
 * Merges functionality from ConnectorController, ModalController, and WalletsController
 */
export default class WalletController extends Controller {
  static values = {
    address: String,
    chainId: String,
    walletName: String,
    rdns: String,
    family: String,
    isConnected: { type: Boolean, default: false },
    connecting: { type: Boolean, default: false }
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  connect() {
    // Initialize services
    this.mipdStore = createStore();
    this.walletManager = new WalletManager(this.mipdStore);
    this.modalElement = null;

    // Set up event listeners for WalletManager events
    this.setupEventListeners();

    // Initialize wallet manager for auto-reconnect
    this.walletManager.init();
  }

  disconnect() {
    this.cleanupEventListeners();
    this.close(); // Remove modal if open

    if (this.walletManager.getActiveConnection()) {
      this.walletManager.disconnect();
    }
  }

  // ============================================================================
  // Getters (for backward compatibility and programmatic access)
  // ============================================================================

  get address() {
    return this.addressValue;
  }

  get chainId() {
    return this.chainIdValue;
  }

  get provider() {
    return this.walletManager.getActiveConnection()?.provider;
  }

  get isConnected() {
    return this.isConnectedValue;
  }

  // ============================================================================
  // User Actions (Stimulus Actions)
  // ============================================================================

  open() {
    if (this.modalElement) {
      return; // Already open
    }

    const wallets = this.walletManager.getDetectedWallets();

    // Bind callbacks
    this.boundSelectWallet = this.selectWallet.bind(this);
    this.boundClose = this.close.bind(this);

    // Render modal
    this.modalElement = renderWalletModal(wallets, this.boundSelectWallet, this.boundClose);
    document.body.appendChild(this.modalElement);
  }

  close() {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
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

    // Set connecting state
    this.connectingValue = true;

    this.dispatch('connecting', { detail: { rdns } });

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 30000);
      });

      await Promise.race([
        this.walletManager.connect(rdns),
        timeoutPromise
      ]);
    } catch (error) {
      console.error('Wallet connection error:', error);
      this.dispatch('error', {
        detail: {
          message: error.message || 'Connection failed',
          error
        }
      });
    } finally {
      this.connectingValue = false;
    }
  }

  async disconnectWallet() {
    if (this.walletManager.getActiveConnection()) {
      const rdns = this.walletManager.getActiveConnection().rdns;
      await this.walletManager.disconnect(rdns);
    }
  }

  // ============================================================================
  // Event Listener Management (WalletManager EventTarget)
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
  // Event Handlers (from WalletManager)
  // ============================================================================

  handleConnected(event) {
    const { connection } = event.detail;

    // Update Stimulus values (triggers reactive callbacks)
    this.addressValue = connection.address;
    this.chainIdValue = connection.chainId;
    this.walletNameValue = connection.name;
    this.rdnsValue = connection.rdns;
    this.familyValue = connection.family;
    this.isConnectedValue = true;

    // Close modal
    this.close();

    // Dispatch Stimulus event
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
    // Clear Stimulus values
    this.addressValue = "";
    this.chainIdValue = "";
    this.walletNameValue = "";
    this.rdnsValue = "";
    this.familyValue = "";
    this.isConnectedValue = false;

    // Dispatch Stimulus event
    this.dispatch('disconnected');
  }

  handleChainChanged(event) {
    // Update chain ID value
    this.chainIdValue = event.detail.connection.chainId;

    // Dispatch Stimulus event
    this.dispatch('chainChanged', {
      detail: { chainId: event.detail.connection.chainId }
    });
  }

  handleAccountChanged(event) {
    // Update address value
    this.addressValue = event.detail.connection.address;

    // Dispatch Stimulus event
    this.dispatch('accountChanged', {
      detail: { address: event.detail.connection.address }
    });
  }

  // ============================================================================
  // Reactive Callbacks
  // ============================================================================

  isConnectedValueChanged(isConnected) {
    // Add/remove class to controller element for CSS targeting
    this.element.classList.toggle('wallet-connected', isConnected);
  }
}
