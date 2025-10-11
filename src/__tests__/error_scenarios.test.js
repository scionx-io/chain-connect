import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletManager } from '../core/wallet_manager.js';
import { createMockEvmProvider, createMockSolanaProvider, createMockTronProvider } from './mock_wallets.js';

vi.mock('../utils.js', () => ({
  loadWalletState: vi.fn().mockReturnValue(null),
  saveWalletState: vi.fn(),
  clearWalletState: vi.fn(),
  updateButtonState: vi.fn(),
  updateWalletInfo: vi.fn(),
  resetWalletUI: vi.fn(),
  formatAddress: vi.fn(),
}));

vi.mock('../core/wallet_registry.js', () => ({
  default: {
    get: vi.fn(),
    register: vi.fn()
  }
}));

import walletRegistry from '../core/wallet_registry.js';

describe('Error Scenarios', () => {
  let walletManager;
  let mockMipdStore;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockMipdStore = {
      getProviders: vi.fn().mockReturnValue([])
    };

    walletManager = new WalletManager(mockMipdStore);
  });

  describe('User Rejection Errors', () => {
    it('should handle user rejection during EVM wallet connection', async () => {
      const mockProvider = createMockEvmProvider({ shouldReject: true });
      mockMipdStore.getProviders.mockReturnValue([{
        info: { name: 'MetaMask', rdns: 'io.metamask', chains: ['eip155:1'], icon: 'icon' },
        provider: mockProvider
      }]);

      const mockHandler = vi.fn().mockReturnValue({
        connect: vi.fn().mockRejectedValue(new Error('User rejected request')),
        disconnect: vi.fn()
      });
      
      walletRegistry.get.mockReturnValue(mockHandler);

      await expect(walletManager.connect('io.metamask'))
        .rejects
        .toThrow('User rejected request');
    });

    it('should handle user rejection during Solana wallet connection', async () => {
      const mockProvider = createMockSolanaProvider({ shouldReject: true });
      mockMipdStore.getProviders.mockReturnValue([{
        info: { name: 'Phantom', rdns: 'phantom', chains: ['solana:101'], icon: 'icon' },
        provider: mockProvider
      }]);

      const mockHandler = vi.fn().mockReturnValue({
        connect: vi.fn().mockRejectedValue(new Error('User rejected request')),
        disconnect: vi.fn()
      });
      
      walletRegistry.get.mockReturnValue(mockHandler);

      await expect(walletManager.connect('phantom'))
        .rejects
        .toThrow('User rejected request');
    });

    it('should handle user rejection during Tron wallet connection', async () => {
      const mockProvider = createMockTronProvider({ shouldReject: true });
      mockMipdStore.getProviders.mockReturnValue([{
        info: { name: 'TronLink', rdns: 'tronlink', chains: ['tron:0x2b6653dc'], icon: 'icon' },
        provider: mockProvider
      }]);

      const mockHandler = vi.fn().mockReturnValue({
        connect: vi.fn().mockRejectedValue(new Error('User rejected request')),
        disconnect: vi.fn()
      });
      
      walletRegistry.get.mockReturnValue(mockHandler);

      await expect(walletManager.connect('tronlink'))
        .rejects
        .toThrow('User rejected request');
    });
  });

  describe('Network and Connection Errors', () => {
    it('should handle network errors during EVM wallet connection', async () => {
      const mockProvider = createMockEvmProvider({ shouldError: true });
      mockMipdStore.getProviders.mockReturnValue([{
        info: { name: 'MetaMask', rdns: 'io.metamask', chains: ['eip155:1'], icon: 'icon' },
        provider: mockProvider
      }]);

      const mockHandler = vi.fn().mockReturnValue({
        connect: vi.fn().mockRejectedValue(new Error('Network Error')),
        disconnect: vi.fn()
      });
      
      walletRegistry.get.mockReturnValue(mockHandler);

      await expect(walletManager.connect('io.metamask'))
        .rejects
        .toThrow('Network Error');
    });

    it('should handle timeout errors gracefully', async () => {
      const mockProvider = createMockEvmProvider();
      mockMipdStore.getProviders.mockReturnValue([{
        info: { name: 'MetaMask', rdns: 'io.metamask', chains: ['eip155:1'], icon: 'icon' },
        provider: mockProvider
      }]);

      const mockHandler = vi.fn().mockReturnValue({
        connect: vi.fn().mockRejectedValue(new Error('Connection timeout')),
        disconnect: vi.fn()
      });
      
      walletRegistry.get.mockReturnValue(mockHandler);

      await expect(walletManager.connect('io.metamask'))
        .rejects
        .toThrow('Connection timeout');
    });

    it('should handle missing provider errors', async () => {
      mockMipdStore.getProviders.mockReturnValue([]);

      await expect(walletManager.connect('nonexistent.wallet'))
        .rejects
        .toThrow();
    });

    it('should handle missing wallet handler errors', async () => {
      const mockProvider = createMockEvmProvider();
      mockMipdStore.getProviders.mockReturnValue([{
        info: { name: 'UnknownWallet', rdns: 'unknown.wallet', chains: ['unknown:1'], icon: 'icon' },
        provider: mockProvider
      }]);

      walletRegistry.get.mockReturnValue(null);

      await expect(walletManager.connect('unknown.wallet'))
        .rejects
        .toThrow();
    });
  });

  describe('Wallet Controller Error Handling', () => {
    it('should handle errors in selectWallet method', async () => {
      const mockProvider = createMockEvmProvider({ shouldError: true });
      mockMipdStore.getProviders.mockReturnValue([{
        info: { name: 'MetaMask', rdns: 'io.metamask', chains: ['eip155:1'], icon: 'icon' },
        provider: mockProvider
      }]);

      const mockHandler = vi.fn().mockReturnValue({
        connect: vi.fn().mockRejectedValue(new Error('Provider error')),
        disconnect: vi.fn()
      });
      
      walletRegistry.get.mockReturnValue(mockHandler);

      await expect(walletManager.connect('io.metamask'))
        .rejects
        .toThrow('Provider error');
    });
  });

  describe('State Inconsistency Prevention', () => {
    it('should handle connect after disconnect', async () => {
      const mockProvider = createMockEvmProvider();
      mockMipdStore.getProviders.mockReturnValue([{
        info: { name: 'MetaMask', rdns: 'io.metamask', chains: ['eip155:1'], icon: 'icon' },
        provider: mockProvider
      }]);

      const mockHandler = vi.fn().mockReturnValue({
        connect: vi.fn().mockResolvedValue({
          address: '0x123',
          chainId: '1',
          name: 'MetaMask',
          rdns: 'io.metamask',
          family: 'evm',
          chains: ['eip155:1']
        }),
        disconnect: vi.fn()
      });
      
      walletRegistry.get.mockReturnValue(mockHandler);

      // Connect
      const first = await walletManager.connect('io.metamask');
      expect(first.address).toBe('0x123');
      
      // Disconnect
      await walletManager.disconnect();
      
      // Connect again should work
      const second = await walletManager.connect('io.metamask');
      expect(second.address).toBe('0x123');
    });
  });
});