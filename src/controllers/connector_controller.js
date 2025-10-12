import { Controller } from "@hotwired/stimulus"
import { createStore } from 'mipd';
import { WalletManager } from '../core/wallet_manager.js';

// A controller that handles wallet connection management and modal operations
export default class ConnectorController extends Controller {
  // Stimulus targets
  static targets = []
  // Stimulus outlets
  static outlets = ["modal"]

  // Stimulus values - reactive state management
  static values = {
    address: String,
    chainId: String,
    walletName: String,
    rdns: String,
    family: String,
    isConnected: { type: Boolean, default: false },
    connecting: { type: Boolean, default: false },
    selectedRdns: String
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  connect() {
    // Initialize services
    this.mipdStore = createStore();
    this.walletManager = new WalletManager(this.mipdStore);

    // Set up event listeners for WalletManager events
    this.setupEventListeners();

    // Initialize wallet manager for auto-reconnect
    this.walletManager.init();


  }

  disconnect() {
    this.cleanupEventListeners();

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
    if (this.hasModalOutlet) {
      const wallets = this.walletManager.getDetectedWallets();
      this.modalOutlet.renderModal(wallets);
      this.modalOutlet.open();
    }
  }

  async disconnectWallet() {
    if (this.walletManager.getActiveConnection()) {
      const rdns = this.walletManager.getActiveConnection().rdns;
      await this.walletManager.disconnect(rdns);
    }
  }

  // ============================================================================
  // Wallet Detection
  // ============================================================================






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
  // Value Change Callbacks (Stimulus Reactive Updates)
  // ============================================================================

  connectingValueChanged(isConnecting) {
    // Update loading state on selected wallet button
    // This functionality may need to be handled by wallet buttons themselves
    // or through communication with the modal controller
  }

  isConnectedValueChanged(isConnected) {
    // Add/remove class to controller element for CSS targeting
    this.element.classList.toggle('wallet-connected', isConnected);
  }
}