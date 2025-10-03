import { ApiPromise } from '@polkadot/api';
import type { KeyringPair } from '@polkadot/keyring/types';
import { TaskCreatorWorkflow } from '../workflows/TaskCreatorWorkflow';
import { ProviderWorkflow } from '../workflows/ProviderWorkflow';
import { RewardWorkflow } from '../workflows/RewardWorkflow';
import type {
  FederatedTask,
  HardwareRequirements,
  ModelType,
  GradientSubmission,
  ProviderReward
} from '../types/federated';

export interface FederatedLearningConfig {
  api: ApiPromise;
  signer: KeyringPair;
  taskName: string;
  modelType: ModelType;
  bounty: bigint;
  minProviders: number;
  maxProviders: number;
  hardwareRequirements: HardwareRequirements;
  initialModelIpfs: string;
}

export interface TrainingProgress {
  taskId: string;
  currentRound: number;
  totalProviders: number;
  gradientsReceived: number;
  status: 'Recruiting' | 'Running' | 'Validating' | 'Completed';
}

export interface GradientAggregationResult {
  round: number;
  aggregatedGradientsIpfs: string;
  averageQuality: number;
  participatingProviders: number;
}

/**
 * High-level pattern for federated learning task creation and management.
 * Combines TaskCreatorWorkflow and RewardWorkflow to provide a complete
 * end-to-end experience for task creators.
 */
export class FederatedLearningPattern {
  private taskWorkflow: TaskCreatorWorkflow;
  private rewardWorkflow: RewardWorkflow;

  constructor(
    private api: ApiPromise,
    private signer: KeyringPair
  ) {
    this.taskWorkflow = new TaskCreatorWorkflow(api, signer);
    this.rewardWorkflow = new RewardWorkflow(api, signer);
  }

  /**
   * Create and launch a federated learning task
   * @param config - Task configuration
   * @returns Task ID
   */
  async createAndLaunchTask(config: FederatedLearningConfig): Promise<string> {
    // Create the task
    const taskId = await this.taskWorkflow.createTask({
      name: config.taskName,
      modelType: config.modelType,
      bounty: config.bounty,
      minProviders: config.minProviders,
      maxProviders: config.maxProviders,
      initialModelIpfs: config.initialModelIpfs,
      hardwareRequirements: config.hardwareRequirements
    });

    // Start recruiting immediately
    await this.taskWorkflow.startRecruiting(taskId);

    return taskId;
  }

  /**
   * Monitor training progress with real-time updates
   * @param taskId - Task ID to monitor
   * @param onProgress - Callback for progress updates
   * @param onComplete - Callback when training completes
   * @returns Unsubscribe function
   */
  async monitorTraining(
    taskId: string,
    onProgress: (progress: TrainingProgress) => void,
    onComplete: (task: FederatedTask) => void
  ): Promise<() => void> {
    return this.taskWorkflow.monitorTask(taskId, {
      onProviderJoin: async (provider: string) => {
        const providers = await this.taskWorkflow.getTaskProviders(taskId);
        const task = await this.taskWorkflow.getTask(taskId);
        if (task) {
          onProgress({
            taskId,
            currentRound: 0,
            totalProviders: providers.length,
            gradientsReceived: 0,
            status: task.status === 'Recruiting' ? 'Recruiting' : 'Running'
          });
        }
      },
      onTaskComplete: async (finalModelIpfs: string) => {
        const task = await this.taskWorkflow.getTask(taskId);
        if (task) {
          onComplete(task);
        }
      }
    });
  }

  /**
   * Complete training and distribute rewards
   * @param taskId - Task ID
   * @param gradientSubmissions - All gradient submissions received
   * @param validators - Validator addresses for reward verification
   * @returns Batch ID for reward distribution
   */
  async completeAndDistributeRewards(
    taskId: string,
    gradientSubmissions: GradientSubmission[],
    validators: string[]
  ): Promise<string> {
    // Mark task as complete
    await this.taskWorkflow.completeTask(taskId);

    // Get task details for bounty amount
    const task = await this.taskWorkflow.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Calculate rewards based on contributions
    const providerContributions = this.aggregateProviderContributions(gradientSubmissions);

    const rewardCalculations = this.rewardWorkflow.calculateRewards({
      totalReward: BigInt(task.bounty),
      providers: providerContributions
    });

    // Create reward batch
    const batchId = await this.rewardWorkflow.createBatch({
      taskId,
      totalReward: BigInt(task.bounty),
      validators
    });

    // Submit calculated rewards
    await this.rewardWorkflow.submitRewards({
      batchId,
      rewards: rewardCalculations.map(r => ({
        provider: r.provider,
        amount: r.totalReward,
        gradientsContributed: providerContributions.find(p => p.address === r.provider)!.gradientsContributed,
        qualityScore: r.qualityScore,
        hardwareMultiplier: r.hardwareMultiplier
      }))
    });

    // Settle batch (assuming sufficient validator consensus)
    await this.rewardWorkflow.settleBatch(batchId);

    return batchId;
  }

