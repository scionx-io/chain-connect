import { Controller } from "@hotwired/stimulus"
import { createStore } from 'mipd';
import { updateButtonState, resetWalletUI, updateWalletInfo } from '../utils.js';
import { renderWallets } from '../wallets.js';
import { WalletManager } from '../wallet_manager.js';

export default class extends Controller {
  static targets = [
    "modal",
    "connectWalletBtn",
    "closeModalBtn",
    "walletButtons",
    "walletInfo",
    "walletAddress",
    "walletName",
    "walletChain",
    "disconnectBtn"
  ]

  static values = {
    walletDetection: { type: Boolean, default: false },
    chainSwitching: { type: Boolean, default: false },
    accountChange: { type: Boolean, default: false }
  }

  connect() {
    this.mipdStore = createStore();
    this.walletManager = new WalletManager(this.mipdStore);

    // Bind event handlers
    this.handleConnected = this.handleConnected.bind(this);
    this.handleDisconnected = this.handleDisconnected.bind(this);
    this.handleStateChanged = this.handleStateChanged.bind(this);
    this.handleChainChanged = this.handleChainChanged.bind(this);
    this.handleAccountChanged = this.handleAccountChanged.bind(this);

    // Add event listeners
    this.walletManager.addEventListener('connected', this.handleConnected);
    this.walletManager.addEventListener('disconnected', this.handleDisconnected);
    this.walletManager.addEventListener('stateChanged', this.handleStateChanged);
    this.walletManager.addEventListener('chainChanged', this.handleChainChanged);
    this.walletManager.addEventListener('accountChanged', this.handleAccountChanged);

    // Initialize wallet manager for auto-reconnect
    this.walletManager.init();

    updateButtonState(this, false);

    // Set loading state during initial wallet detection
    this.walletDetectionValue = true;

    renderWallets(this.mipdStore, this);

    // Use a flag to ensure loading state is turned off after initialization
    let walletDetectionCompleted = false;

    this.mipdStore.subscribe(() => {
      renderWallets(this.mipdStore, this);
      // Turn off loading state after wallet detection completes
      if (!walletDetectionCompleted) {
        walletDetectionCompleted = true;
        this.walletDetectionValue = false;
      }
    });

    // Set a timeout to ensure loading state is turned off even if no MIPD updates occur
    setTimeout(() => {
      if (!walletDetectionCompleted) {
        walletDetectionCompleted = true;
        this.walletDetectionValue = false;
      }
    }, 500); // 500ms should be enough for wallet detection to complete
  }

  disconnect() {
    this.walletManager.removeEventListener('connected', this.handleConnected);
    this.walletManager.removeEventListener('disconnected', this.handleDisconnected);
    this.walletManager.removeEventListener('stateChanged', this.handleStateChanged);
    this.walletManager.removeEventListener('chainChanged', this.handleChainChanged);
    this.walletManager.removeEventListener('accountChanged', this.handleAccountChanged);

    if (this.walletManager.activeConnection) {
      this.walletManager.disconnect(this.walletManager.activeConnection.rdns);
    }
  }

  openModal() {
    this.modalTarget.showModal()
  }

  closeModal() {
    this.modalTarget.close()
  }

  closeModalOnOutsideClick(event) {
    if (event.target === this.modalTarget) {
      this.closeModal()
    }
  }

  async selectWallet(event) {
    const button = event.target.closest('.wallet-button');
    if (!button) return;

    const rdns = button.getAttribute('data-wallet-rdns');

    if (!rdns) {
      this.showError('Invalid wallet selection. Please try again.');
      updateButtonState(this, false);
      return;
    }

    this.closeModal();
    updateButtonState(this, false, true);

    // Add loading indicator to the selected wallet button
    button.classList.add('loading');

    try {
      // Set a timeout for the connection attempt
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout. Please try again.')), 30000); // 30 second timeout
      });

      const connectPromise = this.walletManager.connect(rdns);

