import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletManager } from '../wallet_manager.js';
import EvmHandler from '../wallets/evm_handler.js';
import { createMockEvmProvider } from './mock_wallets.js';

// Mock dependencies
vi.mock('../utils.js', () => ({
  loadWalletState: vi.fn().mockReturnValue(null),
  saveWalletState: vi.fn(),
  clearWalletState: vi.fn(),
}));

vi.mock('../wallet_registry.js', () => ({
  default: {
    get: vi.fn().mockImplementation(family => {
      if (family === 'evm') return EvmHandler;
      return null;
    }),
    register: vi.fn() // Add register method to prevent errors
  }
}));

describe('Wallet Integration Tests', () => {
  let walletManager;
  let mockMipdStore;
  let mockProviderDetails;
  let connectedEvent;
  let disconnectedEvent;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock MIPD store
    mockMipdStore = {
      getProviders: vi.fn().mockReturnValue([])
    };

    // Setup provider details
    const mockProvider = createMockEvmProvider();
    mockProviderDetails = {
      info: {
        name: 'MetaMask',
        rdns: 'io.metamask',
        chains: ['eip155:1'],
        icon: 'metamask-icon'
      },
      provider: mockProvider
    };

    mockMipdStore.getProviders.mockReturnValue([mockProviderDetails]);

    walletManager = new WalletManager(mockMipdStore);

    // Set up event listeners to capture events
    connectedEvent = null;
    disconnectedEvent = null;

    walletManager.addEventListener('connected', (event) => {
      connectedEvent = event;
    });

    walletManager.addEventListener('disconnected', (event) => {
      disconnectedEvent = event;
    });
  });

  it('should complete full connection flow successfully', async () => {
    // Connect to a wallet
    const connection = await walletManager.connect('io.metamask');

    // Verify connection was successful
    expect(connection).toBeDefined();
    expect(connection.address).toBe('0x1234567890123456789012345678901234567890');
    expect(connection.chainId).toBe('1');
    expect(connection.family).toBe('evm');
    expect(walletManager.activeConnection).toBe(connection);

    // Verify that connected event was emitted
    expect(connectedEvent).toBeDefined();
    expect(connectedEvent.detail.connection).toBe(connection);

    // Verify internal state
    expect(walletManager.connections.has('io.metamask')).toBe(true);
    expect(walletManager.handlers.has('io.metamask')).toBe(true);
  });

  it('should complete connection and disconnection flow', async () => {
    // Connect to a wallet
    const connection = await walletManager.connect('io.metamask');
    expect(connection).toBeDefined();

    // Disconnect from the wallet
    await walletManager.disconnect('io.metamask');

    // Verify disconnection
    expect(walletManager.activeConnection).toBeNull();
    expect(walletManager.connections.has('io.metamask')).toBe(false);

    // Verify that disconnected event was emitted
    expect(disconnectedEvent).toBeDefined();
    expect(disconnectedEvent.detail.rdns).toBe('io.metamask');
    expect(disconnectedEvent.detail.family).toBe('evm');
  });

  it('should handle multiple connections properly', async () => {
    // Connect to first wallet
    const connection1 = await walletManager.connect('io.metamask');
    expect(connection1).toBeDefined();

    // Verify first connection
    expect(walletManager.activeConnection).toBe(connection1);
    const originalConnection = walletManager.activeConnection;

    // Connect to the same wallet should fail due to mutex
    await expect(walletManager.connect('io.metamask')).rejects.toThrow();

    // Connection should still be the original one
    expect(walletManager.activeConnection).toBe(originalConnection);
  });

  it('should handle state change events', async () => {
    // Connect to a wallet
    const connection = await walletManager.connect('io.metamask');
    expect(connection).toBeDefined();

    // Get the provider to trigger events
    const providerDetails = walletManager.findProvider('io.metamask');
    expect(providerDetails).toBeDefined();

    // Set up an event listener to check for state changes
    let stateChangedEvent = null;
    walletManager.addEventListener('stateChanged', (event) => {
      stateChangedEvent = event;
    });

    // Manually trigger the accounts changed event on the provider
    if (providerDetails.provider.emit) {
      providerDetails.provider.emit('accountsChanged', ['0xnewAddressChanged']);
    }

    // Wait a bit for the event to process
    await new Promise(resolve => setTimeout(resolve, 10));

    // Verify that the state changed event was emitted
    expect(stateChangedEvent).toBeDefined();
    expect(stateChangedEvent.detail.connection.address).toBe('0xnewAddressChanged');
  });

  it('should handle reconnection flow', async () => {
    // Connect and then disconnect
    const connection = await walletManager.connect('io.metamask');
    expect(connection).toBeDefined();
    expect(walletManager.activeConnection).toBe(connection);

    await walletManager.disconnect('io.metamask');
    expect(walletManager.activeConnection).toBeNull();

    // Connect again (simulating reconnection)
    mockMipdStore.getProviders.mockReturnValue([{
      ...mockProviderDetails,
      provider: createMockEvmProvider() // New provider instance
    }]);

    const reconnection = await walletManager.connect('io.metamask', true);
    expect(reconnection).toBeDefined();
    expect(walletManager.activeConnection).toBe(reconnection);
  });
});