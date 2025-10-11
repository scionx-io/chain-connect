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

// Mock dependencies
vi.mock('../utils.js', () => ({
  loadWalletState: vi.fn().mockReturnValue(null),
  saveWalletState: vi.fn(),
  clearWalletState: vi.fn(),
  // Keep the other utils functions as they are
  formatAddress: vi.fn(),
  updateButtonState: vi.fn(),
  updateWalletInfo: vi.fn(),
  resetWalletUI: vi.fn(),
}));

vi.mock('../core/wallet_registry.js', () => ({
  default: {
    get: vi.fn(),
    register: vi.fn() // Add register method to prevent errors
  }
}));

// Mock wallets/index.js to prevent handler registration during import
vi.mock('../core/wallets/index.js', () => ({}));

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



describe('Wallet Integration Tests', () => {
  let walletManager;
  let mockMipdStore;
  let connectedEvent;
  let disconnectedEvent;
  let stateChangedEvent;
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

    // Set up event listeners to capture events - we'll update the test variables inside the listeners
    walletManager.addEventListener('connected', (event) => {
      connectedEvent = event;
    });

    walletManager.addEventListener('disconnected', (event) => {
      disconnectedEvent = event;
    });
    
    walletManager.addEventListener('stateChanged', (event) => {
      stateChangedEvent = event;
    });
  });

  it('should complete full connection flow successfully', async () => {
    const mockConnection = {
      address: '0x1234567890123456789012345678901234567890',
      chainId: '1',
      name: 'MetaMask',
      rdns: 'io.metamask',
      family: 'evm',
      chains: ['eip155:1']
    };

    mockConnectionManager.connect.mockResolvedValue(mockConnection);
    mockConnectionManager.getActiveConnection.mockReturnValueOnce(mockConnection).mockReturnValue(mockConnection);
    mockConnectionManager.hasConnection.mockReturnValueOnce(false).mockReturnValue(true); // Initially false, then true after connection
    
    // Connect to a wallet
    const connection = await walletManager.connect('io.metamask');

    // Verify connection was successful
    expect(connection).toBeDefined();
    expect(connection.address).toBe('0x1234567890123456789012345678901234567890');
    expect(connection.chainId).toBe('1');
    expect(connection.family).toBe('evm');
    expect(walletManager.getActiveConnection()).toBe(connection);

    // Verify that connected event was emitted
    expect(connectedEvent).toBeDefined();
    expect(connectedEvent.detail.connection).toBe(connection);

    // Verify internal state through the connection manager
    expect(mockConnectionManager.hasConnection('io.metamask')).toBe(true);
  });

  it('should complete connection and disconnection flow', async () => {
    const mockConnection = {
      address: '0x1234567890123456789012345678901234567890',
      chainId: '1',
      name: 'MetaMask',
      rdns: 'io.metamask',
      family: 'evm',
      chains: ['eip155:1']
    };

    mockConnectionManager.hasConnection.mockReturnValue(false);
    mockConnectionManager.connect.mockResolvedValue(mockConnection);
    mockConnectionManager.getActiveConnection.mockReturnValue(mockConnection);

    // Connect to a wallet
    await walletManager.connect('io.metamask');
    expect(mockConnectionManager.connect).toHaveBeenCalled();

    // Disconnect from the wallet
    mockConnectionManager.getActiveConnection.mockReturnValue(null);
    await walletManager.disconnect('io.metamask');

    // Verify disconnection was called
    expect(mockConnectionManager.disconnect).toHaveBeenCalledWith('io.metamask');
    expect(walletManager.getActiveConnection()).toBeNull();
  });

  it('should handle multiple connections properly', async () => {
    const mockConnection = {
      address: '0x1234567890123456789012345678901234567890',
      chainId: '1',
      name: 'MetaMask',
      rdns: 'io.metamask',
      family: 'evm',
      chains: ['eip155:1']
    };

    // First connection succeeds
    mockConnectionManager.hasConnection.mockReturnValue(false);
    mockConnectionManager.connect.mockResolvedValue(mockConnection);
    mockConnectionManager.getActiveConnection.mockReturnValue(mockConnection);

    await walletManager.connect('io.metamask');
    expect(mockConnectionManager.connect).toHaveBeenCalledTimes(1);

    // Second connection attempt - hasConnection returns true so it should fail
    mockConnectionManager.hasConnection.mockReturnValue(true);

    await expect(walletManager.connect('io.metamask')).rejects.toThrow('already connected');

    // Connection should only have been attempted once
    expect(mockConnectionManager.connect).toHaveBeenCalledTimes(1);
  });

  it('should handle state change events', async () => {
    const mockConnection = {
      address: '0x1234567890123456789012345678901234567890',
      chainId: '1',
      name: 'MetaMask',
      rdns: 'io.metamask',
      family: 'evm',
      chains: ['eip155:1']
    };

    mockConnectionManager.hasConnection.mockReturnValue(false);
    mockConnectionManager.connect.mockResolvedValue(mockConnection);
    mockConnectionManager.getActiveConnection.mockReturnValue(mockConnection);
    mockConnectionManager.getConnection.mockReturnValue(mockConnection);

    // Connect to a wallet
    await walletManager.connect('io.metamask');

    // Manually trigger the state change through the manager
    const newState = { address: '0xnewAddressChanged' };
    walletManager.handleStateChange('io.metamask', { ...mockConnection, ...newState });

    // Verify getConnection was called
    expect(mockConnectionManager.getConnection).toHaveBeenCalledWith('io.metamask');
  });

  it('should handle reconnection flow', async () => {
    const mockConnection = {
      address: '0x1234567890123456789012345678901234567890',
      chainId: '1',
      name: 'MetaMask',
      rdns: 'io.metamask',
      family: 'evm',
      chains: ['eip155:1']
    };

    // First connection
    mockConnectionManager.hasConnection.mockReturnValue(false);
    mockConnectionManager.connect.mockResolvedValue(mockConnection);
    mockConnectionManager.getActiveConnection.mockReturnValue(mockConnection);

    await walletManager.connect('io.metamask');
    expect(mockConnectionManager.connect).toHaveBeenCalledWith('io.metamask', false, expect.any(Function));

    // Disconnect
    mockConnectionManager.getActiveConnection.mockReturnValue(null);
    await walletManager.disconnect('io.metamask');
    expect(mockConnectionManager.disconnect).toHaveBeenCalledWith('io.metamask');

    // Reconnection
    mockConnectionManager.hasConnection.mockReturnValue(false);
    mockConnectionManager.connect.mockResolvedValue(mockConnection);
    mockConnectionManager.getActiveConnection.mockReturnValue(mockConnection);

    await walletManager.connect('io.metamask', true);
    expect(mockConnectionManager.connect).toHaveBeenCalledWith('io.metamask', true, expect.any(Function));
  });
});