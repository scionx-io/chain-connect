import { Controller } from '@hotwired/stimulus';
import { createStore } from 'mipd';
import { WalletManager } from '../core/wallet_manager.js';
import ModalManager from '../utils/modal_manager.js';
import { loadWalletState } from '../utils/utils.js';

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
    connecting: { type: Boolean, default: false },
    status: { type: String, default: 'idle' },
  };

  // ============================================================================
  // Lifecycle
  // ============================================================================

  connect() {
    // Initialize services
    this.initializeServices();

    // Set up event listeners for WalletManager events
    this.setupEventListeners();

    // Set the retry handler for the modal manager
    this.modalManager.setRetryHandler(this.retryConnection.bind(this));

    // Set initial status based on saved state
    this.setInitialStatus();

    // Initialize wallet manager for auto-reconnect
    this.walletManager.init();
  }

  initializeServices() {
    this.mipdStore = createStore();
    this.walletManager = new WalletManager(this.mipdStore);
    this.modalManager = new ModalManager(this.walletManager);
    this.lastSelectedRdns = null;
  }

  setInitialStatus() {
    const savedState = loadWalletState();
    if (savedState?.rdns) {
      this.statusValue = 'connecting';
    } else {
      this.statusValue = 'idle';
    }
  }

  disconnect() {
    this.cleanupEventListeners();
    this.close(); // Remove modal if open

    // Only disconnect the wallet connection but don't clear storage,
    // to preserve the session across Turbo page updates
    if (this.walletManager.getActiveConnection()) {
      const rdns = this.walletManager.getActiveConnection().rdns;
      this.walletManager.disconnect(rdns, false); // Don't clear storage
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
    return this.getActiveProvider();
  }

  getActiveProvider() {
    return this.walletManager.getActiveConnection()?.provider;
  }

  get isConnected() {
    return this.isConnectedValue;
  }

  // ============================================================================
  // User Actions (Stimulus Actions)
  // ============================================================================

  open() {
    // Bind callbacks
    this.boundSelectWallet = this.selectWallet.bind(this);
    this.boundClose = this.close.bind(this);

    this.modalManager.open(this.boundSelectWallet, this.boundClose);
  }

  close() {
    this.modalManager.close();
  }

  async selectWallet(event) {
    const button = event.currentTarget;
    const rdns = button.dataset.walletRdns;

    if (!rdns) {
      this.handleWalletError('Invalid wallet selection');
      return;
    }

    // Store for retry functionality
    this.lastSelectedRdns = rdns;

    // Call connection logic
    await this.connectToWallet(rdns);
  }

  async connectToWallet(rdns) {
    // Set connecting state
    this.connectingValue = true;
    this.statusValue = 'connecting';

    this.dispatch('connecting', { detail: { rdns } });

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 30000);
      });

      await Promise.race([this.walletManager.connect(rdns), timeoutPromise]);
    } catch (error) {
      console.error('Wallet connection error:', error);

      // Show error overlay
      this.showError(error);

      this.handleWalletError(error.message || 'Connection failed', error);
      // Only change status to 'disconnected' on failure
      this.statusValue = 'disconnected';
    } finally {
      this.connectingValue = false;
    }
  }

  handleWalletError(message, error = null) {
    this.dispatch('error', {
      detail: { message, error },
    });
  }

  showError(error) {
    if (!this.modalManager.isModalOpen()) return;

    // Show error using the modal manager
    this.modalManager.showError(this.formatErrorMessage(error));
  }

  formatErrorMessage(error) {
    return this.modalManager.formatErrorMessage(error);
  }

  hideError() {
    this.modalManager.hideError();
  }

  async retryConnection() {
    if (!this.lastSelectedRdns) return;

    // Hide error overlay
    this.hideError();

    // Retry connection directly - no fake events needed
    await this.connectToWallet(this.lastSelectedRdns);
  }

  async disconnectWallet() {
    const connection = this.walletManager.getActiveConnection();
    if (connection) {
      // Clear storage when user explicitly disconnects
      await this.walletManager.disconnect(connection.rdns, true);
    }
  }

  // ============================================================================
  // Event Listener Management (WalletManager EventTarget)
  // ============================================================================

  setupEventListeners() {
    this.setupWalletManagerEventBindings();
    this.subscribeToWalletManagerEvents();
  }

  setupWalletManagerEventBindings() {
    this.boundHandleConnected = this.handleConnected.bind(this);
    this.boundHandleDisconnected = this.handleDisconnected.bind(this);
    this.boundHandleChainChanged = this.handleChainChanged.bind(this);
    this.boundHandleAccountChanged = this.handleAccountChanged.bind(this);
  }

  subscribeToWalletManagerEvents() {
    this.walletManager.addEventListener('connected', this.boundHandleConnected);
    this.walletManager.addEventListener(
      'disconnected',
      this.boundHandleDisconnected
    );
    this.walletManager.addEventListener(
      'chainChanged',
      this.boundHandleChainChanged
    );
    this.walletManager.addEventListener(
      'accountChanged',
      this.boundHandleAccountChanged
    );
  }

  cleanupEventListeners() {
    this.unsubscribeFromWalletManagerEvents();
  }

  unsubscribeFromWalletManagerEvents() {
    if (this.walletManager) {
      this.walletManager.removeEventListener(
        'connected',
        this.boundHandleConnected
      );
      this.walletManager.removeEventListener(
        'disconnected',
        this.boundHandleDisconnected
      );
      this.walletManager.removeEventListener(
        'chainChanged',
        this.boundHandleChainChanged
      );
      this.walletManager.removeEventListener(
        'accountChanged',
        this.boundHandleAccountChanged
      );
    }
  }

  // ============================================================================
  // Event Handlers (from WalletManager)
  // ============================================================================

  handleConnected(event) {
    const { connection } = event.detail;

    // Update Stimulus values (triggers reactive callbacks)
    this.updateConnectionValues(connection);
    this.statusValue = 'connected';

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
        provider: connection.provider,
      },
    });
  }

  handleDisconnected() {
    // Clear Stimulus values
    this.clearConnectionValues();
    this.statusValue = 'disconnected';

    // Dispatch Stimulus event
    this.dispatch('disconnected');
  }

  handleChainChanged(event) {
    // Update chain ID value
    this.chainIdValue = event.detail.connection.chainId;

    // Dispatch Stimulus event
    this.dispatch('chainChanged', {
      detail: { chainId: event.detail.connection.chainId },
    });
  }

  handleAccountChanged(event) {
    // Update address value
    this.addressValue = event.detail.connection.address;

    // Dispatch Stimulus event
    this.dispatch('accountChanged', {
      detail: { address: event.detail.connection.address },
    });
  }

  updateConnectionValues(connection) {
    this.addressValue = connection.address;
    this.chainIdValue = connection.chainId;
    this.walletNameValue = connection.name;
    this.rdnsValue = connection.rdns;
    this.familyValue = connection.family;
    this.isConnectedValue = true;
  }

  clearConnectionValues() {
    this.addressValue = '';
    this.chainIdValue = '';
    this.walletNameValue = '';
    this.rdnsValue = '';
    this.familyValue = '';
    this.isConnectedValue = false;
  }

  // ============================================================================
  // Reactive Callbacks (Stimulus pattern for state changes)
  // ============================================================================

  connectingValueChanged() {
    if (!this.modalManager || !this.modalManager.isModalOpen()) return;

    if (this.connectingValue) {
      this.modalManager.showLoading();
    } else {
      this.modalManager.hideLoading();
    }
  }

  statusValueChanged() {
    // Dispatch a status change event that other controllers can listen to
    this.dispatch('status-changed', { detail: { status: this.statusValue } });
  }
}
