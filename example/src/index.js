// Main entry point for the wallet connector library
import { WalletManager } from './core/wallet_manager.js';
import { updateButtonState, resetWalletUI, updateWalletInfo } from './utils/utils.js';
import { renderWallets } from './utils/wallets.js';
import { WALLET_ICONS } from './utils/config.js';
import { getChainName, formatChainDisplay } from './utils/chain_utils.js';
import './css/wallet-connector.css';

// Export core components
export {
  WalletManager,
  updateButtonState,
  resetWalletUI,
  updateWalletInfo,
  renderWallets,
  WALLET_ICONS,
  getChainName,
  formatChainDisplay
};

// Export wallet handlers
export { default as EvmHandler } from './core/wallets/evm_handler.js';
export { default as SolanaHandler } from './core/wallets/solana_handler.js';
export { default as TronHandler } from './core/wallets/tron_handler.js';

// Export controllers for those who want to use it with Stimulus
export { default as ConnectorController } from './controllers/connector_controller.js';
export { default as ModalController } from './controllers/modal_controller.js';

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