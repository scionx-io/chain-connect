import { ethers } from 'ethers';
import { TronLinkAdapter } from '@tronweb3/tronwallet-adapters';

// State
const state = {
  currentChain: null,
  currentAddress: null,
  currentChainId: null,
  tronAdapter: null,
  listeners: {
    accountsChanged: null,
    chainChanged: null,
    disconnect: null
  }
};

// DOM Elements
let elements;

// LocalStorage Helper Functions
const STORAGE_KEY = 'wallet_connection';

const saveWalletState = (walletType, address, chainId = null) => {
  const state = {
    walletType,
    address,
    chainId: chainId ? chainId.toString() : null,
    timestamp: Date.now()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const loadWalletState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const state = JSON.parse(saved);
    // Expire after 7 days
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

const clearWalletState = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// Helper Functions
const formatAddress = (address) =>
  `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

const updateButtonState = (isConnected, isLoading = false) => {
  const btn = elements.connectWalletBtn;
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

const updateWalletInfo = (name, address) => {
  elements.walletNameSpan.textContent = name;
  elements.walletAddressSpan.textContent = formatAddress(address);

  elements.walletInfo.classList.add('show');
  updateButtonState(true);
};

const resetWalletUI = () => {
  elements.walletInfo.classList.remove('show');
  updateButtonState(false);
  clearWalletState();
};

const cleanupListeners = () => {
  if (state.listeners.accountsChanged) {
    if (window.ethereum) window.ethereum.removeListener('accountsChanged', state.listeners.accountsChanged);
    if (window.solana) window.solana.off('accountChanged', state.listeners.accountsChanged);
    if (state.tronAdapter) state.tronAdapter.off('accountsChanged', state.listeners.accountsChanged);
  }
  if (state.listeners.chainChanged) {
    if (window.ethereum) window.ethereum.removeListener('chainChanged', state.listeners.chainChanged);
    if (window.solana) window.solana.off('clusterChanged', state.listeners.chainChanged);
    if (state.tronAdapter) state.tronAdapter.off('chainChanged', state.listeners.chainChanged);
  }
  if (state.listeners.disconnect && window.ethereum) {
    window.ethereum.removeListener('disconnect', state.listeners.disconnect);
  }

  // Disconnect TronLink adapter if connected
  if (state.tronAdapter && state.tronAdapter.connected) {
    state.tronAdapter.disconnect();
  }

  state.listeners = { accountsChanged: null, chainChanged: null, disconnect: null };
  state.tronAdapter = null;
};

// Reconnection Handlers
const reconnectHandlers = {
  async metamask() {
    if (!window.ethereum) return false;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      // Use eth_accounts instead of eth_requestAccounts (no popup)
      const accounts = await provider.send("eth_accounts", []);

      if (accounts.length === 0) return false;

      const address = accounts[0];
      const network = await provider.getNetwork();

      state.currentChain = 'ethereum';
      state.currentAddress = address;
      state.currentChainId = network.chainId;

      updateWalletInfo('MetaMask', address);
      saveWalletState('metamask', address, network.chainId);

      // Set up event listeners
      state.listeners.accountsChanged = async (accounts) => {
        if (accounts.length === 0) {
          resetWalletUI();
        } else if (accounts[0] !== state.currentAddress) {
          state.currentAddress = accounts[0];
          elements.walletAddressSpan.textContent = formatAddress(state.currentAddress);
          saveWalletState('metamask', state.currentAddress, state.currentChainId);
        }
      };

      state.listeners.chainChanged = async (chainId) => {
        state.currentChainId = BigInt(chainId);
        saveWalletState('metamask', state.currentAddress, state.currentChainId);
      };

      state.listeners.disconnect = () => resetWalletUI();

      window.ethereum.on('accountsChanged', state.listeners.accountsChanged);
      window.ethereum.on('chainChanged', state.listeners.chainChanged);
      window.ethereum.on('disconnect', state.listeners.disconnect);

      return true;
    } catch (error) {
      console.error('MetaMask reconnection failed:', error);
      return false;
    }
  },

  async phantom() {
    if (!window.solana?.isPhantom) return false;

    try {
      // Connect with onlyIfTrusted to avoid popup
      const resp = await window.solana.connect({ onlyIfTrusted: true });
      const address = resp.publicKey.toString();

      state.currentChain = 'solana';
      state.currentAddress = address;

      updateWalletInfo('Phantom', address);
      saveWalletState('phantom', address);

      // Set up event listeners
      state.listeners.accountsChanged = (newPublicKey) => {
        if (newPublicKey) {
          state.currentAddress = newPublicKey.toString();
          elements.walletAddressSpan.textContent = formatAddress(state.currentAddress);
          saveWalletState('phantom', state.currentAddress);
        } else {
          resetWalletUI();
        }
      };

      state.listeners.chainChanged = (cluster) => {
        console.log('Solana cluster changed:', cluster);
      };

      window.solana.on('accountChanged', state.listeners.accountsChanged);
      window.solana.on('clusterChanged', state.listeners.chainChanged);

      return true;
    } catch (error) {
      // onlyIfTrusted throws if not previously authorized
      console.error('Phantom reconnection failed:', error);
      return false;
    }
  },

  async tronlink() {
    try {
      const adapter = new TronLinkAdapter();
      state.tronAdapter = adapter;

      // Check if already connected without triggering popup
      if (!window.tronWeb?.ready) return false;

      await adapter.connect();

      if (!adapter.address) return false;

      const address = adapter.address;

      state.currentChain = 'tron';
      state.currentAddress = address;
      state.currentChainId = adapter.network;

      updateWalletInfo('TronLink', address);
      saveWalletState('tronlink', address, adapter.network);

      // Set up event listeners
      state.listeners.accountsChanged = () => {
        if (adapter.address) {
          state.currentAddress = adapter.address;
          elements.walletAddressSpan.textContent = formatAddress(adapter.address);
          saveWalletState('tronlink', adapter.address, state.currentChainId);
        } else {
          resetWalletUI();
        }
      };

      state.listeners.chainChanged = () => {
        state.currentChainId = adapter.network;
        saveWalletState('tronlink', state.currentAddress, state.currentChainId);
      };

      adapter.on('accountsChanged', state.listeners.accountsChanged);
      adapter.on('chainChanged', state.listeners.chainChanged);
      adapter.on('disconnect', () => resetWalletUI());

      return true;
    } catch (error) {
      console.error('TronLink reconnection failed:', error);
      return false;
    }
  }
};

// Wallet Handlers
const walletHandlers = {
  async metamask() {
    if (!window.ethereum) throw new Error('MetaMask not available');

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const address = accounts[0];
    const network = await provider.getNetwork();

    state.currentChain = 'ethereum';
    state.currentAddress = address;
    state.currentChainId = network.chainId;

    updateWalletInfo('MetaMask', address);
    saveWalletState('metamask', address, network.chainId);

    // Event listeners
    state.listeners.accountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        resetWalletUI();
      } else if (accounts[0] !== state.currentAddress) {
        state.currentAddress = accounts[0];
        elements.walletAddressSpan.textContent = formatAddress(state.currentAddress);
        saveWalletState('metamask', state.currentAddress, state.currentChainId);
      }
    };

    state.listeners.chainChanged = async (chainId) => {
      state.currentChainId = BigInt(chainId);
      saveWalletState('metamask', state.currentAddress, state.currentChainId);
    };

    state.listeners.disconnect = () => resetWalletUI();

    window.ethereum.on('accountsChanged', state.listeners.accountsChanged);
    window.ethereum.on('chainChanged', state.listeners.chainChanged);
    window.ethereum.on('disconnect', state.listeners.disconnect);
  },

  async phantom() {
    if (!window.solana?.isPhantom) throw new Error('Phantom not available');

    const resp = await window.solana.connect();
    const address = resp.publicKey.toString();

    state.currentChain = 'solana';
    state.currentAddress = address;

    updateWalletInfo('Phantom', address);
    saveWalletState('phantom', address);

    // Event listeners
    state.listeners.accountsChanged = (newPublicKey) => {
      if (newPublicKey) {
        state.currentAddress = newPublicKey.toString();
        elements.walletAddressSpan.textContent = formatAddress(state.currentAddress);
        saveWalletState('phantom', state.currentAddress);
      } else {
        resetWalletUI();
      }
    };

    state.listeners.chainChanged = (cluster) => {
      console.log('Solana cluster changed:', cluster);
    };

    window.solana.on('accountChanged', state.listeners.accountsChanged);
    window.solana.on('clusterChanged', state.listeners.chainChanged);
  },

  async tronlink() {
    const adapter = new TronLinkAdapter();
    state.tronAdapter = adapter;

    // Connect to TronLink (triggers wallet popup)
    await adapter.connect();

    if (!adapter.address) throw new Error('TronLink connection failed');

    const address = adapter.address;

    state.currentChain = 'tron';
    state.currentAddress = address;
    state.currentChainId = adapter.network;

    updateWalletInfo('TronLink', address);
    saveWalletState('tronlink', address, adapter.network);

    // Event listeners
    state.listeners.accountsChanged = () => {
      if (adapter.address) {
        state.currentAddress = adapter.address;
        elements.walletAddressSpan.textContent = formatAddress(adapter.address);
        saveWalletState('tronlink', adapter.address, state.currentChainId);
      } else {
        resetWalletUI();
      }
    };

    state.listeners.chainChanged = () => {
      state.currentChainId = adapter.network;
      saveWalletState('tronlink', state.currentAddress, state.currentChainId);
    };

    adapter.on('accountsChanged', state.listeners.accountsChanged);
    adapter.on('chainChanged', state.listeners.chainChanged);
    adapter.on('disconnect', () => resetWalletUI());
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  elements = {
    connectWalletBtn: document.getElementById('connectWalletBtn'),
    walletModal: document.getElementById('walletModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    walletButtons: document.querySelectorAll('.wallet-button'),
    walletInfo: document.getElementById('walletInfo'),
    walletAddressSpan: document.getElementById('walletAddress'),
    walletNameSpan: document.getElementById('walletName'),
    disconnectBtn: document.getElementById('disconnectBtn')
  };

  // Modal controls
  elements.connectWalletBtn?.addEventListener('click', () => {
    elements.walletModal.showModal();
  });

  elements.closeModalBtn?.addEventListener('click', () => {
    elements.walletModal.close();
  });

  elements.walletModal.addEventListener('click', (e) => {
    if (e.target === elements.walletModal) {
      elements.walletModal.close();
    }
  });

  // Wallet selection
  elements.walletButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const walletType = button.getAttribute('data-wallet');
      elements.walletModal.close();
      updateButtonState(false, true);

      try {
        cleanupListeners();
        await walletHandlers[walletType]();
      } catch (error) {
        console.error('Wallet connection error:', error);
        const errorMessage = error.code === 4001
          ? 'User rejected the connection request.'
          : 'Failed to connect wallet.';
        alert(errorMessage);
        updateButtonState(false);
      }
    });
  });

  // Disconnect
  elements.disconnectBtn?.addEventListener('click', () => {
    cleanupListeners();
    resetWalletUI();
  });

  // Initialize button with icon
  updateButtonState(false);

  // Attempt auto-reconnect
  (async () => {
    const savedState = loadWalletState();
    if (savedState && reconnectHandlers[savedState.walletType]) {
      try {
        updateButtonState(false, true);
        const success = await reconnectHandlers[savedState.walletType]();
        if (!success) {
          clearWalletState();
          updateButtonState(false);
        }
      } catch (error) {
        console.error('Auto-reconnect failed:', error);
        clearWalletState();
        updateButtonState(false);
      }
    }
  })();
});
