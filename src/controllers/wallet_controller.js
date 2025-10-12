import { Controller } from "@hotwired/stimulus"

// A generic wallet controller that can be used for additional wallet-related functionality
// beyond the core connection management provided by ConnectorController
export default class WalletController extends Controller {
  static targets = ["status", "address", "chain"]

  static values = {
    address: String,
    chainId: String,
    isConnected: { type: Boolean, default: false }
  }

  connect() {
    // Initialize wallet status display when controller connects
    this.updateStatusDisplay();
  }

  // Method to update wallet status display
  updateStatusDisplay() {
    if (this.hasStatusTarget) {
      if (this.isConnectedValue) {
        this.statusTarget.textContent = "Connected";
        this.statusTarget.classList.add("connected");
        this.statusTarget.classList.remove("disconnected");
      } else {
        this.statusTarget.textContent = "Disconnected";
        this.statusTarget.classList.add("disconnected");
        this.statusTarget.classList.remove("connected");
      }
    }

    // Update address display if target exists
    if (this.hasAddressTarget && this.addressValue) {
      this.addressTarget.textContent = this.truncateAddress(this.addressValue);
    }

    // Update chain display if target exists
    if (this.hasChainTarget && this.chainIdValue) {
      this.chainTarget.textContent = this.formatChainId(this.chainIdValue);
    }
  }

  // Truncate long addresses for display
  truncateAddress(address) {
    if (!address || address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  // Format chain ID for display
  formatChainId(chainId) {
    // Convert hex chain ID to decimal if needed
    if (chainId.startsWith('0x')) {
      return parseInt(chainId, 16).toString();
    }
    return chainId;
  }

  // Event handlers for wallet events dispatched by ConnectorController
  handleConnected(event) {
    const { address, chainId, name } = event.detail;
    this.addressValue = address;
    this.chainIdValue = chainId;
    this.isConnectedValue = true;
    this.dispatch('walletConnected', { detail: { address, chainId, name } });
  }

  handleDisconnected() {
    this.addressValue = "";
    this.chainIdValue = "";
    this.isConnectedValue = false;
    this.dispatch('walletDisconnected');
  }

  handleChainChanged(event) {
    const { chainId } = event.detail;
    this.chainIdValue = chainId;
    this.dispatch('walletChainChanged', { detail: { chainId } });
  }

  handleAccountChanged(event) {
    const { address } = event.detail;
    this.addressValue = address;
    this.dispatch('walletAccountChanged', { detail: { address } });
  }

  // Reactive value change callbacks
  addressValueChanged() {
    if (this.hasAddressTarget) {
      this.addressTarget.textContent = this.truncateAddress(this.addressValue);
    }
  }

  chainIdValueChanged() {
    if (this.hasChainTarget) {
      this.chainTarget.textContent = this.formatChainId(this.chainIdValue);
    }
  }

  isConnectedValueChanged() {
    this.updateStatusDisplay();
  }
}