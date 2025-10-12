import { Controller } from "@hotwired/stimulus"
import { createStore } from 'mipd';
import { updateButtonState, resetWalletUI, updateWalletInfo } from '../utils/utils.js';
import { renderWallets } from '../utils/wallets.js';
import { WalletManager } from '../core/wallet_manager.js';
import { showError, showErrorAndWait, getErrorMessage } from '../utils/error_handler.js';

export default class extends Controller {
  static targets = [
    "connectWalletBtn",
    "walletButtons",
    "walletInfo",
    "errorModal",
    "errorMessage",
    "allWalletsContainer",
    "viewAllWalletsBtn"
  ]

  static outlets = ["modal"]

  static values = {
    walletDetection: { type: Boolean, default: false },
    walletInfoLoading: { type: Boolean, default: false },
    isConnected: { type: Boolean, default: false }
  }

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

    // Initialize UI
    updateButtonState(this, false);
    this.initializeWalletDetection();

    // Set initial state based on active connection
    if (this.walletManager.getActiveConnection()) {
      this.isConnectedValue = true;
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
      showError(this, 'Invalid wallet selection. Please try again.');
      updateButtonState(this, false);
      return;
    }

    this.closeModal();
    updateButtonState(this, false, true);
    button.classList.add('loading');

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout. Please try again.')), 30000);
      });

      await Promise.race([this.walletManager.connect(rdns), timeoutPromise]);
    } catch (error) {
      console.error('Wallet connection error:', error);
      await showErrorAndWait(this, getErrorMessage(error));
      updateButtonState(this, false);
    } finally {
      button.classList.remove('loading');
    }
  }

  toggleAllWallets() {
    if (this.hasAllWalletsContainerTarget && this.hasViewAllWalletsBtnTarget) {
      const isHidden = this.allWalletsContainerTarget.hidden;
      this.allWalletsContainerTarget.hidden = !isHidden;
      this.viewAllWalletsBtnTarget.setAttribute('aria-expanded', String(!isHidden));

      const arrow = this.viewAllWalletsBtnTarget.querySelector('.dropdown-arrow');
      if (arrow) {
        arrow.textContent = isHidden ? '▲' : '▼';
      }
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
    this.walletDetectionValue = true;
    renderWallets(this.walletManager, this);

    let walletDetectionCompleted = false;

    this.mipdStore.subscribe(() => {
      renderWallets(this.walletManager, this);
      if (!walletDetectionCompleted) {
        walletDetectionCompleted = true;
        this.walletDetectionValue = false;
      }
    });

    setTimeout(() => {
      if (!walletDetectionCompleted) {
        walletDetectionCompleted = true;
        this.walletDetectionValue = false;
      }
    }, 500);
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
    updateWalletInfo(this, this.mipdStore, connection.name, connection.address, connection.rdns, connection.chainId, connection.family);
    this.isConnectedValue = true;
  }

  handleDisconnected() {
    resetWalletUI(this);
    this.isConnectedValue = false;
  }

  handleChainChanged(event) {
    this.updateConnectionState(event.detail.connection);
  }

  handleAccountChanged(event) {
    this.updateConnectionState(event.detail.connection);
  }

  updateConnectionState(connection) {
    if (!connection.address) {
      resetWalletUI(this);
      this.isConnectedValue = false;
      return;
    }

    this.walletInfoLoadingValue = true;
    updateWalletInfo(this, this.mipdStore, connection.name, connection.address, connection.rdns, connection.chainId, connection.family);
    setTimeout(() => this.walletInfoLoadingValue = false, 300);
  }

  // ============================================================================
  // Value Change Callbacks
  // ============================================================================

  walletDetectionValueChanged(value) {
    if (this.hasWalletButtonsTarget) {
      this.walletButtonsTarget.classList.toggle('loading', value);
    }
  }

  walletInfoLoadingValueChanged(value) {
    if (this.hasWalletInfoTarget) {
      this.walletInfoTarget.classList.toggle('loading', value);
    }
  }

  isConnectedValueChanged(value) {
    if (this.hasConnectWalletBtnTarget) {
      updateButtonState(this, value);
    }
  }
}
