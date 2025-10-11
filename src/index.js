// Main entry point for the wallet connector library
import { WalletManager } from './wallet_manager.js';
import { WalletProviderResolver } from './services/wallet_provider_resolver.js';
import { updateButtonState, resetWalletUI, updateWalletInfo } from './utils.js';
import { renderWallets } from './wallets.js';
import { WALLET_ICONS } from './config.js';
import { getChainName, formatChainDisplay } from './chain_utils.js';
import './css/wallet-connector.css';

// Export core components
export {
  WalletManager,
  WalletProviderResolver,
  updateButtonState,
  resetWalletUI,
  updateWalletInfo,
  renderWallets,
  WALLET_ICONS,
  getChainName,
  formatChainDisplay
};

// Export wallet handlers
export { default as EvmHandler } from './wallets/evm_handler.js';
export { default as SolanaHandler } from './wallets/solana_handler.js';
export { default as TronHandler } from './wallets/tron_handler.js';

// Export controllers for those who want to use it with Stimulus
export { default as WalletController } from './controllers/wallet_controller.js';
export { default as ChainConnectController } from './controllers/chain_connected_controller.js';

// Main initialization function for the wallet connector
export function initializeWalletConnector(mipdStore, targetElement) {
  const walletManager = new WalletManager(mipdStore);
  
  // Initialize wallet manager for auto-reconnect
  walletManager.init();
  
  return walletManager;
}

// Simple initialization function if user doesn't want to manage store themselves
export async function createWalletConnector() {
  const { createStore } = await import('mipd');
  const mipdStore = createStore();
  
  return initializeWalletConnector(mipdStore);
}