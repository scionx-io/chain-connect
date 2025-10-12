import { Controller } from '@hotwired/stimulus';

export default class DemoController extends Controller {
  static targets = ['status'];
  static outlets = ['wallet'];

  connect() {
    this.updateStatus();
  }

  handleConnected(event) {
    this.updateStatus();
  }

  handleDisconnected(event) {
    this.updateStatus();
  }

  handleError(event) {
    alert(`Error: ${event.detail.message}`);
  }

  updateStatus() {
    if (!this.hasWalletOutlet) return;

    const wallet = this.walletOutlet;

    if (wallet.isConnectedValue) {
      this.statusTarget.innerHTML = `
        <p><strong>Connected!</strong></p>
        <p>Wallet: ${wallet.walletNameValue}</p>
        <p>Address: <code>${wallet.addressValue}</code></p>
        <p>Chain: ${wallet.chainIdValue}</p>
        <p>Family: ${wallet.familyValue}</p>
      `;
    } else {
      this.statusTarget.innerHTML = '<p><strong>Not connected</strong></p>';
    }
  }
}
