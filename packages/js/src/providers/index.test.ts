/**
 * Unit tests for GlinProviders
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { GlinProviders } from './index';

describe('GlinProviders', () => {
  let api: ApiPromise;
  let providers: GlinProviders;

  beforeAll(async () => {
    const provider = new WsProvider('wss://glin-rpc-production.up.railway.app');
    api = await ApiPromise.create({ provider });
    providers = new GlinProviders(api);
  });

  afterAll(async () => {
    await api.disconnect();
  });

  describe('Provider queries', () => {
    it('should get all providers', async () => {
      const allProviders = await providers.getAllProviders();

      expect(Array.isArray(allProviders)).toBe(true);
    });

    it('should get provider by address if exists', async () => {
      const allProviders = await providers.getAllProviders();

      if (allProviders.length > 0) {
        const providerAddress = allProviders[0].address;
        const provider = await providers.getProviderStake(providerAddress);

        expect(provider).not.toBeNull();
        expect(provider?.address).toBe(providerAddress);
        expect(provider?.stake).toBeDefined();
        expect(provider?.reputation).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return null for non-existent provider', async () => {
      const provider = await providers.getProviderStake('5NonExistentAddress');

      expect(provider).toBeNull();
    });

    it('should get active providers only', async () => {
      const activeProviders = await providers.getActiveProviders();

      expect(activeProviders.every(p => p.isActive)).toBe(true);
    });

    it('should sort providers by stake', async () => {
      const sortedProviders = await providers.getProvidersByStake();

      if (sortedProviders.length > 1) {
        for (let i = 0; i < sortedProviders.length - 1; i++) {
          const current = BigInt(sortedProviders[i].stake);
          const next = BigInt(sortedProviders[i + 1].stake);
          expect(current >= next).toBe(true);
        }
      }
    });
  });
});
