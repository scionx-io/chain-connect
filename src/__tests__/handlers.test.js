import { describe, it, beforeEach, vi, expect, afterEach } from 'vitest';
import EvmHandler from '../core/wallets/evm_handler.js';
import SolanaHandler from '../core/wallets/solana_handler.js';
import TronHandler from '../core/wallets/tron_handler.js';

// Mock ethers to avoid complex provider issues in tests
vi.mock('ethers', async () => {
  const actual = await vi.importActual('ethers');
  return {
    ...actual,
    ethers: {
      ...actual.ethers,
      BrowserProvider: vi.fn().mockImplementation((provider) => ({
        send: provider.send || vi.fn(),
        getSigner: vi.fn().mockResolvedValue({
          getAddress: vi.fn().mockResolvedValue('0x123')
        }),
        getNetwork: vi.fn().mockResolvedValue({ chainId: BigInt(1) }),
        on: vi.fn(),
        removeListener: vi.fn(),
      }))
    }
  };
});

describe('Handler Event Listener Cleanup', () => {
  let mockOnStateChanged;

  beforeEach(() => {
    mockOnStateChanged = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('SolanaHandler', () => {
    let solanaHandler;
    let mockProvider;

    beforeEach(() => {
      mockProvider = {
        connect: vi.fn(),
        on: vi.fn(),
        removeListener: vi.fn(),
        disconnect: vi.fn(),
      };
      
      solanaHandler = new SolanaHandler(mockOnStateChanged);
    });

    it('should attach and properly clean up event listeners', async () => {
      const mockProviderDetails = {
        provider: mockProvider,
        info: { name: 'Phantom', rdns: 'phantom' }
      };

      mockProvider.connect.mockResolvedValue({ publicKey: { toString: () => 'solana123' } });

      // Connect to establish listeners
      const connection = await solanaHandler.connect(mockProviderDetails);

      // Verify connection has family property
      expect(connection.family).toBe('solana');

      // Verify listeners were attached
      expect(mockProvider.on).toHaveBeenCalledWith('accountChanged', expect.any(Function));

      // Disconnect to clean up
      solanaHandler.disconnect();

      // Verify listeners were removed
      expect(mockProvider.removeListener).toHaveBeenCalledWith('accountChanged', expect.any(Function));
      expect(mockProvider.disconnect).toHaveBeenCalled();
    });
  });

  describe('TronHandler', () => {
    let tronHandler;
    let originalTronWeb;

    beforeEach(() => {
      originalTronWeb = window.tronWeb;
      window.tronWeb = {
        request: vi.fn(),
        solidityNode: { host: 'https://api.trongrid.io' },
        defaultAddress: { base58: 'TTRjVyHu1Lv3DjRkM3Tc3vz1jM9Fv4wW4w' }
      };
      
      tronHandler = new TronHandler(mockOnStateChanged);
    });

    afterEach(() => {
      window.tronWeb = originalTronWeb;
      vi.clearAllMocks();
    });

    it('should attach and properly clean up event listeners', async () => {
      const mockProviderDetails = {
        provider: window.tronWeb,
        info: { name: 'TronLink', rdns: 'tronlink' }
      };

      window.tronWeb.request.mockResolvedValue(['TTRjVyHu1Lv3DjRkM3Tc3vz1jM9Fv4wW4w']);

      // Connect to establish listeners
      const connection = await tronHandler.connect(mockProviderDetails);

      // Verify connection has family property
      expect(connection.family).toBe('tron');

      // Verify the message listener was added
      expect(tronHandler.accountChangedListener).not.toBeNull();

      // Disconnect to clean up
      tronHandler.disconnect();

      // Verify listeners were removed
      expect(tronHandler.accountChangedListener).toBeNull();
    });
  });
});