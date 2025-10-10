import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWallets } from '../wallets.js';

// Mock the dependencies
vi.mock('../config.js', () => ({
  WALLET_ICONS: {
    metamask: 'metamask-icon',
    phantom: 'phantom-icon',
    tronlink: 'tronlink-icon'
  }
}));

describe('wallets.js', () => {
  let mockMipdStore;
  let mockController;
  let mockWalletButtonsContainer;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock MIPD store
    mockMipdStore = {
      getProviders: vi.fn().mockReturnValue([])
    };

    // Create mock wallet buttons container element
    mockWalletButtonsContainer = document.createElement('div');
    
    // Create mock controller that mimics the WalletController structure
    mockController = {
      walletButtonsTarget: mockWalletButtonsContainer
    };

    // Mock window properties for wallet detection
    delete global.window;
    global.window = {
      solana: null,
      tronWeb: null,
      tronLink: null,
      ethereum: null
    };
  });

  describe('renderWallets', () => {
    it('should render MIPD wallets', () => {
      const mockProviders = [
        {
          info: {
            name: 'MetaMask',
            icon: 'metamask-icon',
            rdns: 'io.metamask',
            chains: ['eip155:1']
          }
        }
      ];
      
      mockMipdStore.getProviders.mockReturnValue(mockProviders);
      
      renderWallets(mockMipdStore, mockController);
      
      expect(mockMipdStore.getProviders).toHaveBeenCalled();
      // Now first child should be the top-wallets-grid container
      expect(mockWalletButtonsContainer.firstElementChild.className).toBe('top-wallets-grid');
      // Inside the grid, there should be wallet buttons
      expect(mockWalletButtonsContainer.querySelector('.top-wallets-grid').children.length).toBe(1);
      expect(mockWalletButtonsContainer.querySelector('.wallet-button')).toBeTruthy();
    });

    it('should render Phantom wallet when solana is available', () => {
      global.window.solana = { isPhantom: true };

      renderWallets(mockMipdStore, mockController);
      
      // Should create the top-wallets-grid container with Phantom button
      expect(mockWalletButtonsContainer.firstElementChild.className).toBe('top-wallets-grid');
      // Check that Phantom is in the wallet buttons
      expect(mockWalletButtonsContainer.innerHTML).toContain('Phantom');
    });

    it('should render TronLink wallet when tronWeb or tronLink is available', () => {
      global.window.tronWeb = { ready: true };

      renderWallets(mockMipdStore, mockController);
      
      // Should create the top-wallets-grid container with TronLink button
      expect(mockWalletButtonsContainer.firstElementChild.className).toBe('top-wallets-grid');
      // Check that TronLink is in the wallet buttons
      expect(mockWalletButtonsContainer.innerHTML).toContain('TronLink');
    });

    it('should show "No wallets detected" message when no wallets are available', () => {
      mockMipdStore.getProviders.mockReturnValue([]);
      global.window.solana = null;
      global.window.tronWeb = null;
      global.window.tronLink = null;
      
      renderWallets(mockMipdStore, mockController);
      
      expect(mockWalletButtonsContainer.innerHTML).toContain('No wallets detected');
    });

    it('should render wallet buttons with correct attributes', () => {
      const mockProviders = [
        {
          info: {
            name: 'MetaMask',
            icon: 'metamask-icon',
            rdns: 'io.metamask',
            chains: ['eip155:1']
          }
        }
      ];
      
      mockMipdStore.getProviders.mockReturnValue(mockProviders);
      
      renderWallets(mockMipdStore, mockController);
      
      // Find the wallet button inside the top wallets grid
      const walletButton = mockWalletButtonsContainer.querySelector('.wallet-button');
      expect(walletButton.getAttribute('data-wallet-rdns')).toBe('io.metamask');
      expect(walletButton.getAttribute('data-action')).toContain('wallet#selectWallet');
      expect(walletButton.querySelector('img')).toBeTruthy();
      expect(walletButton.querySelector('span').textContent).toBe('MetaMask');
    });
    
    it('should render "View all wallets" button when more than 4 wallets are available', () => {
      const mockProviders = [
        {
          info: {
            name: 'MetaMask',
            icon: 'metamask-icon',
            rdns: 'io.metamask',
            chains: ['eip155:1']
          }
        },
        {
          info: {
            name: 'Phantom',
            icon: 'phantom-icon',
            rdns: 'phantom.phantom',
            chains: ['solana:1']
          }
        },
        {
          info: {
            name: 'Coinbase',
            icon: 'coinbase-icon',
            rdns: 'coinbase',
            chains: ['eip155:1']
          }
        },
        {
          info: {
            name: 'Trust',
            icon: 'trust-icon',
            rdns: 'trust',
            chains: ['eip155:1']
          }
        },
        {
          info: {
            name: 'Rainbow',
            icon: 'rainbow-icon',
            rdns: 'rainbow',
            chains: ['eip155:1']
          }
        }
      ];
      
      mockMipdStore.getProviders.mockReturnValue(mockProviders);
      
      renderWallets(mockMipdStore, mockController);
      
      // Should have top wallets grid
      expect(mockWalletButtonsContainer.querySelector('.top-wallets-grid')).toBeTruthy();
      // Should have view all wallets button (since there are more than 4)
      expect(mockWalletButtonsContainer.querySelector('.view-all-wallets-btn')).toBeTruthy();
      // Should have hidden container for all wallets
      expect(mockWalletButtonsContainer.querySelector('.all-wallets-container')).toBeTruthy();
    });
    
    it('should render top 4 wallets prioritizing Phantom, MetaMask, and Coinbase Wallet', () => {
      const mockProviders = [
        {
          info: {
            name: 'Trust Wallet',
            icon: 'trust-icon',
            rdns: 'trust',
            chains: ['eip155:1']
          }
        },
        {
          info: {
            name: 'MetaMask',
            icon: 'metamask-icon',
            rdns: 'io.metamask',
            chains: ['eip155:1']
          }
        },
        {
          info: {
            name: 'Rainbow',
            icon: 'rainbow-icon',
            rdns: 'rainbow',
            chains: ['eip155:1']
          }
        },
        {
          info: {
            name: 'Phantom',
            icon: 'phantom-icon',
            rdns: 'phantom',
            chains: ['solana:1']
          }
        }
      ];
      
      mockMipdStore.getProviders.mockReturnValue(mockProviders);
      
      renderWallets(mockMipdStore, mockController);
      
      const grid = mockWalletButtonsContainer.querySelector('.top-wallets-grid');
      // First four buttons should be Phantom, MetaMask, and then the others in order
      expect(grid.children.length).toBe(4); // Should have 4 buttons in the grid
      expect(grid.children[0].querySelector('span').textContent).toBe('Phantom');
      expect(grid.children[1].querySelector('span').textContent).toBe('MetaMask');
      // The others would be in positions 2 and 3 depending on the sorting
    });
  });
});