/**
 * Providers module for GLIN ProviderStaking pallet
 */

import { ApiPromise } from '@polkadot/api';
import type { ProviderStake } from '../types';

export class GlinProviders {
  constructor(private api: ApiPromise) {}

  /**
   * Get a specific provider stake by address
   */
  async getProviderStake(address: string): Promise<ProviderStake | null> {
    try {
      const provider = await this.api.query.providerStaking.providers(address);

      if (provider.isEmpty) return null;

      const providerData = provider.toJSON() as {
        stake: string;
        reputation?: number;
        tasksCompleted?: number;
        isActive?: boolean;
      };

      return {
        address,
        stake: providerData.stake,
        reputation: providerData.reputation || 0,
        tasksCompleted: providerData.tasksCompleted || 0,
        isActive: providerData.isActive || false
      };
    } catch (error) {
      console.error('Failed to fetch provider stake:', error);
      return null;
    }
  }

  /**
   * Get all providers from the registry
   */
  async getAllProviders(): Promise<ProviderStake[]> {
    try {
      const entries = await this.api.query.providerStaking.providers.entries();

      return entries.map(([key, value]) => {
        const address = key.args[0].toString();
        const providerData = value.toJSON() as {
          stake: string;
          reputation?: number;
          tasksCompleted?: number;
          isActive?: boolean;
        };

        return {
          address,
          stake: providerData.stake,
          reputation: providerData.reputation || 0,
          tasksCompleted: providerData.tasksCompleted || 0,
          isActive: providerData.isActive || false
        };
      });
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      return [];
    }
  }

  /**
   * Get active providers only
   */
  async getActiveProviders(): Promise<ProviderStake[]> {
    const allProviders = await this.getAllProviders();
    return allProviders.filter(provider => provider.isActive);
  }

  /**
   * Get providers sorted by stake (descending)
   */
  async getProvidersByStake(): Promise<ProviderStake[]> {
    const allProviders = await this.getAllProviders();
    return allProviders.sort((a, b) =>
      BigInt(b.stake) > BigInt(a.stake) ? 1 : -1
    );
  }

  /**
   * Get providers sorted by reputation (descending)
   */
  async getProvidersByReputation(): Promise<ProviderStake[]> {
    const allProviders = await this.getAllProviders();
    return allProviders.sort((a, b) => b.reputation - a.reputation);
  }
}
