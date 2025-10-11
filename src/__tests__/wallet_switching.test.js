import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WalletManager } from '../wallet_manager.js';
import { createStore } from 'mipd';

// Mock the wallet registry
vi.mock('../wallet_registry.js', () => {
  const mockHandler = {
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  return {
    default: {
      get: vi.fn(() => mockHandler.constructor),
      register: vi.fn(),
    }
  };
});

// Mock the provider resolver
vi.mock('../services/wallet_provider_resolver.js', async () => {
  const actual = await vi.importActual('../services/wallet_provider_resolver.js');
  return {
    ...actual,
    WalletProviderResolver: vi.fn().mockImplementation(() => {
      return {
        findProvider: vi.fn((rdns) => {
          if (rdns === 'io.metamask') {
            return {
              provider: { 
                request: vi.fn(),
                on: vi.fn(),
                removeListener: vi.fn(),
              },
              info: { 
                rdns: 'io.metamask',
                name: 'MetaMask',
                chains: ['eip155:1']
              }
            };
          } else if (rdns === 'io.rabby') {
            return {
              provider: { 
                request: vi.fn(),
                on: vi.fn(),
                removeListener: vi.fn(),
              },
              info: { 
                rdns: 'io.rabby',
                name: 'Rabby Wallet',
                chains: ['eip155:1']
              }
            };
          }
          return null;
        })
      };
    })
  };
});

// Mock utils
vi.mock('../utils.js', () => {
  return {
    loadWalletState: vi.fn(() => null),
    saveWalletState: vi.fn(),
    clearWalletState: vi.fn(),
  };
});

describe('Wallet Switching', () => {
  let walletManager;
  let mipdStore;

  beforeEach(() => {
    mipdStore = createStore();
    walletManager = new WalletManager(mipdStore);
    
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  it('should disconnect active wallet before connecting to a new one', async () => {
    // Mock the handlers for both wallets
    const mockMetamaskHandler = {
      connect: vi.fn().mockResolvedValue({
        name: 'MetaMask',
        address: '0x1234567890123456789012345678901234567890',
        chainId: '1',
        family: 'evm'
      }),
      disconnect: vi.fn().mockResolvedValue(undefined)
    };
    
    const mockRabbyHandler = {
      connect: vi.fn().mockResolvedValue({
        name: 'Rabby Wallet',
        address: '0x0987654321098765432109876543210987654321',
        chainId: '1',
        family: 'evm'
      }),
      disconnect: vi.fn().mockResolvedValue(undefined)
    };
    
    // Mock the wallet registry to return different handlers for different families
    const { default: walletRegistry } = await import('../wallet_registry.js');
    walletRegistry.get = vi.fn((family) => {
      if (family === 'evm') {
        // We need to return a constructor function that creates different instances
        // depending on which wallet is being connected
        return class {
          constructor(onStateChange) {
            // For simplicity, we'll make a basic mock that differentiates by context
            if (onStateChange.toString().includes('io.metamask')) {
              return mockMetamaskHandler;
            } else {
              return mockRabbyHandler;
            }
          }
        };
      }
    });
    
    // Connect to MetaMask first
    await walletManager.connect('io.metamask');
    
    // Verify MetaMask was connected
    expect(mockMetamaskHandler.connect).toHaveBeenCalledWith(
      expect.objectContaining({
        info: expect.objectContaining({
          rdns: 'io.metamask'
        })
      }),
      false
    );
    
    // Verify no disconnection happened yet
    expect(mockMetamaskHandler.disconnect).not.toHaveBeenCalled();
    
    // Now connect to Rabby - this should disconnect MetaMask first
    await walletManager.connect('io.rabby');
    
    // Verify MetaMask was disconnected before connecting to Rabby
    expect(mockMetamaskHandler.disconnect).toHaveBeenCalledTimes(1);
    
    // Verify Rabby was connected
    expect(mockRabbyHandler.connect).toHaveBeenCalledWith(
      expect.objectContaining({
        info: expect.objectContaining({
          rdns: 'io.rabby'
        })
      }),
      false
    );
    
    // Verify the active connection is now Rabby
    expect(walletManager.activeConnection.name).toBe('Rabby Wallet');
    expect(walletManager.activeConnection.address).toBe('0x0987654321098765432109876543210987654321');
  });

  it('should handle connecting to the same wallet twice', async () => {
    const mockHandler = {
      connect: vi.fn()
        .mockResolvedValueOnce({
          name: 'MetaMask',
          address: '0x1234567890123456789012345678901234567890',
          chainId: '1',
          family: 'evm'
        })
        .mockRejectedValue(new Error('Wallet with RDNS "io.metamask" is already connected.')),
      disconnect: vi.fn().mockResolvedValue(undefined)
    };
    
    // Mock the wallet registry
    const { default: walletRegistry } = await import('../wallet_registry.js');
    walletRegistry.get = vi.fn(() => {
      return class {
        constructor() {
          return mockHandler;
        }
      };
    });
    
    // Connect to MetaMask first
    await walletManager.connect('io.metamask');
    
    // Verify connection was successful
    expect(mockHandler.connect).toHaveBeenCalledTimes(1);
    
    // Try to connect to MetaMask again - this should fail with an error
    await expect(walletManager.connect('io.metamask')).rejects.toThrow('Wallet with RDNS "io.metamask" is already connected.');
    
    // Verify connect was called twice but disconnect was not called
    expect(mockHandler.connect).toHaveBeenCalledTimes(2);
    expect(mockHandler.disconnect).not.toHaveBeenCalled();
  });

  it('should handle switching from one wallet to another and back', async () => {
    const mockMetamaskHandler = {
      connect: vi.fn().mockResolvedValue({
        name: 'MetaMask',
        address: '0x1234567890123456789012345678901234567890',
        chainId: '1',
        family: 'evm'
      }),
      disconnect: vi.fn().mockResolvedValue(undefined)
    };
    
    const mockRabbyHandler = {
      connect: vi.fn().mockResolvedValue({
        name: 'Rabby Wallet',
        address: '0x0987654321098765432109876543210987654321',
        chainId: '1',
        family: 'evm'
      }),
      disconnect: vi.fn().mockResolvedValue(undefined)
    };
    
    // Mock the wallet registry
    const { default: walletRegistry } = await import('../wallet_registry.js');
    walletRegistry.get = vi.fn((family) => {
      if (family === 'evm') {
        return class {
          constructor(onStateChange) {
            if (onStateChange.toString().includes('io.metamask')) {
              return mockMetamaskHandler;
            } else {
              return mockRabbyHandler;
            }
          }
        };
      }
    });
    
    // Connect to MetaMask
    await walletManager.connect('io.metamask');
    expect(walletManager.activeConnection.name).toBe('MetaMask');
    
    // Switch to Rabby
    await walletManager.connect('io.rabby');
    expect(walletManager.activeConnection.name).toBe('Rabby Wallet');
    
    // Verify MetaMask was disconnected
    expect(mockMetamaskHandler.disconnect).toHaveBeenCalledTimes(1);
    
    // Switch back to MetaMask
    await walletManager.connect('io.metamask');
    expect(walletManager.activeConnection.name).toBe('MetaMask');
    
    // Verify Rabby was disconnected
    expect(mockRabbyHandler.disconnect).toHaveBeenCalledTimes(1);
  });
});