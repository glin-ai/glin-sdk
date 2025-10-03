import { useState, useCallback, useEffect } from 'react';
import { useGlinClient } from './useGlinClient';
import { useGlinSigner } from './useGlinSigner';
import {
  FederatedLearningPattern,
  type FederatedTask,
  type HardwareRequirements,
  type ModelType,
  type ProviderReward
} from '@glin-ai/sdk';

export interface UseFederatedTaskOptions {
  taskId?: string;
}

export interface CreateTaskParams {
  name: string;
  modelType: ModelType;
  bounty: bigint;
  minProviders: number;
  maxProviders: number;
  hardwareRequirements: HardwareRequirements;
  initialModelIpfs: string;
}

export interface UseFederatedTaskResult {
  // State
  task: FederatedTask | null;
  providers: string[];
  rewards: ProviderReward[];
  isLoading: boolean;
  error: Error | null;

  // Actions
  createTask: (params: CreateTaskParams) => Promise<string>;
  startRecruiting: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  cancelTask: (taskId: string) => Promise<bigint>;
  refreshTask: () => Promise<void>;
  refreshProviders: () => Promise<void>;
  refreshRewards: () => Promise<void>;
}

/**
 * React hook for managing federated learning tasks
 * Provides easy interface for task creation, monitoring, and completion
 */
export function useFederatedTask(options: UseFederatedTaskOptions = {}): UseFederatedTaskResult {
  const { client } = useGlinClient();
  const { signer, address } = useGlinSigner();

  const [task, setTask] = useState<FederatedTask | null>(null);
  const [providers, setProviders] = useState<string[]>([]);
  const [rewards, setRewards] = useState<ProviderReward[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize pattern
  const pattern = client && signer && address && client.getApi()
    ? new FederatedLearningPattern(client.getApi()!, signer, address)
    : null;

  // Load task data
  const refreshTask = useCallback(async () => {
    if (!pattern || !options.taskId) return;

    try {
      setIsLoading(true);
      setError(null);
      const taskData = await pattern.getTask(options.taskId);
      setTask(taskData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [pattern, options.taskId]);

  // Load providers
  const refreshProviders = useCallback(async () => {
    if (!pattern || !options.taskId) return;

    try {
      const providersList = await pattern.getTaskProviders(options.taskId);
      setProviders(providersList);
    } catch (err) {
      setError(err as Error);
    }
  }, [pattern, options.taskId]);

  // Load rewards
  const refreshRewards = useCallback(async () => {
    if (!pattern || !options.taskId) return;

    try {
      const rewardsList = await pattern.getTaskRewards(options.taskId);
      setRewards(rewardsList);
    } catch (err) {
      setError(err as Error);
    }
  }, [pattern, options.taskId]);

  // Create task
  const createTask = useCallback(
    async (params: CreateTaskParams): Promise<string> => {
      if (!pattern) throw new Error('Client not initialized');

      try {
        setIsLoading(true);
        setError(null);

        const taskId = await pattern.createAndLaunchTask({
          api: client!.getApi()!,
          signer: signer!,
          signerAddress: address,
          taskName: params.name,
          modelType: params.modelType,
          bounty: params.bounty,
          minProviders: params.minProviders,
          maxProviders: params.maxProviders,
          hardwareRequirements: params.hardwareRequirements,
          initialModelIpfs: params.initialModelIpfs
        });

        return taskId;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [pattern, client, signer]
  );

  // Start recruiting
  const startRecruiting = useCallback(
    async (taskId: string): Promise<void> => {
      if (!pattern) throw new Error('Client not initialized');

      try {
        setIsLoading(true);
        setError(null);
        // Pattern already starts recruiting in createAndLaunchTask
        // This is for manual control if needed
        await refreshTask();
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [pattern, refreshTask]
  );

  // Complete task
  const completeTask = useCallback(
    async (taskId: string): Promise<void> => {
      if (!pattern) throw new Error('Client not initialized');

      try {
        setIsLoading(true);
        setError(null);
        // In production, would pass actual gradient submissions
        await pattern.completeAndDistributeRewards(taskId, [], [address!]);
        await refreshTask();
        await refreshRewards();
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [pattern, address, refreshTask, refreshRewards]
  );

  // Cancel task
  const cancelTask = useCallback(
    async (taskId: string): Promise<bigint> => {
      if (!pattern) throw new Error('Client not initialized');

      try {
        setIsLoading(true);
        setError(null);
        const refunded = await pattern.cancelTask(taskId);
        await refreshTask();
        return refunded;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [pattern, refreshTask]
  );

  // Auto-refresh task data when taskId changes
  useEffect(() => {
    if (options.taskId) {
      refreshTask();
      refreshProviders();
      refreshRewards();
    }
  }, [options.taskId, refreshTask, refreshProviders, refreshRewards]);

  return {
    task,
    providers,
    rewards,
    isLoading,
    error,
    createTask,
    startRecruiting,
    completeTask,
    cancelTask,
    refreshTask,
    refreshProviders,
    refreshRewards
  };
}
