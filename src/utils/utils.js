import { render, html } from 'uhtml';
import { getChainName } from './chain_utils.js';

// LocalStorage
const STORAGE_KEY = 'wallet_connection';

export const saveWalletState = (walletType, address, chainId = null, rdns = null) => {
  const state = {
    walletType,
    address,
    chainId: chainId ? chainId.toString() : null,
    rdns,
    timestamp: Date.now()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const loadWalletState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const state = JSON.parse(saved);
    const WEEK = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - state.timestamp > WEEK) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return state;
  } catch (error) {
    console.error('Error loading wallet state:', error);
    return null;
  }
};

export const clearWalletState = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// UI Helpers
export const formatAddress = (address) => {
  if (!address) return '0x...0000'; // Return a placeholder when address is null/undefined
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const updateButtonState = (controller, isConnected, isLoading = false) => {
  // Find the connect wallet button relative to the controller's element
  const btn = controller.element.querySelector('[data-action*="wallet#openModal"]');
  if (btn) {
    if (isLoading) {
      btn.disabled = true;
      btn.textContent = 'Connecting...';
    } else if (isConnected) {
      btn.disabled = false;
      btn.textContent = 'Connected';
    } else {
      btn.disabled = false;
      btn.textContent = 'Connect Wallet';
    }
  }
};

// Wallet info template
function walletInfoTemplate(name, address, chainId, walletType) {
  const chainName = chainId ? getChainName(chainId, walletType) : 'Unknown';
  return html`
    <div class="wallet-connector-info">
      <div class="wallet-details">
        <div><strong>Wallet:</strong> <span class="wallet-connector-name">${name}</span></div>
        <div><strong>Address:</strong> <span class="wallet-connector-address">${formatAddress(address)}</span></div>
        <div><strong>Chain:</strong> <span class="wallet-connector-chain">${chainName}</span></div>
      </div>
      <button
        class="disconnect-button"
        data-action="click->wallet#disconnectWallet">
        Disconnect
      </button>
    </div>
  `;
}

export const updateWalletInfo = (controller, mipdStore, name, address, rdns = null, chainId = null, walletType = 'evm') => {
  const connectButton = controller.element.querySelector('[data-action*="wallet#openModal"]');
  const container = connectButton ? connectButton.parentNode : controller.element;

  // Find or create container for wallet info
  let walletInfoContainer = container.querySelector('.wallet-info-container');
  if (!walletInfoContainer) {
    walletInfoContainer = document.createElement('div');
    walletInfoContainer.className = 'wallet-info-container';

    if (connectButton) {
      connectButton.parentNode.insertBefore(walletInfoContainer, connectButton.nextSibling);
    } else {
      container.appendChild(walletInfoContainer);
    }
  }

  // Render wallet info using uhtml
  render(walletInfoContainer, walletInfoTemplate(name, address, chainId, walletType));

  updateButtonState(controller, true);
};

export const resetWalletUI = (controller) => {
  // Remove wallet info container
  const walletInfoContainer = controller.element.querySelector('.wallet-info-container');
  if (walletInfoContainer) {
    walletInfoContainer.remove();
  }
  updateButtonState(controller, false);
  clearWalletState();
};
