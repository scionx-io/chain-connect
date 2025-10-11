import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static targets = ['isConnected', 'demoAddress', 'demoChainId', 'demoProvider', 'eventLog'];

  connect() {
    // Get access to the chain-connect controller after it's initialized
    setTimeout(() => {
      const chainConnectController = this.application.getControllerForElementAndIdentifier(
        this.element.querySelector('[data-controller="chain-connect"]'), 
        'chain-connect'
      );
      
      if (chainConnectController) {
        // Create a function to update the demo display
        this.updateDemoDisplay = () => {
          if (this.hasIsConnectedTarget) {
            this.isConnectedTarget.textContent = chainConnectController.isConnected;
          }
          if (this.hasDemoAddressTarget) {
            this.demoAddressTarget.textContent = chainConnectController.address || 'Not connected';
          }
          if (this.hasDemoChainIdTarget) {
            this.demoChainIdTarget.textContent = chainConnectController.chainId || 'Not connected';
          }
          if (this.hasDemoProviderTarget) {
            this.demoProviderTarget.textContent = chainConnectController.provider ? 'Available' : 'Not available';
          }
        };
        
        // Update display immediately
        this.updateDemoDisplay();
        
        // Subscribe to wallet state changes
        this.unsubscribe = chainConnectController.subscribe((state) => {
          if (this.hasEventLogTarget) {
            const eventEntry = document.createElement('div');
            eventEntry.className = 'event-entry';
            eventEntry.textContent = `State changed at ${new Date().toLocaleTimeString()}: isConnected=${state.isConnected}, address=${state.address || 'null'}, chainId=${state.chainId || 'null'}`;
            this.eventLogTarget.prepend(eventEntry);
          }
          
          // Update display after state change
          this.updateDemoDisplay();
        });
        
        console.log('Chain connect controller properties demo loaded');
      } else {
        console.error('Could not access chain-connect controller');
      }
    }, 1000); // Small delay to ensure controller is initialized
  }

  disconnect() {
    // Clean up subscription if it exists
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}