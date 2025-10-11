// Import Stimulus and the wallet connector
import { Application } from '@hotwired/stimulus';
import { WalletController, ChainConnectController } from '@scionx/chain-connect';
import DemoStatusController from './demo_status_controller.js';

// Register the wallet controller with Stimulus
const application = Application.start();
application.register('wallet', WalletController);
application.register('chain-connect', ChainConnectController);
application.register('demo-status', DemoStatusController);

console.log('Wallet connector example initialized');