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

const createWalletInfoElement = (name, address, chainId, walletType, controller) => {
  const walletInfoElement = document.createElement('div');
  walletInfoElement.className = 'wallet-connector-info';

  const walletDetails = document.createElement('div');
  walletDetails.className = 'wallet-details';

  const chainName = chainId ? getChainName(chainId, walletType) : 'Unknown';
  walletDetails.innerHTML = `
    <div><strong>Wallet:</strong> <span class="wallet-connector-name">${name}</span></div>
    <div><strong>Address:</strong> <span class="wallet-connector-address">${formatAddress(address)}</span></div>
    <div><strong>Chain:</strong> <span class="wallet-connector-chain">${chainName}</span></div>
  `;

  const disconnectBtn = document.createElement('button');
  disconnectBtn.className = 'disconnect-button';
  disconnectBtn.textContent = 'Disconnect';
  disconnectBtn.setAttribute('data-action', 'click->wallet#disconnectWallet');

  walletInfoElement.appendChild(walletDetails);
  walletInfoElement.appendChild(disconnectBtn);

  return walletInfoElement;
};

const updateExistingWalletInfo = (walletInfoElement, name, address, chainId, walletType) => {
  const nameElement = walletInfoElement.querySelector('.wallet-connector-name');
  const addressElement = walletInfoElement.querySelector('.wallet-connector-address');
  const chainElement = walletInfoElement.querySelector('.wallet-connector-chain');

  if (nameElement) nameElement.textContent = name;
  if (addressElement) addressElement.textContent = formatAddress(address);
  if (chainElement) {
    const chainName = chainId ? getChainName(chainId, walletType) : 'Unknown';
    chainElement.textContent = chainName;
  }
};

export const updateWalletInfo = (controller, mipdStore, name, address, rdns = null, chainId = null, walletType = 'evm') => {
  let walletInfoElement = controller.element.querySelector('.wallet-connector-info');

  if (!walletInfoElement) {
    walletInfoElement = createWalletInfoElement(name, address, chainId, walletType, controller);

    const connectButton = controller.element.querySelector('[data-action*="wallet#openModal"]');
    if (connectButton) {
      connectButton.parentNode.insertBefore(walletInfoElement, connectButton.nextSibling);
    } else {
      controller.element.appendChild(walletInfoElement);
    }
  } else {
    updateExistingWalletInfo(walletInfoElement, name, address, chainId, walletType);
  }

  updateButtonState(controller, true);
};

export const resetWalletUI = (controller) => {
  // Remove or hide wallet info display
  const walletInfoElement = controller.element.querySelector('.wallet-connector-info');
  if (walletInfoElement) {
    walletInfoElement.style.display = 'none';
  }
  updateButtonState(controller, false);
  clearWalletState();
};
