import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletManager } from '../core/wallet_manager.js';

// Mock config.js to avoid SVG import issues
vi.mock('../config.js', () => ({
  WALLET_ICONS: {
    metamask: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjM0U3QkVFIi8+Cjwvc3ZnPgo=',
    phantom: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjNjM0NUQ2Ii8+Cjwvc3ZnPgo=',
    tronlink: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjRUQ0NjM2Ii8+Cjwvc3ZnPgo=',
  }
}));

// Mock the wallet registry
vi.mock('../core/wallet_registry.js', () => ({
  default: {
    get: vi.fn(),
    register: vi.fn()
  }
}));

// Mock dependencies
vi.mock('../utils.js', async () => {
  const actualUtils = await vi.importActual('../utils.js');
  
  return {
    ...actualUtils,
    loadWalletState: vi.fn().mockReturnValue(null),
    saveWalletState: vi.fn(),
    clearWalletState: vi.fn(),
  };
});

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



describe('Wallet Switching', () => {
  let walletManager;
  let mockMipdStore;
  let mockConnectionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock MIPD store
    mockMipdStore = {
      getProviders: vi.fn().mockReturnValue([])
    };

    walletManager = new WalletManager(mockMipdStore);
    
    // Get references to the mock managers
    mockConnectionManager = walletManager.connectionManager;
    
    // Reset mocks to default behavior
    mockConnectionManager.hasConnection.mockReturnValue(false);
    mockConnectionManager.getActiveConnection.mockReturnValue(null);
  });

  it('should disconnect active wallet before connecting to a new one', async () => {
    const mockMetamaskConnection = {
      name: 'MetaMask',
      address: '0x1234567890123456789012345678901234567890',
      chainId: '1',
      family: 'evm',
      rdns: 'io.metamask'
    };

    const mockRabbyConnection = {
      name: 'Rabby Wallet',
      address: '0x0987654321098765432109876543210987654321',
      chainId: '1',
      family: 'evm',
      rdns: 'io.rabby'
    };

    // Connect to MetaMask first
    mockConnectionManager.hasConnection.mockReturnValue(false);
    mockConnectionManager.connect.mockResolvedValue(mockMetamaskConnection);
    mockConnectionManager.getActiveConnection.mockReturnValue(mockMetamaskConnection);

    await walletManager.connect('io.metamask');

    // Now connect to Rabby - should disconnect MetaMask first
    mockConnectionManager.getActiveConnection.mockReturnValue(mockMetamaskConnection); // MetaMask still active
    mockConnectionManager.connect.mockResolvedValue(mockRabbyConnection);

    await walletManager.connect('io.rabby');

    // Verify MetaMask was disconnected
    expect(mockConnectionManager.disconnect).toHaveBeenCalledWith('io.metamask');

    // Verify Rabby was connected
    expect(mockConnectionManager.connect).toHaveBeenCalledWith(
      'io.rabby',
      false,
      expect.any(Function)
    );
  });

  it('should handle connecting to the same wallet twice', async () => {
    const mockConnection = {
      name: 'MetaMask',
      address: '0x1234567890123456789012345678901234567890',
      chainId: '1',
      family: 'evm',
      rdns: 'io.metamask'
    };

    // First connection succeeds
    mockConnectionManager.hasConnection.mockReturnValue(false);
    mockConnectionManager.connect.mockResolvedValue(mockConnection);

    await walletManager.connect('io.metamask');

    expect(mockConnectionManager.connect).toHaveBeenCalledTimes(1);

    // Try to connect again - now hasConnection returns true
    mockConnectionManager.hasConnection.mockReturnValue(true);

    await expect(walletManager.connect('io.metamask')).rejects.toThrow('already connected');

    // Verify connect was only called once
    expect(mockConnectionManager.connect).toHaveBeenCalledTimes(1);
  });

  it('should handle switching from one wallet to another and back', async () => {
    const mockMetamaskConnection = {
      name: 'MetaMask',
      address: '0x1234567890123456789012345678901234567890',
      chainId: '1',
      family: 'evm',
      rdns: 'io.metamask'
    };

    const mockRabbyConnection = {
      name: 'Rabby Wallet',
      address: '0x0987654321098765432109876543210987654321',
      chainId: '1',
      family: 'evm',
      rdns: 'io.rabby'
    };

    // Connect to MetaMask
    mockConnectionManager.hasConnection.mockReturnValue(false);
    mockConnectionManager.connect.mockResolvedValue(mockMetamaskConnection);
    mockConnectionManager.getActiveConnection.mockReturnValue(mockMetamaskConnection);

    await walletManager.connect('io.metamask');
    expect(walletManager.getActiveConnection().name).toBe('MetaMask');

    // Switch to Rabby
    mockConnectionManager.getActiveConnection.mockReturnValue(mockMetamaskConnection); // MetaMask still active
    mockConnectionManager.connect.mockResolvedValue(mockRabbyConnection);

    await walletManager.connect('io.rabby');

    mockConnectionManager.getActiveConnection.mockReturnValue(mockRabbyConnection);
    expect(walletManager.getActiveConnection().name).toBe('Rabby Wallet');
    expect(mockConnectionManager.disconnect).toHaveBeenCalledWith('io.metamask');

    // Switch back to MetaMask
    mockConnectionManager.getActiveConnection.mockReturnValue(mockRabbyConnection); // Rabby still active
    mockConnectionManager.connect.mockResolvedValue(mockMetamaskConnection);

    await walletManager.connect('io.metamask');

    mockConnectionManager.getActiveConnection.mockReturnValue(mockMetamaskConnection);
    expect(walletManager.getActiveConnection().name).toBe('MetaMask');
    expect(mockConnectionManager.disconnect).toHaveBeenCalledWith('io.rabby');
  });
});