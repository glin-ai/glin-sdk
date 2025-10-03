import { useState, useCallback, useEffect } from 'react';
import { useGlinClient } from './useGlinClient';
import { useAccount } from './useAccount';
import {
  ProviderMiningPattern,
  type HardwareSpec,
  type FederatedTask,
  type ModelType
} from '@glin-ai/sdk';

export interface UseProviderMiningOptions {
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
}

export interface MiningOpportunity {
  task: FederatedTask;
  estimatedReward: bigint;
  competitionLevel: 'Low' | 'Medium' | 'High';
  fitsHardware: boolean;
  rewardPerRound: bigint;
}

export interface MiningStats {
  totalTasksCompleted: number;
  totalRewardsEarned: bigint;
  averageQualityScore: number;
  currentReputation: number;
  activeTasks: string[];
  claimableRewards: bigint;
}

export interface UseProviderMiningResult {
  // State
  isRegistered: boolean;
  stats: MiningStats | null;
  opportunities: MiningOpportunity[];
  activeTasks: FederatedTask[];
  isLoading: boolean;
  error: Error | null;

  // Actions
  register: (params: { stake: bigint; hardwareSpec: HardwareSpec }) => Promise<void>;
  findOpportunities: (preferences?: {
    minReward?: bigint;
    preferredModelTypes?: ModelType[];
    maxConcurrentTasks?: number;
  }) => Promise<void>;
  joinTask: (taskId: string) => Promise<void>;
  claimRewards: () => Promise<bigint>;
  updateHardware: (hardwareSpec: HardwareSpec) => Promise<void>;
  stopMining: () => Promise<void>;
  withdrawStake: () => Promise<bigint>;
  refreshStats: () => Promise<void>;
  refreshOpportunities: () => Promise<void>;
}

/**
 * React hook for GPU provider mining
 * Provides interface for registration, task discovery, and reward claiming
 */
export function useProviderMining(
  options: UseProviderMiningOptions = {}
): UseProviderMiningResult {
  const { client } = useGlinClient();
  const { signer } = useAccount();

  const [isRegistered, setIsRegistered] = useState(false);
  const [stats, setStats] = useState<MiningStats | null>(null);
  const [opportunities, setOpportunities] = useState<MiningOpportunity[]>([]);
  const [activeTasks, setActiveTasks] = useState<FederatedTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize pattern
  const pattern = client && signer ? new ProviderMiningPattern(client, signer) : null;

  // Check if provider is registered
  const checkRegistration = useCallback(async () => {
    if (!pattern) return;

    try {
      const providerInfo = await pattern['providerWorkflow'].getProviderInfo();
      setIsRegistered(!!providerInfo);
    } catch (err) {
      setIsRegistered(false);
    }
  }, [pattern]);

  // Refresh stats
  const refreshStats = useCallback(async () => {
    if (!pattern || !isRegistered) return;

    try {
      const miningStats = await pattern.getMiningStats();
      setStats(miningStats);

      const tasks = await pattern.getActiveTasks();
      setActiveTasks(tasks);
    } catch (err) {
      setError(err as Error);
    }
  }, [pattern, isRegistered]);

  // Refresh opportunities
  const refreshOpportunities = useCallback(async () => {
    if (!pattern || !isRegistered) return;

    try {
      const opps = await pattern.findOpportunities();
      setOpportunities(opps);
    } catch (err) {
      setError(err as Error);
    }
  }, [pattern, isRegistered]);

  // Register as provider
  const register = useCallback(
    async (params: { stake: bigint; hardwareSpec: HardwareSpec }): Promise<void> => {
      if (!pattern) throw new Error('Client not initialized');

      try {
        setIsLoading(true);
        setError(null);
        await pattern.startMining(params);
        setIsRegistered(true);
        await refreshStats();
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [pattern, refreshStats]
  );

  // Find opportunities
  const findOpportunities = useCallback(
    async (preferences?: {
      minReward?: bigint;
      preferredModelTypes?: ModelType[];
      maxConcurrentTasks?: number;
    }): Promise<void> => {
      if (!pattern) throw new Error('Client not initialized');

      try {
        setIsLoading(true);
        setError(null);
        const opps = await pattern.findOpportunities(preferences);
        setOpportunities(opps);
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [pattern]
  );

  // Join task
  const joinTask = useCallback(
    async (taskId: string): Promise<void> => {
      if (!pattern) throw new Error('Client not initialized');

      try {
        setIsLoading(true);
        setError(null);
        await pattern.joinTask(taskId);
        await refreshStats();
        await refreshOpportunities();
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [pattern, refreshStats, refreshOpportunities]
  );

  // Claim rewards
  const claimRewards = useCallback(async (): Promise<bigint> => {
    if (!pattern) throw new Error('Client not initialized');

    try {
      setIsLoading(true);
      setError(null);
      const amount = await pattern.claimRewards();
      await refreshStats();
      return amount;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [pattern, refreshStats]);

  // Update hardware
  const updateHardware = useCallback(
    async (hardwareSpec: HardwareSpec): Promise<void> => {
      if (!pattern) throw new Error('Client not initialized');

      try {
        setIsLoading(true);
        setError(null);
        await pattern.updateHardware(hardwareSpec);
        await refreshStats();
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [pattern, refreshStats]
  );

  // Stop mining
  const stopMining = useCallback(async (): Promise<void> => {
    if (!pattern) throw new Error('Client not initialized');

    try {
      setIsLoading(true);
      setError(null);
      await pattern.stopMining();
      await refreshStats();
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [pattern, refreshStats]);

  // Withdraw stake
  const withdrawStake = useCallback(async (): Promise<bigint> => {
    if (!pattern) throw new Error('Client not initialized');

    try {
      setIsLoading(true);
      setError(null);
      const amount = await pattern.withdrawStake();
      setIsRegistered(false);
      await refreshStats();
      return amount;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [pattern, refreshStats]);

  // Check registration on mount
  useEffect(() => {
    checkRegistration();
  }, [checkRegistration]);

  // Auto-refresh
  useEffect(() => {
    if (!options.autoRefresh || !isRegistered) return;

    const interval = setInterval(() => {
      refreshStats();
      refreshOpportunities();
    }, options.refreshIntervalMs || 30000); // Default 30s

    return () => clearInterval(interval);
  }, [options.autoRefresh, options.refreshIntervalMs, isRegistered, refreshStats, refreshOpportunities]);

  return {
    isRegistered,
    stats,
    opportunities,
    activeTasks,
    isLoading,
    error,
    register,
    findOpportunities,
    joinTask,
    claimRewards,
    updateHardware,
    stopMining,
    withdrawStake,
    refreshStats,
    refreshOpportunities
  };
}
