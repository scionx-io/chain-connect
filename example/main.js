// Import Stimulus and the wallet connector
import { Application } from '@hotwired/stimulus';
import { WalletController, ChainConnectController } from '@scionx/chain-connect';

// Register the wallet controller with Stimulus
const application = Application.start();
application.register('wallet', WalletController);
application.register('chain-connect', ChainConnectController);

// Wait for DOM to be fully loaded and controllers to be initialized
document.addEventListener('DOMContentLoaded', () => {
  // Get access to the chain-connect controller after it's initialized
  setTimeout(() => {
    const chainConnectController = window.Stimulus.getControllerForElementAndIdentifier(
      document.querySelector('[data-controller="chain-connect"]'), 
      'chain-connect'
    );
    
    if (chainConnectController) {
      // Create a function to update the demo display
      const updateDemoDisplay = () => {
        document.getElementById('isConnected').textContent = chainConnectController.isConnected;
        document.getElementById('demoAddress').textContent = chainConnectController.address || 'Not connected';
        document.getElementById('demoChainId').textContent = chainConnectController.chainId || 'Not connected';
        document.getElementById('demoProvider').textContent = chainConnectController.provider ? 'Available' : 'Not available';
      };
      
      // Update display immediately
      updateDemoDisplay();
      
      // Subscribe to wallet state changes
      const unsubscribe = chainConnectController.subscribe((state) => {
        const eventLog = document.getElementById('eventLog');
        const eventEntry = document.createElement('div');
        eventEntry.className = 'event-entry';
        eventEntry.textContent = `State changed at ${new Date().toLocaleTimeString()}: isConnected=${state.isConnected}, address=${state.address || 'null'}, chainId=${state.chainId || 'null'}`;
        eventLog.prepend(eventEntry);
        
        // Update display after state change
        updateDemoDisplay();
      });
      
      console.log('Chain connect controller properties demo loaded');
    } else {
      console.error('Could not access chain-connect controller');
    }
  }, 1000); // Small delay to ensure controller is initialized
});

console.log('Wallet connector example initialized');