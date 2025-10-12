import { Controller } from "@hotwired/stimulus";
import { createStore } from 'mipd';
import { WalletManager } from '../core/wallet_manager.js';

// A controller for managing the list of wallets with filtering, sorting, and selection
export default class WalletsController extends Controller {
  static targets = ["list", "search", "filter"]

  static values = {
    sortBy: { type: String, default: 'name' },
    sortOrder: { type: String, default: 'asc' }, // asc or desc
    searchQuery: String
  }

  connect() {
    // Initialize services
    this.mipdStore = createStore();
    this.walletManager = new WalletManager(this.mipdStore);

    // Initialize wallet detection and list
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
      detail: { wallets: this.getFilteredAndSortedWallets() }
    });

    // Dispatch when new wallets inject
    this.mipdStoreUnsubscribe = this.mipdStore.subscribe(() => {
      this.dispatch('walletsDetected', {
        detail: { wallets: this.getFilteredAndSortedWallets() }
      });
    });
  }

  getFilteredAndSortedWallets() {
    let wallets = this.walletManager.getDetectedWallets();

    // Apply search filter
    if (this.searchQueryValue) {
      wallets = wallets.filter(wallet =>
        wallet.name.toLowerCase().includes(this.searchQueryValue.toLowerCase())
      );
    }

    // Apply sorting
    wallets = this.sortWallets(wallets);

    return wallets;
  }

  // ============================================================================
  // Wallet List Filtering and Sorting
  // ============================================================================

  sortWallets(wallets) {
    return wallets.sort((a, b) => {
      let result = 0;

      switch (this.sortByValue) {
        case 'name':
          result = a.name.localeCompare(b.name);
          break;
        case 'family':
          result = a.family.localeCompare(b.family);
          break;
        case 'rdns':
          result = a.rdns.localeCompare(b.rdns);
          break;
        default:
          result = a.name.localeCompare(b.name);
      }

      // Apply sort order (asc or desc)
      return this.sortOrderValue === 'desc' ? -result : result;
    });
  }

  // Action triggered by search input
  updateSearch(event) {
    this.searchQueryValue = event.target.value;
    this.dispatch('walletsDetected', {
      detail: { wallets: this.getFilteredAndSortedWallets() }
    });
  }

  // Action to change sort criteria
  changeSort(event) {
    const sortBy = event.target.value;
    // If the same column is clicked again, toggle the sort direction
    if (this.sortByValue === sortBy) {
      this.sortOrderValue = this.sortOrderValue === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortByValue = sortBy;
      this.sortOrderValue = 'asc'; // Default to ascending for new column
    }
    this.dispatch('walletsDetected', {
      detail: { wallets: this.getFilteredAndSortedWallets() }
    });
  }

  // Action to reset filters
  resetFilters() {
    this.searchQueryValue = "";
    if (this.hasSearchTarget) {
      this.searchTarget.value = "";
    }
    this.dispatch('walletsDetected', {
      detail: { wallets: this.getFilteredAndSortedWallets() }
    });
  }
}