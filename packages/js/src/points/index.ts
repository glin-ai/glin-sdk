/**
 * Testnet Points module for GLIN TestnetPoints pallet
 */

import { ApiPromise } from '@polkadot/api';
import type { TestnetPoints } from '../types';

export class GlinPoints {
  constructor(private api: ApiPromise) {}

  /**
   * Get testnet points for a specific address
   */
  async getTestnetPoints(address: string): Promise<TestnetPoints | null> {
    try {
      const points = await this.api.query.testnetPoints.points(address);

      if (points.isEmpty) return null;

      const pointsData = points.toJSON() as {
        points?: number;
        lastUpdated?: number;
      };

      return {
        address,
        points: pointsData.points || 0,
        lastUpdated: pointsData.lastUpdated || 0
      };
    } catch (error) {
      console.error('Failed to fetch testnet points:', error);
      return null;
    }
  }

  /**
   * Get all testnet points entries
   */
  async getAllTestnetPoints(): Promise<TestnetPoints[]> {
    try {
      const entries = await this.api.query.testnetPoints.points.entries();

      return entries.map(([key, value]) => {
        const address = key.args[0].toString();
        const pointsData = value.toJSON() as {
          points?: number;
          lastUpdated?: number;
        };

        return {
          address,
          points: pointsData.points || 0,
          lastUpdated: pointsData.lastUpdated || 0
        };
      });
    } catch (error) {
      console.error('Failed to fetch all testnet points:', error);
      return [];
    }
  }

  /**
   * Get leaderboard (sorted by points descending)
   */
  async getLeaderboard(limit?: number): Promise<TestnetPoints[]> {
    const allPoints = await this.getAllTestnetPoints();
    const sorted = allPoints.sort((a, b) => b.points - a.points);
    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Get rank for a specific address
   */
  async getRank(address: string): Promise<number | null> {
    const leaderboard = await this.getLeaderboard();
    const rank = leaderboard.findIndex(entry => entry.address === address);
    return rank === -1 ? null : rank + 1;
  }
}
