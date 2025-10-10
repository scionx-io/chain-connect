
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { saveWalletState, loadWalletState, clearWalletState } from '../utils.js';

describe('Wallet State Utilities', () => {
  let storage = {};
  const mockTimestamp = 1234567890;

  beforeEach(() => {
    storage = {};
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      storage[key] = value;
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => storage[key]);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
      delete storage[key];
    });
    vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
      storage = {};
    });
    vi.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should save wallet state to localStorage', () => {
    const walletType = 'evm';
    const address = '0x123';
    const chainId = '1';
    const rdns = 'io.metamask';

    saveWalletState(walletType, address, chainId, rdns);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'wallet_connection',
      JSON.stringify({ walletType, address, chainId, rdns, timestamp: mockTimestamp })
    );

    const savedState = JSON.parse(storage['wallet_connection']);
    expect(savedState).toEqual({ walletType, address, chainId, rdns, timestamp: mockTimestamp });
  });

  it('should load wallet state from localStorage', () => {
    const state = { walletType: 'evm', address: '0x123', chainId: '1', rdns: 'io.metamask', timestamp: mockTimestamp };
    storage['wallet_connection'] = JSON.stringify(state);

    const loadedState = loadWalletState();

    expect(localStorage.getItem).toHaveBeenCalledWith('wallet_connection');
    expect(loadedState).toEqual(state);
  });

  it('should return null when loading with no saved state', () => {
    const loadedState = loadWalletState();
    expect(loadedState).toBeNull();
  });

  it('should clear wallet state from localStorage', () => {
    const state = { walletType: 'evm', address: '0x123', chainId: '1', rdns: 'io.metamask' };
    storage['wallet_connection'] = JSON.stringify(state);

    clearWalletState();

    expect(localStorage.removeItem).toHaveBeenCalledWith('wallet_connection');
    expect(storage['wallet_connection']).toBeUndefined();
  });
});
