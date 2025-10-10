import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletManager } from '../wallet_manager.js';
import EvmHandler from '../wallets/evm_handler.js';
import { createMockEvmProvider } from './mock_wallets.js';

vi.mock('../utils.js');
vi.mock('../wallet_registry.js');

import * as utils from '../utils.js';
import walletRegistry from '../wallet_registry.js';

describe('Reconnection Logic', () => {
  let walletManager;
  let mockMipdStore;
  let mockConnect;
  let mockHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockConnect = vi.fn().mockResolvedValue({
      address: '0x1234567890123456789012345678901234567890',
      chainId: '1',
      name: 'MetaMask',
      rdns: 'io.metamask',
      family: 'evm',
      chains: ['eip155:1']
    });

    mockHandler = vi.fn().mockReturnValue({
      connect: mockConnect,
      disconnect: vi.fn()
    });

    vi.mocked(walletRegistry.get).mockReturnValue(mockHandler);
    vi.mocked(utils.loadWalletState).mockReturnValue(null);
    
    mockMipdStore = {
      getProviders: vi.fn().mockReturnValue([])
    };

    walletManager = new WalletManager(mockMipdStore);
  });

  it('should attempt reconnection on init if saved state exists', async () => {
    const savedState = { 
      rdns: 'io.metamask', 
      address: '0x123',
      chainId: '1',
      family: 'evm'
    };
    
    vi.mocked(utils.loadWalletState).mockReturnValue(savedState);

    const mockProvider = createMockEvmProvider();
    mockMipdStore.getProviders.mockReturnValue([{
      info: { name: 'MetaMask', rdns: 'io.metamask', chains: ['eip155:1'], icon: 'icon' },
      provider: mockProvider
    }]);

    await walletManager.init();

    expect(mockConnect).toHaveBeenCalledWith(expect.any(Object), true);
  });

  it('should handle reconnection failure gracefully', async () => {
    vi.mocked(utils.loadWalletState).mockReturnValue({ 
      rdns: 'io.metamask', 
      address: '0x123', 
      chainId: '1', 
      family: 'evm' 
    });
    
    mockMipdStore.getProviders.mockReturnValue([]);

    await walletManager.init();

    expect(vi.mocked(utils.clearWalletState)).toHaveBeenCalled();
  });

  it('should handle reconnection with no saved state', async () => {
    vi.mocked(utils.loadWalletState).mockReturnValue(null);

    await walletManager.init();

    expect(vi.mocked(utils.loadWalletState)).toHaveBeenCalled();
    expect(vi.mocked(utils.clearWalletState)).not.toHaveBeenCalled();
  });

  it('should reconnect using window.ethereum if available', async () => {
    vi.mocked(utils.loadWalletState).mockReturnValue({ 
      rdns: 'io.metamask', 
      address: '0x123', 
      chainId: '1', 
      family: 'evm' 
    });

    const mockEthereumProvider = createMockEvmProvider();
    global.window = { ethereum: mockEthereumProvider };
    mockMipdStore.getProviders.mockReturnValue([]);

    await walletManager.init();

    expect(mockConnect).toHaveBeenCalledWith(expect.any(Object), true);
  });

  it('should reconnect using EVMHandler with onlyIfTrusted option', async () => {
    vi.mocked(utils.loadWalletState).mockReturnValue({ 
      rdns: 'io.metamask', 
      address: '0x123', 
      chainId: '1', 
      family: 'evm' 
    });

    const mockProvider = createMockEvmProvider();
    mockMipdStore.getProviders.mockReturnValue([{
      info: { name: 'MetaMask', rdns: 'io.metamask', chains: ['eip155:1'], icon: 'icon' },
      provider: mockProvider
    }]);

    await walletManager.init();

    expect(mockConnect).toHaveBeenCalledWith(expect.any(Object), true);
  });

  it('should only reconnect if wallet provider is available', async () => {
    vi.mocked(utils.loadWalletState).mockReturnValue({ 
      rdns: 'io.metamask', 
      address: '0x123', 
      chainId: '1', 
      family: 'evm' 
    });

    // No providers and no window.ethereum
    delete global.window;
    mockMipdStore.getProviders.mockReturnValue([]);
    await walletManager.init();
    
    // Should not have connected (no provider available)
    expect(mockConnect).not.toHaveBeenCalled();
    
    // Now add provider
    const mockProvider = createMockEvmProvider();
    mockMipdStore.getProviders.mockReturnValue([{
      info: { name: 'MetaMask', rdns: 'io.metamask', chains: ['eip155:1'], icon: 'icon' },
      provider: mockProvider
    }]);
    
    // Manual connect should work
    const connection = await walletManager.connect('io.metamask', false);
    
    expect(connection).toBeDefined();
    expect(connection.rdns).toBe('io.metamask');
  });
});