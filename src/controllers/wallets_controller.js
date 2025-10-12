import { Controller } from "@hotwired/stimulus";

// A controller for handling wallet selection
export default class WalletsController extends Controller {
  // Method to select a wallet
  selectWallet(event) {
    const button = event.currentTarget;
    const rdns = button.dataset.walletRdns;

    if (!rdns) {
      this.dispatch('error', {
        detail: { message: 'Invalid wallet selection' }
      });
      return;
    }

    // Dispatch event that the ConnectorController will listen for
    this.dispatch('walletSelected', { 
      detail: { rdns: rdns },
      bubbles: true
    });
  }
}