import type { ApiPromise } from '@polkadot/api';
import { ProviderWorkflow } from '../workflows/ProviderWorkflow';
import { RewardWorkflow } from '../workflows/RewardWorkflow';
import type { GlinSigner } from '../types';
import { isKeyringPair } from '../types';
import type {
  HardwareSpec,
  FederatedTask,
  ModelType,
  GradientSubmission,
  QualityMetrics
} from '../types/federated';

export interface MiningConfig {
  api: ApiPromise;
  signer: GlinSigner;
  signerAddress?: string;
  stake: bigint;
  hardwareSpec: HardwareSpec;
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

export interface GradientComputationParams {
  taskId: string;
  round: number;
  modelIpfs: string;
  localDataset: any; // Placeholder for dataset
  epochs?: number;
}

/**
 * High-level pattern for GPU providers to participate in mining.
 * Combines ProviderWorkflow and RewardWorkflow to provide a complete
 * mining experience including task discovery, participation, and reward claiming.
 */
export class ProviderMiningPattern {
  private providerWorkflow: ProviderWorkflow;
  private rewardWorkflow: RewardWorkflow;

  constructor(
    private api: ApiPromise,
    private signer: GlinSigner,
    private signerAddress?: string
  ) {
    this.providerWorkflow = new ProviderWorkflow(api, signer, signerAddress);
    this.rewardWorkflow = new RewardWorkflow(api, signer, signerAddress);
  }

  /**
   * Register and start mining
   * @param config - Mining configuration
   */
  async startMining(config: { stake: bigint; hardwareSpec: HardwareSpec }): Promise<void> {
    await this.providerWorkflow.register({
      stake: config.stake,
      hardwareSpec: config.hardwareSpec
    });
  }

  /**
   * Find profitable mining opportunities
   * @param preferences - Mining preferences
   * @returns Array of ranked opportunities
   */
  async findOpportunities(preferences?: {
    minReward?: bigint;
    preferredModelTypes?: ModelType[];
    maxConcurrentTasks?: number;
  }): Promise<MiningOpportunity[]> {
    // Get provider's hardware spec
    const providerInfo = await this.providerWorkflow.getProviderInfo();
    if (!providerInfo) {
      throw new Error('Provider not registered');
    }

    // Find matching tasks
    const tasks = await this.providerWorkflow.findMatchingTasks({
      minBounty: preferences?.minReward,
      modelTypes: preferences?.preferredModelTypes,
      maxVramRequired: providerInfo.hardwareSpec.vramGb,
      status: ['Recruiting', 'Running']
    });

    // Calculate opportunities with estimated rewards
    const opportunities: MiningOpportunity[] = [];

    for (const task of tasks) {
      const providers = await this.providerWorkflow.getActiveTasks();
      const estimatedProviders = Math.max(task.minProviders, providers.length + 1);

      // Simple reward estimation: bounty / providers, adjusted for hardware tier
      const hardwareMultiplier = this.getHardwareMultiplier(providerInfo.hardwareSpec.tier);
      const baseReward = BigInt(task.bounty) / BigInt(estimatedProviders);
      const estimatedReward = (baseReward * BigInt(hardwareMultiplier)) / 100n;

      // Estimate competition level
      const providerRatio = providers.length / task.maxProviders;
      const competitionLevel =
        providerRatio < 0.5 ? 'Low' : providerRatio < 0.8 ? 'Medium' : 'High';

      // Check if task fits hardware
      const fitsHardware = await this.providerWorkflow.meetsRequirements(task.id);

      opportunities.push({
        task,
        estimatedReward,
        competitionLevel,
        fitsHardware,
        rewardPerRound: estimatedReward / 10n // Assume ~10 rounds per task
      });
    }

    // Sort by estimated reward (descending)
    return opportunities.sort((a, b) => Number(b.estimatedReward - a.estimatedReward));
  }

  /**
   * Join a mining task
   * @param taskId - Task ID to join
   */
  async joinTask(taskId: string): Promise<void> {
    // Verify provider meets requirements
    const meetsReq = await this.providerWorkflow.meetsRequirements(taskId);
    if (!meetsReq) {
      throw new Error('Provider does not meet task hardware requirements');
    }

    await this.providerWorkflow.joinTask(taskId);
  }

  /**
   * Compute gradients for a training round (placeholder)
   * In production, this would integrate with actual ML framework
   *
   * @param params - Gradient computation parameters
   * @returns Gradient submission ready for blockchain
   */
  async computeGradients(params: GradientComputationParams): Promise<GradientSubmission> {
    const providerInfo = await this.providerWorkflow.getProviderInfo();
    if (!providerInfo) {
      throw new Error('Provider not registered');
    }

    // Placeholder: In production, this would:
    // 1. Download model from IPFS (params.modelIpfs)
    // 2. Load local dataset (params.localDataset)
    // 3. Train for specified epochs (params.epochs || 1)
    // 4. Extract gradients
    // 5. Compress and upload to IPFS
    // 6. Generate quality metrics

    // Simulate gradient computation
    const qualityMetrics: QualityMetrics = {
      lossValue: 0.15 + Math.random() * 0.1, // Simulated loss
      gradientNorm: 0.05 + Math.random() * 0.03,
      convergenceScore: 850 + Math.floor(Math.random() * 100) // 850-950
    };

    // Placeholder IPFS hash
    const gradientsIpfs = `QmGradient${params.taskId}R${params.round}`;

    const address = isKeyringPair(this.signer) ? this.signer.address : this.signerAddress;
    if (!address) {
      throw new Error('Provider address required');
    }

    return {
      taskId: params.taskId,
      provider: address,
      round: params.round,
      gradientsIpfs,
      qualityMetrics
    };
  }