      // Race between connection and timeout
      await Promise.race([connectPromise, timeoutPromise]);
    } catch (error) {
      console.error('Wallet connection error:', error);
      
      let errorMessage = 'An unexpected error occurred while connecting to the wallet.';
      
      // Handle specific error types
      if (error.message.includes('not found or not available')) {
        errorMessage = 'Wallet not found or not available. Please make sure the wallet extension is installed and enabled.';
      } else if (error.message.includes('No handler for wallet family')) {
        errorMessage = 'Wallet family not supported. This type of wallet is not currently supported.';
      } else if (error.code === 4001 || error.message.toLowerCase().includes('user rejected')) {
        errorMessage = 'User rejected the connection request. Please try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timed out. Please check your internet connection and try again.';
      } else if (error.message.includes('No accounts found')) {
        errorMessage = 'No accounts found in the wallet. Please create an account in your wallet application.';
      } else if (error.message.includes('Tron wallet not found')) {
        errorMessage = 'Tron wallet not found. Please ensure TronLink or TronWeb is installed and accessible.';
      } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error occurred. Please check your internet connection.';
      }
      
      this.showError(errorMessage);
      updateButtonState(this, false);
    } finally {
      // Remove loading indicator from the selected wallet button
      button.classList.remove('loading');
    }
  }
  
  toggleAllWallets(event) {
    const button = event.currentTarget;
    const allWalletsContainer = this.walletButtonsTarget.querySelector('.all-wallets-container');
    
    if (allWalletsContainer.hasAttribute('hidden')) {
      allWalletsContainer.removeAttribute('hidden');
      button.setAttribute('aria-expanded', 'true');
      const arrow = button.querySelector('.dropdown-arrow');
      if (arrow) {
        arrow.textContent = '▲';
      }
    } else {
      allWalletsContainer.setAttribute('hidden', '');
      button.setAttribute('aria-expanded', 'false');
      const arrow = button.querySelector('.dropdown-arrow');
      if (arrow) {
        arrow.textContent = '▼';
      }
    }
  }

  handleConnected(event) {
    const { connection } = event.detail;
    updateWalletInfo(this, this.mipdStore, connection.name, connection.address, connection.rdns, connection.chainId, connection.walletType);
  }

  handleDisconnected() {
    resetWalletUI(this);
  }
  
  // Handle state changes (account/chain changes)
  handleStateChanged(event) {
    this.handleWalletStateChange(event, 'account');
  }
  
  // Handle chain changes specifically
  handleChainChanged(event) {
    this.handleWalletStateChange(event, 'chain');
  }
  
  // Handle account changes specifically
  handleAccountChanged(event) {
    this.handleWalletStateChange(event, 'account');
  }
  
  // Unified handler for wallet state changes
  handleWalletStateChange(event, changeType) {
    const { connection } = event.detail;

    // Set the appropriate loading state based on change type
    if (changeType === 'chain') {
      this.chainSwitchingValue = true;
    } else { // account changes
      this.accountChangeValue = true;
    }

    // Update the UI with new connection information
    updateWalletInfo(this, this.mipdStore, connection.name, connection.address, connection.rdns, connection.chainId, connection.walletType);

    // Remove loading indicator after a short delay to ensure UI updates
    setTimeout(() => {
      if (changeType === 'chain') {
        this.chainSwitchingValue = false;
      } else { // account changes
        this.accountChangeValue = false;
      }
    }, 300);
  }
  
  // Set loading state for wallet detection
  walletDetectionValueChanged(value, previousValue) {
    this.walletButtonsTarget.classList.toggle('loading', value);
  }
  
  // Set loading state for chain switching
  chainSwitchingValueChanged(value, previousValue) {
    this.walletInfoTarget.classList.toggle('loading', value);
  }
  
  // Set loading state for account changes
  accountChangeValueChanged(value, previousValue) {
    this.walletInfoTarget.classList.toggle('loading', value);
  }
  
  showError(message) {
    // Create a more user-friendly error display
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // Remove the error message after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }
}