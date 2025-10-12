import { Controller } from "@hotwired/stimulus";

export default class WalletsController extends Controller {
  static outlets = ["connector"]
  
  static values = {
    isConnected: { type: Boolean, default: false }
  }

  connect() {
    // Set up event listeners if we have a connector outlet
    if (this.hasConnectorOutlet) {
      this.setupConnectorEventListeners();
    }
  }

  disconnect() {
    // Clean up event listeners when disconnecting
    this.cleanupConnectorEventListeners();
  }

  setupConnectorEventListeners() {
    this.boundHandleConnected = this.handleConnected.bind(this);
    this.boundHandleDisconnected = this.handleDisconnected.bind(this);

    // Add event listeners to the connector controller
    this.connectorOutlet.addEventListener('connected', this.boundHandleConnected);
    this.connectorOutlet.addEventListener('disconnected', this.boundHandleDisconnected);
  }

  cleanupConnectorEventListeners() {
    if (this.connectorOutlet && this.boundHandleConnected && this.boundHandleDisconnected) {
      this.connectorOutlet.removeEventListener('connected', this.boundHandleConnected);
      this.connectorOutlet.removeEventListener('disconnected', this.boundHandleDisconnected);
    }
  }

  handleConnected(event) {
    // Update our local isConnected value to trigger the reactive callback
    this.isConnectedValue = true;
  }

  handleDisconnected(event) {
    // Update our local isConnected value to trigger the reactive callback
    this.isConnectedValue = false;
  }
  
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
      
      // Close modal if modal outlet is available
      if (this.connectorOutlet.hasModalOutlet) {
        this.connectorOutlet.modalOutlet.close();
      }
      
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

  isConnectedValueChanged(isConnected) {
    // Add/remove class to controller element for CSS targeting
    this.element.classList.toggle('wallet-connected', isConnected);
  }
}