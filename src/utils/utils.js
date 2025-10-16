import { render, html } from 'uhtml';
import { getChainName } from './chain_utils.js';

// LocalStorage
const STORAGE_KEY = 'wallet_connection';

export const saveWalletState = (
  walletType,
  address,
  chainId = null,
  rdns = null
) => {
  const state = {
    walletType,
    address,
    chainId: chainId ? chainId.toString() : null,
    rdns,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { success: true };
  } catch (error) {
    console.error('Failed to save wallet state to localStorage:', error);

    // Determine the error type
    let errorType = 'unknown';
    let errorMessage = 'Failed to save connection state';

    if (error.name === 'QuotaExceededError') {
      errorType = 'quota_exceeded';
      errorMessage = 'Storage quota exceeded. Auto-reconnect disabled.';
    } else if (error.name === 'SecurityError') {
      errorType = 'security_error';
      errorMessage = 'Storage access blocked. Auto-reconnect disabled.';
    }

    return {
      success: false,
      error: errorType,
      message: errorMessage,
    };
  }
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

export const updateButtonState = (
  controller,
  isConnected,
  isLoading = false
) => {
  // Find the connect wallet button relative to the controller's element
  const btn = controller.element.querySelector(
    '[data-action*="wallet#openModal"]'
  );
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
function walletInfoTemplate(name, address, chainId, walletType, rdns = null) {
  const chainName = chainId ? getChainName(chainId, walletType) : 'Unknown';
  const walletProvider = rdns ? rdns.split('.')[1] : name; // Extract provider name from RDNS (e.g., metamask from io.metamask)
  return html`
    <div class="wallet-connector-info">
      <div class="wallet-details">
        <div>
          <strong>Wallet:</strong>
          <span class="wallet-connector-name">${name}</span>
        </div>
        <div>
          <strong>Provider:</strong>
          <span class="wallet-connector-provider">${walletProvider}</span>
        </div>
        <div>
          <strong>Address:</strong>
          <span class="wallet-connector-address"
            >${formatAddress(address)}</span
          >
        </div>
        <div>
          <strong>Chain:</strong>
          <span class="wallet-connector-chain">${chainName}</span>
        </div>
      </div>
      <button
        class="disconnect-button"
        data-action="click->wallet#disconnectWallet"
      >
        Disconnect
      </button>
    </div>
  `;
}

export const updateWalletInfo = (
  controller,
  mipdStore,
  name,
  address,
  rdns = null,
  chainId = null,
  walletType = 'evm'
) => {
  const connectButton = controller.element.querySelector(
    '[data-action*="wallet#openModal"]'
  );
  const container = connectButton
    ? connectButton.parentNode
    : controller.element;

  // Find or create container for wallet info
  let walletInfoContainer = container.querySelector('.wallet-info-container');
  if (!walletInfoContainer) {
    walletInfoContainer = document.createElement('div');
    walletInfoContainer.className = 'wallet-info-container';

    if (connectButton) {
      connectButton.parentNode.insertBefore(
        walletInfoContainer,
        connectButton.nextSibling
      );
    } else {
      container.appendChild(walletInfoContainer);
    }
  }

  // Render wallet info using uhtml
  render(
    walletInfoContainer,
    walletInfoTemplate(name, address, chainId, walletType, rdns)
  );

  updateButtonState(controller, true);
};

export const resetWalletUI = (controller) => {
  // Remove wallet info container
  const walletInfoContainer = controller.element.querySelector(
    '.wallet-info-container'
  );
  if (walletInfoContainer) {
    walletInfoContainer.remove();
  }
  updateButtonState(controller, false);
  clearWalletState();
};
