import { Controller } from "@hotwired/stimulus";
import { createStore } from 'mipd';
import { WalletManager } from '../core/wallet_manager.js';

// A controller for providing the list of detected wallets
export default class WalletsController extends Controller {
  static targets = []

  connect() {
    // Initialize services
    this.mipdStore = createStore();
    this.walletManager = new WalletManager(this.mipdStore);

    // Initialize wallet detection
    this.initializeWalletList();
  }

  disconnect() {
    // Unsubscribe from MIPD store
    if (this.mipdStoreUnsubscribe) {
      this.mipdStoreUnsubscribe();
    }
  }

  // ============================================================================
  // Wallet List Management
  // ============================================================================

  initializeWalletList() {
    // Dispatch event for apps that want to show wallet info elsewhere
    this.dispatch('walletsDetected', {
      detail: { wallets: this.walletManager.getDetectedWallets() }
    });

    // Dispatch when new wallets inject
    this.mipdStoreUnsubscribe = this.mipdStore.subscribe(() => {
      this.dispatch('walletsDetected', {
        detail: { wallets: this.walletManager.getDetectedWallets() }
      });
    });
  }
}