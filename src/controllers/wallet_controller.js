import { Controller } from '@hotwired/stimulus';
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
    connecting: { type: Boolean, default: false },
  };

  // ============================================================================
  // Lifecycle
  // ============================================================================

  connect() {
    // Initialize services
    this.mipdStore = createStore();
    this.walletManager = new WalletManager(this.mipdStore);
    this.modalElement = null;
    this.lastSelectedRdns = null;

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
    this.modalElement = renderWalletModal(
      wallets,
      this.boundSelectWallet,
      this.boundClose
    );
    document.body.appendChild(this.modalElement);

    // Store references for loading state (can't use Stimulus targets since modal is outside controller element)
    this.loadingOverlay = this.modalElement.querySelector(
      '.wallet-loading-overlay'
    );
    this.buttonsContainer = this.modalElement.querySelector(
      '.wallet-buttons-container'
    );
    this.walletButtons = this.modalElement.querySelectorAll('.wallet-button');

    // Store references for error state
    this.errorOverlay = this.modalElement.querySelector(
      '.wallet-error-overlay'
    );
    this.errorMessage = this.modalElement.querySelector(
      '.wallet-error-message'
    );
    this.errorBackButton =
      this.modalElement.querySelector('.wallet-error-back');
    this.errorRetryButton = this.modalElement.querySelector(
      '.wallet-error-retry'
    );

    // Bind error button handlers
    if (this.errorBackButton) {
      this.errorBackButton.addEventListener('click', () => this.hideError());
    }
    if (this.errorRetryButton) {
      this.errorRetryButton.addEventListener('click', () =>
        this.retryConnection()
      );
    }
  }

  close() {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
      // Clean up references
      this.loadingOverlay = null;
      this.buttonsContainer = null;
      this.walletButtons = null;
      this.errorOverlay = null;
      this.errorMessage = null;
      this.errorBackButton = null;
      this.errorRetryButton = null;
    }
  }

  async selectWallet(event) {
    const button = event.currentTarget;
    const rdns = button.dataset.walletRdns;

    if (!rdns) {
      this.dispatch('error', {
        detail: { message: 'Invalid wallet selection' },
      });
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

      this.dispatch('error', {
        detail: {
          message: error.message || 'Connection failed',
          error,
        },
      });
    } finally {
      this.connectingValue = false;
    }
  }

  showError(error) {
    if (!this.modalElement || !this.errorOverlay) return;

    // Determine error message based on error type
    let message = 'Please try again or choose a different wallet.';

    if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
      message = 'You cancelled the connection request.';
    } else if (error.message) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes('reject') ||
        msg.includes('cancel') ||
        msg.includes('denied')
      ) {
        message = 'You cancelled the connection request.';
      } else if (msg.includes('timeout')) {
        message = 'Connection request timed out.';
      } else {
        message = error.message;
      }
    }

    // Update error message text
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
    }

    // Show error overlay
    this.errorOverlay.classList.remove('hidden');
  }

  hideError() {
    if (this.errorOverlay) {
      this.errorOverlay.classList.add('hidden');
    }
  }

  async retryConnection() {
    if (!this.lastSelectedRdns) return;

    // Hide error overlay
    this.hideError();

    // Retry connection directly - no fake events needed
    await this.connectToWallet(this.lastSelectedRdns);
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
        provider: connection.provider,
      },
    });
  }

  handleDisconnected() {
    // Clear Stimulus values
    this.addressValue = '';
    this.chainIdValue = '';
    this.walletNameValue = '';
    this.rdnsValue = '';
    this.familyValue = '';
    this.isConnectedValue = false;

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

  // ============================================================================
  // Reactive Callbacks (Stimulus pattern for state changes)
  // ============================================================================

  connectingValueChanged() {
    if (!this.modalElement) return;

    if (this.connectingValue) {
      // Show loading state - disable all buttons and show overlay
      if (this.loadingOverlay) this.loadingOverlay.classList.remove('hidden');
      if (this.buttonsContainer) {
        this.buttonsContainer.style.pointerEvents = 'none';
        this.buttonsContainer.style.opacity = '0.5';
      }
      if (this.walletButtons) {
        this.walletButtons.forEach((btn) => (btn.disabled = true));
      }
    } else {
      // Hide loading state - re-enable buttons
      if (this.loadingOverlay) this.loadingOverlay.classList.add('hidden');
      if (this.buttonsContainer) {
        this.buttonsContainer.style.pointerEvents = '';
        this.buttonsContainer.style.opacity = '';
      }
      if (this.walletButtons) {
        this.walletButtons.forEach((btn) => (btn.disabled = false));
      }
    }
  }
}
