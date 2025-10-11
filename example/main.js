// Import Stimulus and the wallet connector
import { Application } from '@hotwired/stimulus';
import { WalletController, ChainConnectController } from '@scionx/chain-connect';

// The controllers are already registered via the main controllers/index.js
// which includes wallet, chain-connect, and demo-status controllers

console.log('Wallet connector example initialized');