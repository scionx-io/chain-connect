import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletProviderResolver } from '../core/services/wallet_provider_resolver.js';
import { createStore } from 'mipd';

describe('WalletProviderResolver', () => {
  let mipdStore;
  let resolver;

  beforeEach(() => {
    mipdStore = createStore();
    resolver = new WalletProviderResolver(mipdStore);
  });

  it('should infer chains for Rabby wallet when chains are undefined', () => {
    // Mock a MIPD store with Rabby provider that has undefined chains
    const mockRabbyProvider = {
      info: {
        rdns: 'io.rabby',
        name: 'Rabby Wallet',
        chains: undefined
      },
      provider: {
        request: vi.fn()
      }
    };

    // Mock the store to return the Rabby provider
    vi.spyOn(mipdStore, 'getProviders').mockReturnValue([mockRabbyProvider]);

    // Call findMIPDProvider
    const result = resolver.findMIPDProvider('io.rabby');

    // Verify the result
    expect(result).not.toBeNull();
    expect(result.info.name).toBe('Rabby Wallet');
    expect(result.info.rdns).toBe('io.rabby');
    // The chains should now be inferred as ['eip155:1']
    expect(result.info.chains).toEqual(['eip155:1']);
  });

  it('should infer chains for Rabby wallet when chains are an empty array', () => {
    // Mock a MIPD store with Rabby provider that has empty chains array
    const mockRabbyProvider = {
      info: {
        rdns: 'io.rabby',
        name: 'Rabby Wallet',
        chains: []
      },
      provider: {
        request: vi.fn()
      }
    };

    // Mock the store to return the Rabby provider
    vi.spyOn(mipdStore, 'getProviders').mockReturnValue([mockRabbyProvider]);

    // Call findMIPDProvider
    const result = resolver.findMIPDProvider('io.rabby');

    // Verify the result
    expect(result).not.toBeNull();
    expect(result.info.name).toBe('Rabby Wallet');
    expect(result.info.rdns).toBe('io.rabby');
    // The chains should now be inferred as ['eip155:1']
    expect(result.info.chains).toEqual(['eip155:1']);
  });

  it('should return existing chains if they are defined and not empty', () => {
    // Mock a MIPD store with Rabby provider that has proper chains
    const mockRabbyProvider = {
      info: {
        rdns: 'io.rabby',
        name: 'Rabby Wallet',
        chains: ['eip155:1', 'eip155:137']
      },
      provider: {
        request: vi.fn()
      }
    };

    // Mock the store to return the Rabby provider
    vi.spyOn(mipdStore, 'getProviders').mockReturnValue([mockRabbyProvider]);

    // Call findMIPDProvider
    const result = resolver.findMIPDProvider('io.rabby');

    // Verify the result
    expect(result).not.toBeNull();
    expect(result.info.name).toBe('Rabby Wallet');
    expect(result.info.rdns).toBe('io.rabby');
    // The chains should remain as they were
    expect(result.info.chains).toEqual(['eip155:1', 'eip155:137']);
  });
});