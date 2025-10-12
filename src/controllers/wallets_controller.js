import { Controller } from "@hotwired/stimulus";

// A controller for handling wallet selection
export default class WalletsController extends Controller {
  static outlets = ["connector"]
  
  // Method called by other controllers to connect to a specific wallet
  async connectWallet(rdns) {
    if (!rdns) {
      this.dispatch('error', {
        detail: { message: 'Invalid wallet selection' }
      });
      return;
    }

    // Get the connector controller to handle the connection
    if (this.hasConnectorOutlet) {
      // Set connecting state in the connector
      this.connectorOutlet.connectingValue = true;
      this.connectorOutlet.selectedRdnsValue = rdns;
      
      this.connectorOutlet.closeModal();
      this.connectorOutlet.dispatch('connecting', { detail: { rdns } });

      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), 30000);
        });

        await Promise.race([this.connectorOutlet.walletManager.connect(rdns), timeoutPromise]);
      } catch (error) {
        console.error('Wallet connection error:', error);
        this.connectorOutlet.dispatch('error', {
          detail: {
            message: error.message || 'Connection failed',
            error
          }
        });
      } finally {
        this.connectorOutlet.connectingValue = false;
        this.connectorOutlet.selectedRdnsValue = "";
      }
    } else {
      // Fallback: dispatch event as before
      this.dispatch('walletSelected', { 
        detail: { rdns: rdns },
        bubbles: true
      });
    }
  }

  // Method to select a wallet
  async selectWallet(event) {
    const button = event.currentTarget;
    const rdns = button.dataset.walletRdns;

    if (!rdns) {
      this.dispatch('error', {
        detail: { message: 'Invalid wallet selection' }
      });
      return;
    }

    await this.connectWallet(rdns);
  }
}