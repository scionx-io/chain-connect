import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletManager } from '../wallet_manager.js';
import { createMockEvmProvider, createMockSolanaProvider, createMockTronProvider } from './mock_wallets.js';

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
}));

describe('WalletManager', () => {
  let walletManager;
  let mockMipdStore;
  let mockEvmHandler;
  let mockSolanaHandler;
  let mockTronHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Create mock MIPD store
    mockMipdStore = {
      getProviders: vi.fn().mockReturnValue([])
    };

    // Create mock handlers
    mockEvmHandler = {
      connect: vi.fn(),
      disconnect: vi.fn()
    };
    
    mockSolanaHandler = {
      connect: vi.fn(),
      disconnect: vi.fn()
    };
    
    mockTronHandler = {
      connect: vi.fn(),
      disconnect: vi.fn()
    };

    // Mock wallet registry to return the handlers
    const walletRegistryModule = await import('../wallet_registry.js');
    vi.mocked(walletRegistryModule.default.get).mockImplementation((family) => {
      if (family === 'evm') return mockEvmHandler.constructor;
      if (family === 'solana') return mockSolanaHandler.constructor;
      if (family === 'tron') return mockTronHandler.constructor;
      return null;
    });

    // Create instances of handlers
    mockEvmHandler.constructor = vi.fn().mockImplementation(() => mockEvmHandler);
    mockSolanaHandler.constructor = vi.fn().mockImplementation(() => mockSolanaHandler);
    mockTronHandler.constructor = vi.fn().mockImplementation(() => mockTronHandler);

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
    it('should initialize with required properties', () => {
      expect(walletManager.mipdStore).toBeDefined();
      expect(walletManager.connections).toBeInstanceOf(Map);
      expect(walletManager.activeConnection).toBeNull();
      expect(walletManager.handlers).toBeInstanceOf(Map);
      expect(walletManager.isConnecting).toBe(false);
    });
  });

  describe('getWalletFamily', () => {
    it('should return "evm" for EVM chains', () => {
      expect(walletManager.getWalletFamily(['eip155:1'])).toBe('evm');
      expect(walletManager.getWalletFamily(['eip155:1', 'eip155:137'])).toBe('evm');
    });

    it('should return "solana" for Solana chains', () => {
      expect(walletManager.getWalletFamily(['solana:101'])).toBe('solana');
    });

    it('should return "tron" for Tron chains', () => {
      expect(walletManager.getWalletFamily(['tron:0x2b6653dc'])).toBe('tron');
    });

    it('should return null for unknown chains', () => {
      expect(walletManager.getWalletFamily(['unknown:1'])).toBeNull();
      expect(walletManager.getWalletFamily(null)).toBeNull();
      expect(walletManager.getWalletFamily([])).toBeNull();
    });
  });

  describe('connect', () => {
    it('should connect to a wallet successfully', async () => {
      const mockProvider = createMockEvmProvider();
      mockMipdStore.getProviders.mockReturnValue([{
        info: {
          name: 'MetaMask',
          rdns: 'io.metamask',
          chains: ['eip155:1'],
          icon: 'icon'
        },
        provider: mockProvider
      }]);

      mockEvmHandler.connect.mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: '1',
        name: 'MetaMask',
        rdns: 'io.metamask',
        family: 'evm',
        chains: ['eip155:1']
      });

      const result = await walletManager.connect('io.metamask');
      
      expect(result).toBeDefined();
      expect(walletManager.connections.has('io.metamask')).toBe(true);
      expect(walletManager.activeConnection).toBeDefined();
    });

    it('should throw error if wallet provider is not found', async () => {
      mockMipdStore.getProviders.mockReturnValue([]);

      await expect(walletManager.connect('nonexistent.wallet'))
        .rejects
        .toThrow('Wallet with RDNS "nonexistent.wallet" not found or not available.');
    });

    it('should throw error if no handler for wallet family', async () => {
      const mockProvider = createMockEvmProvider();
      mockMipdStore.getProviders.mockReturnValue([{
        info: {
          name: 'UnknownWallet',
          rdns: 'unknown.wallet',
          chains: ['unknown:1'],
          icon: 'icon'
        },
        provider: mockProvider
      }]);

      // Temporarily make registry return null for unknown family
      const walletRegistry = await import('../wallet_registry.js');
      vi.mocked(walletRegistry.default.get).mockReturnValue(null);

      await expect(walletManager.connect('unknown.wallet'))
        .rejects
        .toThrow('No handler for wallet family "null"');
    });

    it('should handle connection errors gracefully', async () => {
      const mockProvider = createMockEvmProvider({ shouldError: true });
      mockMipdStore.getProviders.mockReturnValue([{
        info: {
          name: 'MetaMask',
          rdns: 'io.metamask',
          chains: ['eip155:1'],
          icon: 'icon'
        },
        provider: mockProvider
      }]);

      mockEvmHandler.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(walletManager.connect('io.metamask'))
        .rejects
        .toThrow('Connection failed');
    });

    it('should prevent concurrent connections to the same wallet', async () => {
      const mockProvider = createMockEvmProvider();
      mockMipdStore.getProviders.mockReturnValue([{
        info: {
          name: 'MetaMask',
          rdns: 'io.metamask',
          chains: ['eip155:1'],
          icon: 'icon'
        },
        provider: mockProvider
      }]);

      mockEvmHandler.connect.mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: '1',
        name: 'MetaMask',
        rdns: 'io.metamask',
        family: 'evm',
        chains: ['eip155:1']
      });

      // Try to connect twice simultaneously
      const firstConnect = walletManager.connect('io.metamask');
      const secondConnect = walletManager.connect('io.metamask');
      
      const [firstResult, secondResult] = await Promise.allSettled([firstConnect, secondConnect]);
      
      // The second connection should fail due to mutex
      expect(secondResult.status).toBe('rejected');
    });
  });

  describe('disconnect', () => {
    it('should disconnect from a wallet successfully', async () => {
      // Setup: connect first
      const mockProvider = createMockEvmProvider();
      mockMipdStore.getProviders.mockReturnValue([{
        info: {
          name: 'MetaMask',
          rdns: 'io.metamask',
          chains: ['eip155:1'],
          icon: 'icon'
        },
        provider: mockProvider
      }]);

      mockEvmHandler.connect.mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: '1',
        name: 'MetaMask',
        rdns: 'io.metamask',
        family: 'evm',
        chains: ['eip155:1']
      });

      await walletManager.connect('io.metamask');
      
      // Now disconnect
      await walletManager.disconnect('io.metamask');
      
      expect(walletManager.connections.has('io.metamask')).toBe(false);
      expect(walletManager.activeConnection).toBeNull();
      expect(mockEvmHandler.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect when no connection exists', async () => {
      // Should not throw an error when disconnecting from non-existent connection
      await expect(walletManager.disconnect('nonexistent.wallet')).resolves.not.toThrow();
    });
  });

  describe('findProvider', () => {
    it('should find provider from MIPD store', () => {
      const mockProvider = createMockEvmProvider();
      mockMipdStore.getProviders.mockReturnValue([{
        info: {
          name: 'MetaMask',
          rdns: 'io.metamask',
          chains: ['eip155:1'],
          icon: 'icon'
        },
        provider: mockProvider
      }]);

      const result = walletManager.findProvider('io.metamask');
      
      expect(result).toBeDefined();
      expect(result.info.rdns).toBe('io.metamask');
    });

    it('should find MetaMask provider from window.ethereum', () => {
      global.window.ethereum = createMockEvmProvider();
      
      const result = walletManager.findProvider('io.metamask');
      
      expect(result).toBeDefined();
      expect(result.info.rdns).toBe('io.metamask');
      expect(result.provider).toBe(global.window.ethereum);
    });

    it('should find Phantom provider from window.solana', () => {
      global.window.solana = createMockSolanaProvider();
      
      const result = walletManager.findProvider('phantom');
      
      expect(result).toBeDefined();
      expect(result.info.rdns).toBe('phantom');
    });

    it('should find TronLink provider from window.tronWeb', () => {
      global.window.tronWeb = createMockTronProvider();
      
      const result = walletManager.findProvider('tronlink');
      
      expect(result).toBeDefined();
      expect(result.info.rdns).toBe('tronlink');
    });

    it('should return null if no provider is found', () => {
      const result = walletManager.findProvider('nonexistent.wallet');
      
      expect(result).toBeNull();
    });
  });

  describe('init', () => {
    it('should attempt to reconnect if saved state exists', async () => {
      const mockLoadWalletState = await import('../utils.js');
      vi.mocked(mockLoadWalletState.loadWalletState).mockReturnValue({ rdns: 'io.metamask' });
      
      // Setup connection to succeed
      const mockProvider = createMockEvmProvider();
      mockMipdStore.getProviders.mockReturnValue([{
        info: {
          name: 'MetaMask',
          rdns: 'io.metamask',
          chains: ['eip155:1'],
          icon: 'icon'
        },
        provider: mockProvider
      }]);
      
      mockEvmHandler.connect.mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: '1',
        name: 'MetaMask',
        rdns: 'io.metamask',
        family: 'evm',
        chains: ['eip155:1']
      });

      await walletManager.init();
      
      // Connection should have been attempted
      expect(mockEvmHandler.connect).toHaveBeenCalledWith(expect.any(Object), true);
    });

    it('should handle reconnection failure gracefully', async () => {
      const mockLoadWalletState = await import('../utils.js');
      const mockClearWalletState = await import('../utils.js');
      vi.mocked(mockLoadWalletState.loadWalletState).mockReturnValue({ rdns: 'io.metamask' });
      
      // Setup connection to fail
      mockMipdStore.getProviders.mockReturnValue([]);
      
      await walletManager.init();
      
      // Clear state should have been called due to failure
      expect(mockClearWalletState.clearWalletState).toHaveBeenCalled();
    });
  });
});