  /**
   * Aggregate gradient submissions by provider
   * @param submissions - All gradient submissions
   * @returns Provider contribution statistics
   */
  private aggregateProviderContributions(submissions: GradientSubmission[]): Array<{
    address: string;
    gradientsContributed: number;
    qualityScore: number;
    hardwareMultiplier: number;
  }> {
    const providerMap = new Map<string, {
      gradientsCount: number;
      totalQuality: number;
      hardwareMultiplier: number;
    }>();

    // Aggregate submissions by provider
    for (const submission of submissions) {
      const existing = providerMap.get(submission.provider) || {
        gradientsCount: 0,
        totalQuality: 0,
        hardwareMultiplier: 100
      };

      providerMap.set(submission.provider, {
        gradientsCount: existing.gradientsCount + 1,
        totalQuality: existing.totalQuality + submission.qualityMetrics.convergenceScore,
        hardwareMultiplier: 100 // Default multiplier, would be fetched from provider info
      });
    }

    // Calculate averages
    return Array.from(providerMap.entries()).map(([address, stats]) => ({
      address,
      gradientsContributed: stats.gradientsCount,
      qualityScore: Math.floor(stats.totalQuality / stats.gradientsCount),
      hardwareMultiplier: stats.hardwareMultiplier
    }));
  }

  /**
   * Get current providers for a task
   * @param taskId - Task ID
   * @returns Array of provider addresses
   */
  async getTaskProviders(taskId: string): Promise<string[]> {
    return this.taskWorkflow.getTaskProviders(taskId);
  }

  /**
   * Get task details
   * @param taskId - Task ID
   * @returns Task information
   */
  async getTask(taskId: string): Promise<FederatedTask | null> {
    return this.taskWorkflow.getTask(taskId);
  }

  /**
   * Cancel a task and refund bounty
   * @param taskId - Task ID
   * @returns Refunded amount
   */
  async cancelTask(taskId: string): Promise<bigint> {
    return this.taskWorkflow.cancelTask(taskId);
  }

  /**
   * Get reward distribution for a completed task
   * @param taskId - Task ID
   * @returns Array of provider rewards
   */
  async getTaskRewards(taskId: string): Promise<ProviderReward[]> {
    return this.rewardWorkflow.getTaskRewards(taskId);
  }

  /**
   * Simulate federated averaging aggregation
   * This is a client-side helper for gradient aggregation
   *
   * @param submissions - Gradient submissions to aggregate
   * @returns Aggregation result with weighted average
   */
  async simulateAggregation(submissions: GradientSubmission[]): Promise<GradientAggregationResult> {
    if (submissions.length === 0) {
      throw new Error('No submissions to aggregate');
    }

    const round = submissions[0].round;
    const totalQuality = submissions.reduce((sum, s) => sum + s.qualityMetrics.convergenceScore, 0);
    const averageQuality = totalQuality / submissions.length;

    // In real implementation, this would:
    // 1. Download gradient files from IPFS
    // 2. Perform weighted averaging based on quality scores
    // 3. Upload aggregated gradients to IPFS
    //
    // For now, return placeholder
    return {
      round,
      aggregatedGradientsIpfs: 'QmAggregatedGradients...',
      averageQuality: Math.floor(averageQuality),
      participatingProviders: submissions.length
    };
  }

  /**
   * End-to-end federated learning workflow
   * Creates task, monitors progress, and distributes rewards automatically
   *
   * @param config - Task configuration
   * @param options - Workflow options
   * @returns Task ID and final results
   */
  async runFederatedLearning(
    config: FederatedLearningConfig,
    options: {
      onProgress?: (progress: TrainingProgress) => void;
      validators: string[];
      maxRounds?: number;
    }
  ): Promise<{
    taskId: string;
    batchId: string;
    finalTask: FederatedTask;
    rewards: ProviderReward[];
  }> {
    // Step 1: Create and launch task
    const taskId = await this.createAndLaunchTask(config);

    // Step 2: Monitor progress
    const gradientSubmissions: GradientSubmission[] = [];

    await new Promise<void>((resolve) => {
      this.monitorTraining(
        taskId,
        (progress) => {
          if (options.onProgress) {
            options.onProgress(progress);
          }
        },
        () => {
          resolve();
        }
      );
    });

    // Step 3: Complete and distribute rewards
    const batchId = await this.completeAndDistributeRewards(
      taskId,
      gradientSubmissions,
      options.validators
    );

    // Step 4: Get final results
    const finalTask = await this.getTask(taskId);
    const rewards = await this.getTaskRewards(taskId);

    return {
      taskId,
      batchId,
      finalTask: finalTask!,
      rewards
    };
  }
}
