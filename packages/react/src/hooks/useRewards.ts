import { useState, useCallback, useEffect } from 'react';
import { useGlinClient } from './useGlinClient';
import { useAccount } from './useAccount';
import {
  RewardWorkflow,
  type RewardBatch,
  type ProviderReward
} from '@glin-ai/sdk';

export interface UseRewardsOptions {
  taskId?: string;
  batchId?: string;
  providerAddress?: string;
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
}

export interface ClaimableRewards {
  provider: string;
  totalClaimable: bigint;
  rewardsByTask: Map<string, bigint>;
}

export interface UseRewardsResult {
  // State
  batch: RewardBatch | null;
  taskRewards: ProviderReward[];
  claimableRewards: ClaimableRewards | null;
  isLoading: boolean;
  error: Error | null;

  // Actions
  createBatch: (params: {
    taskId: string;
    totalReward: bigint;
    validators: string[];
  }) => Promise<string>;
  submitRewards: (params: {
    batchId: string;
    rewards: Array<{
      provider: string;
      amount: bigint;
      gradientsContributed: number;
      qualityScore: number;
      hardwareMultiplier: number;
    }>;
  }) => Promise<void>;
  settleBatch: (batchId: string) => Promise<void>;
  claimRewards: (providerAddress?: string) => Promise<bigint>;
  refreshBatch: () => Promise<void>;
  refreshTaskRewards: () => Promise<void>;
  refreshClaimableRewards: () => Promise<void>;
}

/**
 * React hook for managing reward distribution
 * Provides interface for batch creation, settlement, and claiming
 */
export function useRewards(options: UseRewardsOptions = {}): UseRewardsResult {
  const { client } = useGlinClient();
  const { signer } = useAccount();

  const [batch, setBatch] = useState<RewardBatch | null>(null);
  const [taskRewards, setTaskRewards] = useState<ProviderReward[]>([]);
  const [claimableRewards, setClaimableRewards] = useState<ClaimableRewards | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize workflow
  const workflow = client && signer ? new RewardWorkflow(client, signer) : null;

  // Refresh batch
  const refreshBatch = useCallback(async () => {
    if (!workflow || !options.batchId) return;

    try {
      setIsLoading(true);
      setError(null);
      const batchData = await workflow.getBatch(options.batchId);
      setBatch(batchData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [workflow, options.batchId]);

  // Refresh task rewards
  const refreshTaskRewards = useCallback(async () => {
    if (!workflow || !options.taskId) return;

    try {
      const rewards = await workflow.getTaskRewards(options.taskId);
      setTaskRewards(rewards);
    } catch (err) {
      setError(err as Error);
    }
  }, [workflow, options.taskId]);

  // Refresh claimable rewards
  const refreshClaimableRewards = useCallback(async () => {
    if (!workflow) return;

    const address = options.providerAddress || signer?.address;
    if (!address) return;

    try {
      const claimable = await workflow.getClaimableRewards(address);
      setClaimableRewards(claimable);
    } catch (err) {
      setError(err as Error);
    }
  }, [workflow, options.providerAddress, signer]);

  // Create batch
  const createBatch = useCallback(
    async (params: {
      taskId: string;
      totalReward: bigint;
      validators: string[];
    }): Promise<string> => {
      if (!workflow) throw new Error('Client not initialized');

      try {
        setIsLoading(true);
        setError(null);
        const batchId = await workflow.createBatch(params);
        return batchId;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [workflow]
  );

  // Submit rewards
  const submitRewards = useCallback(
    async (params: {
      batchId: string;
      rewards: Array<{
        provider: string;
        amount: bigint;
        gradientsContributed: number;
        qualityScore: number;
        hardwareMultiplier: number;
      }>;
    }): Promise<void> => {
      if (!workflow) throw new Error('Client not initialized');

      try {
        setIsLoading(true);
        setError(null);
        await workflow.submitRewards(params);
        await refreshBatch();
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [workflow, refreshBatch]
  );

  // Settle batch
  const settleBatch = useCallback(
    async (batchId: string): Promise<void> => {
      if (!workflow) throw new Error('Client not initialized');

      try {
        setIsLoading(true);
        setError(null);
        await workflow.settleBatch(batchId);
        await refreshBatch();
        await refreshClaimableRewards();
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [workflow, refreshBatch, refreshClaimableRewards]
  );

  // Claim rewards
  const claimRewards = useCallback(
    async (providerAddress?: string): Promise<bigint> => {
      if (!workflow) throw new Error('Client not initialized');

      try {
        setIsLoading(true);
        setError(null);
        const amount = await workflow.claimRewards(providerAddress);
        await refreshClaimableRewards();
        return amount;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [workflow, refreshClaimableRewards]
  );

  // Auto-refresh batch data when batchId changes
  useEffect(() => {
    if (options.batchId) {
      refreshBatch();
    }
  }, [options.batchId, refreshBatch]);

  // Auto-refresh task rewards when taskId changes
  useEffect(() => {
    if (options.taskId) {
      refreshTaskRewards();
    }
  }, [options.taskId, refreshTaskRewards]);

  // Auto-refresh claimable rewards when provider address changes
  useEffect(() => {
    if (options.providerAddress || signer?.address) {
      refreshClaimableRewards();
    }
  }, [options.providerAddress, signer, refreshClaimableRewards]);

  // Auto-refresh
  useEffect(() => {
    if (!options.autoRefresh) return;

    const interval = setInterval(() => {
      if (options.batchId) refreshBatch();
      if (options.taskId) refreshTaskRewards();
      refreshClaimableRewards();
    }, options.refreshIntervalMs || 30000); // Default 30s

    return () => clearInterval(interval);
  }, [
    options.autoRefresh,
    options.refreshIntervalMs,
    options.batchId,
    options.taskId,
    refreshBatch,
    refreshTaskRewards,
    refreshClaimableRewards
  ]);

  return {
    batch,
    taskRewards,
    claimableRewards,
    isLoading,
    error,
    createBatch,
    submitRewards,
    settleBatch,
    claimRewards,
    refreshBatch,
    refreshTaskRewards,
    refreshClaimableRewards
  };
}
