// Main entry point for the wallet connector library
import { WalletManager } from './core/wallet_manager.js';
import {
  updateButtonState,
  resetWalletUI,
  updateWalletInfo,
} from './utils/utils.js';
import { renderWallets } from './utils/wallets.js';
import { renderWalletModal } from './utils/modal_renderer.js';
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
  renderWalletModal,
  WALLET_ICONS,
  getChainName,
  formatChainDisplay,
};

// Export wallet handlers
export { default as EvmHandler } from './core/wallets/evm_handler.js';
export { default as SolanaHandler } from './core/wallets/solana_handler.js';
export { default as TronHandler } from './core/wallets/tron_handler.js';

// Export controller for Stimulus usage
export { default as WalletController } from './controllers/wallet_controller.js';

// Main initialization function for the wallet connector
export function initializeWalletConnector(mipdStore) {
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
