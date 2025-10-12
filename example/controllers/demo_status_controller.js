import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static targets = ['statusDisplay'];

  connect() {
    // Initialize with disconnected state
    this.renderDisconnected();
  }

  handleConnected(event) {
    const { address, chainId, name, family } = event.detail;
    // Render however you want
    this.statusDisplayTarget.innerHTML = `
      <p>Connected: ${name}</p>
      <p>Address: ${address}</p>
      <p>Chain: ${chainId}</p>
      <p>Family: ${family}</p>
    `;
  }

  handleDisconnected() {
    this.renderDisconnected();
  }

  handleChainChanged(event) {
    const { chainId } = event.detail;
    // Update the chain in the UI
    this.updateChain(chainId);
  }

  handleAccountChanged(event) {
    const { address } = event.detail;
    // Update the address in the UI
    this.updateAddress(address);
  }

  handleError(event) {
    alert(event.detail.message);
  }

  renderDisconnected() {
    this.statusDisplayTarget.innerHTML = '<p>Not connected</p>';
  }

  updateChain(chainId) {
    const chainElement = this.statusDisplayTarget.querySelector('.wallet-connector-chain');
    if (chainElement) {
      chainElement.textContent = chainId;
    }
  }

  updateAddress(address) {
    const addressElement = this.statusDisplayTarget.querySelector('.wallet-connector-address');
    if (addressElement) {
      addressElement.textContent = address;
    }
  }
}