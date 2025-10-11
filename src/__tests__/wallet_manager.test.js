import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletManager } from '../core/wallet_manager.js';
import { loadWalletState, saveWalletState, clearWalletState } from '../utils.js';

// Mock the dependencies
vi.mock('../wallet_registry.js', () => ({
  default: {
    get: vi.fn(),
    register: vi.fn() // Add register method to prevent errors
  }
}));

vi.mock('../utils.js', () => ({
  loadWalletState: vi.fn(),
  saveWalletState: vi.fn(),
  clearWalletState: vi.fn(),
  // Keep the other utils functions as they are
  formatAddress: vi.fn(),
  updateButtonState: vi.fn(),
  updateWalletInfo: vi.fn(),
  resetWalletUI: vi.fn(),
}));

// Mock config.js to avoid SVG import issues
vi.mock('../config.js', () => ({
  WALLET_ICONS: {
    metamask: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjM0U3QkVFIi8+Cjwvc3ZnPgo=',
    phantom: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjNjM0NUQ2Ii8+Cjwvc3ZnPgo=',
    tronlink: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjRUQ0NjM2Ii8+Cjwvc3ZnPgo=',
  }
}));

// Mock the WalletDiscovery module to prevent it from importing config.js with SVG files
vi.mock('../core/wallet_discovery.js', async () => {
  const actual = await vi.importActual('../core/wallet_discovery.js');
  
  return {
    WalletDiscovery: vi.fn().mockImplementation(() => ({
      getDetectedWallets: vi.fn()
    }))
  };
});

vi.mock('../core/connection_manager.js', () => ({
  ConnectionManager: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    getActiveConnection: vi.fn(),
    getConnection: vi.fn(),
    hasConnection: vi.fn(),
    findProvider: vi.fn(),
    getWalletFamily: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    init: vi.fn()
  }))
}));



describe('WalletManager', () => {
  let walletManager;
  let mockMipdStore;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock MIPD store
    mockMipdStore = {
      getProviders: vi.fn().mockReturnValue([])
    };

    // Mock window properties
    delete global.window;
    global.window = {
      ethereum: null,
      solana: null,
      tronWeb: null,
      tronLink: null
    };

    walletManager = new WalletManager(mockMipdStore);
  });

  describe('constructor', () => {
    it('should initialize with required services', () => {
      expect(walletManager.mipdStore).toBeDefined();
      expect(walletManager.discovery).toBeDefined();
      expect(walletManager.connectionManager).toBeDefined();
    });
  });

  describe('getDetectedWallets', () => {
    it('should delegate to WalletDiscovery', () => {
      const mockWallets = { topWallets: [], groupedWallets: {} };
      walletManager.discovery.getDetectedWallets.mockReturnValue(mockWallets);

      const result = walletManager.getDetectedWallets();

      expect(result).toBe(mockWallets);
      expect(walletManager.discovery.getDetectedWallets).toHaveBeenCalled();
    });
  });

  describe('connect', () => {
    it('should connect to a wallet successfully', async () => {
      const mockConnection = {
        address: '0x1234567890123456789012345678901234567890',
        chainId: '1',
        name: 'MetaMask',
        rdns: 'io.metamask',
        family: 'evm',
        chains: ['eip155:1']
      };

      walletManager.connectionManager.connect.mockResolvedValue(mockConnection);
      walletManager.connectionManager.findProvider.mockReturnValue({
        info: {
          chains: ['eip155:1']
        }
      });
      walletManager.connectionManager.getWalletFamily.mockReturnValue('evm');

      const result = await walletManager.connect('io.metamask');
      
      expect(result).toBe(mockConnection);
      expect(walletManager.connectionManager.connect).toHaveBeenCalledWith(
        'io.metamask', 
        false, 
        expect.any(Function)
      );
      expect(saveWalletState).toHaveBeenCalledWith(
        'evm',
        mockConnection.address,
        mockConnection.chainId,
        'io.metamask'
      );
    });

    it('should throw error if wallet provider is not found', async () => {
      walletManager.connectionManager.connect.mockRejectedValue(
        new Error('Wallet with RDNS "nonexistent.wallet" not found or not available.')
      );

      await expect(walletManager.connect('nonexistent.wallet'))
        .rejects
        .toThrow('Wallet with RDNS "nonexistent.wallet" not found or not available.');
    });

    it('should prevent concurrent connections to the same wallet', async () => {
      walletManager.connectionManager.hasConnection.mockReturnValue(true);

      await expect(walletManager.connect('io.metamask', false))
        .rejects
        .toThrow('Wallet with RDNS "io.metamask" is already connected.');
    });
  });

  describe('disconnect', () => {
    it('should disconnect from a wallet successfully', async () => {
      const mockConnection = {
        address: '0x1234567890123456789012345678901234567890',
        chainId: '1',
        name: 'MetaMask',
        rdns: 'io.metamask',
        family: 'evm',
        chains: ['eip155:1']
      };

      walletManager.connectionManager.getConnection.mockReturnValue(mockConnection);
      
      await walletManager.disconnect('io.metamask');
      
      expect(walletManager.connectionManager.disconnect).toHaveBeenCalledWith('io.metamask');
      expect(clearWalletState).toHaveBeenCalled();
    });

    it('should handle disconnect when no connection exists', async () => {
      walletManager.connectionManager.getConnection.mockReturnValue(null);
      
      // Should not throw an error when disconnecting from non-existent connection
      await expect(walletManager.disconnect('nonexistent.wallet')).resolves.not.toThrow();
    });
  });

  describe('init', () => {
    it('should attempt to reconnect if saved state exists', async () => {
      loadWalletState.mockReturnValue({ rdns: 'io.metamask' });
      
      const mockConnection = {
        address: '0x1234567890123456789012345678901234567890',
        chainId: '1',
        name: 'MetaMask',
        rdns: 'io.metamask',
        family: 'evm',
        chains: ['eip155:1']
      };
      
      walletManager.connectionManager.connect.mockResolvedValue(mockConnection);
      walletManager.connectionManager.findProvider.mockReturnValue({
        info: {
          chains: ['eip155:1']
        }
      });
      walletManager.connectionManager.getWalletFamily.mockReturnValue('evm');

      await walletManager.init();
      
      // Connection should have been attempted with isReconnect = true
      expect(walletManager.connectionManager.connect).toHaveBeenCalledWith(
        'io.metamask',
        true,
        expect.any(Function)
      );
    });

    it('should handle reconnection failure gracefully', async () => {
      loadWalletState.mockReturnValue({ rdns: 'io.metamask' });
      walletManager.connectionManager.connect.mockRejectedValue(new Error('Connection failed'));
      
      await walletManager.init();
      
      // Clear state should have been called due to failure
      expect(clearWalletState).toHaveBeenCalled();
    });
  });

  describe('getActiveConnection', () => {
    it('should return active connection from connection manager', () => {
      const mockConnection = { address: '0x1234567890', chainId: '1' };
      walletManager.connectionManager.getActiveConnection.mockReturnValue(mockConnection);
      
      const result = walletManager.getActiveConnection();
      
      expect(result).toBe(mockConnection);
      expect(walletManager.connectionManager.getActiveConnection).toHaveBeenCalled();
    });
  });
});