  /**
   * Get mining statistics for the provider
   * @returns Mining statistics
   */
  async getMiningStats(): Promise<MiningStats> {
    const providerInfo = await this.providerWorkflow.getProviderInfo();
    if (!providerInfo) {
      throw new Error('Provider not registered');
    }

    const address = isKeyringPair(this.signer) ? this.signer.address : this.signerAddress;
    if (!address) {
      throw new Error('Provider address required');
    }

    const claimableRewards = await this.rewardWorkflow.getClaimableRewards(address);

    // Calculate average quality score from completed tasks
    // Placeholder: would aggregate from historical data
    const averageQualityScore = 900; // Placeholder

    return {
      totalTasksCompleted: providerInfo.totalTasksCompleted,
      totalRewardsEarned: claimableRewards.totalClaimable, // Placeholder: should include claimed
      averageQualityScore,
      currentReputation: providerInfo.reputation,
      activeTasks: providerInfo.activeTasks,
      claimableRewards: claimableRewards.totalClaimable
    };
  }

  /**
   * Claim all pending rewards
   * @returns Amount claimed
   */
  async claimRewards(): Promise<bigint> {
    return this.rewardWorkflow.claimRewards();
  }

  /**
   * Update hardware specifications (e.g., after GPU upgrade)
   * @param hardwareSpec - New hardware specs
   */
  async updateHardware(hardwareSpec: HardwareSpec): Promise<void> {
    await this.providerWorkflow.updateHardware(hardwareSpec);
  }

  /**
   * Stop mining and start unbonding stake
   */
  async stopMining(): Promise<void> {
    await this.providerWorkflow.startUnbonding();
  }

  /**
   * Withdraw stake after unbonding period
   * @returns Amount withdrawn
   */
  async withdrawStake(): Promise<bigint> {
    return this.providerWorkflow.withdrawStake();
  }

  /**
   * Get hardware tier multiplier for reward calculations
   * @param tier - Hardware tier
   * @returns Multiplier (100 = 1.0x)
   */
  private getHardwareMultiplier(tier: 'Consumer' | 'Prosumer' | 'Professional'): number {
    switch (tier) {
      case 'Consumer': // RTX 3060-3090
        return 100;
      case 'Prosumer': // RTX 4070-4090
        return 150;
      case 'Professional': // A100, H100
        return 200;
    }
  }

  /**
   * Auto-mining mode: Automatically find and join profitable tasks
   * @param options - Auto-mining options
   * @returns Stop function
   */
  async enableAutoMining(options: {
    minReward?: bigint;
    maxConcurrentTasks?: number;
    preferredModelTypes?: ModelType[];
    checkIntervalMs?: number;
  }): Promise<() => void> {
    const maxConcurrent = options.maxConcurrentTasks || 3;
    const checkInterval = options.checkIntervalMs || 60000; // 1 minute default

    let running = true;

    const autoMineLoop = async () => {
      while (running) {
        try {
          // Get current active tasks
          const activeTasks = await this.providerWorkflow.getActiveTasks();

          // If below max concurrent, find new opportunities
          if (activeTasks.length < maxConcurrent) {
            const opportunities = await this.findOpportunities({
              minReward: options.minReward,
              preferredModelTypes: options.preferredModelTypes,
              maxConcurrentTasks: maxConcurrent
            });

            // Join top opportunity if available
            const topOpportunity = opportunities.find(o => o.fitsHardware);
            if (topOpportunity) {
              await this.joinTask(topOpportunity.task.id);
            }
          }
        } catch (error) {
          console.error('Auto-mining error:', error);
        }

        // Wait for next check
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
    };

    // Start the loop
    autoMineLoop();

    // Return stop function
    return () => {
      running = false;
    };
  }

  /**
   * Get provider's current active tasks with details
   * @returns Array of active tasks
   */
  async getActiveTasks(): Promise<FederatedTask[]> {
    const taskIds = await this.providerWorkflow.getActiveTasks();
    const tasks: FederatedTask[] = [];

    for (const taskId of taskIds) {
      const taskDataRaw: any = await this.api.query.taskRegistry.tasks(taskId);
      if (taskDataRaw.isNone) continue;

      const taskData = taskDataRaw.unwrap();
      tasks.push({
        id: taskId,
        creator: taskData.creator.toString(),
        name: taskData.name.toUtf8(),
        modelType: taskData.modelType.toString() as any,
        bounty: taskData.bounty.toString(),
        minProviders: taskData.minProviders.toNumber(),
        maxProviders: taskData.maxProviders.toNumber(),
        status: taskData.status.toString() as any,
        ipfsHash: taskData.ipfsHash.toUtf8(),
        hardwareRequirements: {
          minVramGb: taskData.hardwareRequirements.minVramGb.toNumber(),
          minComputeCapability: taskData.hardwareRequirements.minComputeCapability.toNumber(),
          minBandwidthMbps: taskData.hardwareRequirements.minBandwidthMbps.toNumber()
        },
        createdAt: taskData.createdAt.toNumber(),
        completedAt: taskData.completedAt.isSome ? taskData.completedAt.unwrap().toNumber() : undefined
      });
    }

    return tasks;
  }
}
