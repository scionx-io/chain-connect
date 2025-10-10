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
export const formatAddress = (address) =>
  `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

export const updateButtonState = (controller, isConnected, isLoading = false) => {
  const btn = controller.connectWalletBtnTarget;
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
};

export const updateWalletInfo = (controller, mipdStore, name, address, rdns = null, chainId = null, walletType = 'evm') => {
  let walletName = name;
  if (rdns) {
    const wallet = mipdStore.get().find(w => w.info.rdns === rdns);
    if (wallet) walletName = wallet.info.name;
  }
  controller.walletNameSpanTarget.textContent = walletName;
  controller.walletAddressSpanTarget.textContent = formatAddress(address);
  
  // Update chain information if available
  if (chainId) {
    const chainName = getChainName(chainId, walletType);
    controller.walletChainSpanTarget.textContent = chainName;
  } else {
    controller.walletChainSpanTarget.textContent = 'Unknown';
  }
  
  controller.walletInfoTarget.classList.add('show');
  updateButtonState(controller, true);
};

export const resetWalletUI = (controller) => {
  controller.walletInfoTarget.classList.remove('show');
  updateButtonState(controller, false);
  clearWalletState();
};
