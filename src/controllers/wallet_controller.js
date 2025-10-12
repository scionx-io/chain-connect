import { Controller } from "@hotwired/stimulus"

// A controller for managing individual wallet actions
export default class WalletController extends Controller {
  static targets = ["icon", "name", "details", "copyButton"]

  static values = {
    address: String,
    chainId: String,
    walletName: String,
    rdns: String,
    family: String,
    icon: String
  }

  connect() {
    // Initialize wallet display when controller connects
    this.updateWalletDisplay();
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
  // Wallet Display Methods
  // ============================================================================

  updateWalletDisplay() {
    // Update wallet icon if target exists
    if (this.hasIconTarget && this.iconValue) {
      if (this.iconTarget.tagName === 'IMG') {
        this.iconTarget.src = this.iconValue;
      } else {
        this.iconTarget.innerHTML = `<img src="${this.iconValue}" alt="${this.walletNameValue}" />`;
      }
    }

    // Update wallet name if target exists
    if (this.hasNameTarget && this.walletNameValue) {
      this.nameTarget.textContent = this.walletNameValue;
    }
  }

  formatAddress(address) {
    if (!address || address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  handleConnected(event) {
    const { address, chainId, name, rdns, family, icon } = event.detail;
    this.addressValue = address;
    this.chainIdValue = chainId;
    this.walletNameValue = name;
    this.rdnsValue = rdns;
    this.familyValue = family;
    this.iconValue = icon;
    this.dispatch('walletConnected', { detail: { address, chainId, name, rdns, family, icon } });
  }

  handleDisconnected() {
    this.addressValue = "";
    this.chainIdValue = "";
    this.walletNameValue = "";
    this.rdnsValue = "";
    this.familyValue = "";
    this.iconValue = "";
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

  iconValueChanged() {
    if (this.hasIconTarget) {
      if (this.iconTarget.tagName === 'IMG') {
        this.iconTarget.src = this.iconValue;
      } else {
        this.iconTarget.innerHTML = `<img src="${this.iconValue}" alt="${this.walletNameValue}" />`;
      }
    }
  }

  walletNameValueChanged() {
    if (this.hasNameTarget) {
      this.nameTarget.textContent = this.walletNameValue;
    }
  }
}