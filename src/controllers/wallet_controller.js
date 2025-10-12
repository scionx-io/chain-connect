import { Controller } from "@hotwired/stimulus"

// A controller for managing individual wallet actions and status
export default class WalletController extends Controller {
  static targets = ["status", "address", "chain", "details", "copyButton"]

  static values = {
    address: String,
    chainId: String,
    walletName: String,
    rdns: String,
    family: String,
    isConnected: { type: Boolean, default: false }
  }

  connect() {
    // Initialize wallet status display when controller connects
    this.updateStatusDisplay();
  }

  // ============================================================================
  // User Actions (Stimulus Actions)
  // ============================================================================

  async disconnectWallet() {
    this.dispatch('disconnecting', { detail: { rdns: this.rdnsValue } });
  }

  // Copy wallet address to clipboard
  async copyAddress() {
    if (this.addressValue) {
      try {
        await navigator.clipboard.writeText(this.addressValue);
        this.dispatch('addressCopied', { detail: { address: this.addressValue } });
        
        // Visual feedback
        if (this.hasCopyButtonTarget) {
          const originalText = this.copyButtonTarget.textContent;
          this.copyButtonTarget.textContent = 'Copied!';
          setTimeout(() => {
            this.copyButtonTarget.textContent = originalText;
          }, 2000);
        }
      } catch (err) {
        console.error('Failed to copy address: ', err);
        this.dispatch('copyError', { detail: { error: err } });
      }
    }
  }

  // Show wallet details (if details target exists)
  showDetails() {
    if (this.hasDetailsTarget) {
      this.detailsTarget.classList.remove('hidden');
      this.detailsTarget.innerHTML = `
        <div class="wallet-details">
          <h3>${this.walletNameValue}</h3>
          <p><strong>Address:</strong> ${this.formatAddress(this.addressValue)}</p>
          <p><strong>Chain ID:</strong> ${this.chainIdValue}</p>
          <p><strong>Family:</strong> ${this.familyValue}</p>
          <p><strong>RDNS:</strong> ${this.rdnsValue}</p>
        </div>
      `;
    }
  }

  // Hide wallet details
  hideDetails() {
    if (this.hasDetailsTarget) {
      this.detailsTarget.classList.add('hidden');
    }
  }

  // ============================================================================
  // Status Display Methods
  // ============================================================================

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
      this.addressTarget.textContent = this.formatAddress(this.addressValue);
    }

    // Update chain display if target exists
    if (this.hasChainTarget && this.chainIdValue) {
      this.chainTarget.textContent = this.formatChainId(this.chainIdValue);
    }
  }

  formatAddress(address) {
    if (!address || address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  formatChainId(chainId) {
    // Convert hex chain ID to decimal if needed
    if (chainId && chainId.startsWith('0x')) {
      return parseInt(chainId, 16).toString();
    }
    return chainId || '';
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  handleConnected(event) {
    const { address, chainId, name, rdns, family } = event.detail;
    this.addressValue = address;
    this.chainIdValue = chainId;
    this.walletNameValue = name;
    this.rdnsValue = rdns;
    this.familyValue = family;
    this.isConnectedValue = true;
    this.dispatch('walletConnected', { detail: { address, chainId, name, rdns, family } });
  }

  handleDisconnected() {
    this.addressValue = "";
    this.chainIdValue = "";
    this.walletNameValue = "";
    this.rdnsValue = "";
    this.familyValue = "";
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

  // ============================================================================
  // Value Change Callbacks
  // ============================================================================

  addressValueChanged() {
    if (this.hasAddressTarget) {
      this.addressTarget.textContent = this.formatAddress(this.addressValue);
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