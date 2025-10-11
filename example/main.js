// Import Stimulus and the wallet connector
import { Application } from '@hotwired/stimulus';
import { WalletController } from '@scionx/chain-connect';

// Register the wallet controller with Stimulus
const application = Application.start();
application.register('wallet', WalletController);

console.log('Wallet connector example initialized');