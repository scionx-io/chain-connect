import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static targets = ['statusDisplay', 'valuesDisplay'];

  // Connect to wallet controller via outlets to access Stimulus values
  static outlets = ['wallet'];

  connect() {
    // Initialize with disconnected state
    this.renderDisconnected();
  }

  // ============================================================================
  // Event-based Updates (recommended for most use cases)
  // ============================================================================

  handleConnected(event) {
    const { address, chainId, name, family } = event.detail;
    this.statusDisplayTarget.innerHTML = `
      <p><strong>Status:</strong> Connected</p>
      <p><strong>Wallet:</strong> ${name}</p>
      <p><strong>Address:</strong> <code>${address}</code></p>
      <p><strong>Chain ID:</strong> ${chainId}</p>
      <p><strong>Family:</strong> ${family}</p>
    `;

    // Also demonstrate accessing Stimulus values via outlet
    this.updateValuesDisplay();
  }

  handleDisconnected() {
    this.renderDisconnected();
    this.updateValuesDisplay();
  }

  handleChainChanged(event) {
    const { chainId } = event.detail;
    const chainElement = this.statusDisplayTarget.querySelector('code');
    if (chainElement && chainElement.previousSibling?.textContent?.includes('Chain')) {
      chainElement.textContent = chainId;
    }
    this.updateValuesDisplay();
  }

  handleAccountChanged(event) {
    const { address } = event.detail;
    const addressElement = this.statusDisplayTarget.querySelector('code');
    if (addressElement && addressElement.previousSibling?.textContent?.includes('Address')) {
      addressElement.textContent = address;
    }
    this.updateValuesDisplay();
  }

  handleError(event) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'background: #fee; border: 1px solid #f00; padding: 12px; margin: 12px 0; border-radius: 4px;';
    errorDiv.innerHTML = `<strong>Error:</strong> ${event.detail.message}`;
    this.statusDisplayTarget.insertBefore(errorDiv, this.statusDisplayTarget.firstChild);
    setTimeout(() => errorDiv.remove(), 5000);
  }

  handleConnecting(event) {
    const { rdns } = event.detail;
    this.statusDisplayTarget.innerHTML = `
      <p><strong>Status:</strong> Connecting to ${rdns}...</p>
    `;
  }

  // ============================================================================
  // Value-based Updates (accessing wallet controller Stimulus values)
  // ============================================================================

  updateValuesDisplay() {
    // Access wallet controller Stimulus values via outlet
    if (!this.hasWalletOutlet) return;

    if (this.hasValuesDisplayTarget) {
      this.valuesDisplayTarget.innerHTML = `
        <h3>Stimulus Values (via outlet):</h3>
        <pre>${JSON.stringify({
          isConnected: this.walletOutlet.isConnectedValue,
          address: this.walletOutlet.addressValue || 'null',
          chainId: this.walletOutlet.chainIdValue || 'null',
          walletName: this.walletOutlet.walletNameValue || 'null',
          family: this.walletOutlet.familyValue || 'null',
          connecting: this.walletOutlet.connectingValue
        }, null, 2)}</pre>
      `;
    }
  }

  renderDisconnected() {
    this.statusDisplayTarget.innerHTML = '<p><strong>Status:</strong> Not connected</p>';
  }
}