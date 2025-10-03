import type { ApiPromise } from '@polkadot/api';
import type { SubmittableExtrinsic, SubmittableResultValue } from '@polkadot/api/types';
import type { EventRecord } from '@polkadot/types/interfaces';
import type { RewardBatch, ProviderReward } from '../types/federated';
import type { GlinSigner } from '../types';
import { isKeyringPair } from '../types';

export interface CreateBatchParams {
  taskId: string;
  totalReward: bigint;
  validators: string[];
}

export interface SubmitRewardsParams {
  batchId: string;
  rewards: Array<{
    provider: string;
    amount: bigint;
    gradientsContributed: number;
    qualityScore: number;
    hardwareMultiplier: number;
  }>;
}

export interface RewardCalculation {
  provider: string;
  baseReward: bigint;
  qualityBonus: bigint;
  hardwareBonus: bigint;
  totalReward: bigint;
  qualityScore: number;
  hardwareMultiplier: number;
}

export interface ClaimableRewards {
  provider: string;
  totalClaimable: bigint;
  rewardsByTask: Map<string, bigint>;
}

/**
 * High-level workflow for managing reward distribution in federated learning tasks.
 * Handles batch creation, reward submission, settlement, and claiming.
 */
export class RewardWorkflow {
  constructor(
    private api: ApiPromise,
    private signer?: GlinSigner,
    private signerAddress?: string
  ) {}

  /**
   * Helper to sign and send transaction
   * Handles both KeyringPair and InjectedSigner
   */
  private async signAndSend(
    tx: SubmittableExtrinsic<'promise'>,
    callback: (result: SubmittableResultValue) => void
  ) {
    if (!this.signer) {
      throw new Error('Signer required')
    }

    if (isKeyringPair(this.signer)) {
      // Direct signer (KeyringPair)
      return tx.signAndSend(this.signer, callback)
    } else {
      // Extension signer (InjectedSigner)
      if (!this.signerAddress) {
        throw new Error('Address required for extension signer')
      }
      return tx.signAndSend(this.signerAddress, { signer: this.signer }, callback)
    }
  }

  /**
   * Create a reward batch for a completed task
   * @param params - Batch creation parameters
   * @returns Batch ID
   */
  async createBatch(params: CreateBatchParams): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required to create reward batch');
    }

    const tx = this.api.tx.rewardDistribution.createBatch(
      params.taskId,
      params.totalReward,
      params.validators
    );

    return new Promise<string>((resolve, reject) => {
      this.signAndSend(tx, (result) => {
        if (result.status.isInBlock) {
          const batchCreatedEvent = result.events?.find(
            (record: EventRecord) =>
              record.event.section === 'rewardDistribution' && record.event.method === 'BatchCreated'
          );

          if (batchCreatedEvent) {
            const batchId = batchCreatedEvent.event.data[0].toString();
            resolve(batchId);
          } else {
            reject(new Error('Failed to create reward batch'));
          }
        }
      }).catch(reject);
    });
  }

  /**
   * Submit reward calculations for providers in a batch
   * @param params - Reward submission parameters
   */
  async submitRewards(params: SubmitRewardsParams): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required to submit rewards');
    }

    const rewards = params.rewards.map(r => ({
      provider: r.provider,
      amount: r.amount,
      gradientsContributed: r.gradientsContributed,
      qualityScore: r.qualityScore,
      hardwareMultiplier: r.hardwareMultiplier
    }));

    const tx = this.api.tx.rewardDistribution.submitRewards(params.batchId, rewards);

    await new Promise<void>((resolve, reject) => {
      this.signAndSend(tx, (result) => {
        if (result.status.isInBlock) {
          const rewardsSubmittedEvent = result.events?.find(
            (record: EventRecord) =>
              record.event.section === 'rewardDistribution' && record.event.method === 'RewardsSubmitted'
          );

          if (rewardsSubmittedEvent) {
            resolve();
          } else {
            reject(new Error('Failed to submit rewards'));
          }
        }
      }).catch(reject);
    });
  }

  /**
   * Settle a reward batch after all validators have submitted
   * @param batchId - Batch ID to settle
   */
  async settleBatch(batchId: string): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required to settle batch');
    }

    const tx = this.api.tx.rewardDistribution.settleBatch(batchId);

    await new Promise<void>((resolve, reject) => {
      this.signAndSend(tx, (result) => {
        if (result.status.isInBlock) {
          const batchSettledEvent = result.events?.find(
            (record: EventRecord) =>
              record.event.section === 'rewardDistribution' && record.event.method === 'BatchSettled'
          );

          if (batchSettledEvent) {
            resolve();
          } else {
            reject(new Error('Failed to settle batch'));
          }
        }
      }).catch(reject);
    });
  }

  /**
   * Claim rewards for a provider
   * @param providerAddress - Provider's address (defaults to signer's address)
   * @returns Amount claimed
   */
  async claimRewards(providerAddress?: string): Promise<bigint> {
    if (!this.signer) {
      throw new Error('Signer required to claim rewards');
    }

    const address = providerAddress || (isKeyringPair(this.signer) ? this.signer.address : this.signerAddress);
    if (!address) {
      throw new Error('Provider address required');
    }

    const tx = this.api.tx.rewardDistribution.claimRewards(address);

    return new Promise<bigint>((resolve, reject) => {
      this.signAndSend(tx, (result) => {
        if (result.status.isInBlock) {
          const rewardsClaimedEvent = result.events?.find(
            (record: EventRecord) =>
              record.event.section === 'rewardDistribution' && record.event.method === 'RewardsClaimed'
          );

          if (rewardsClaimedEvent) {
            const amount = rewardsClaimedEvent.event.data[1].toString();
            resolve(BigInt(amount));
          } else {
            reject(new Error('Failed to claim rewards'));
          }
        }
      }).catch(reject);
    });
  }

  /**
   * Get reward batch information
   * @param batchId - Batch ID
   * @returns Batch information
   */
  async getBatch(batchId: string): Promise<RewardBatch | null> {
    const batchDataRaw: any = await this.api.query.rewardDistribution.batches(batchId);

    if (batchDataRaw.isNone) {
      return null;
    }

    const batchData = batchDataRaw.unwrap();

    return {
      batchId,
      taskId: batchData.taskId.toString(),
      totalBounty: batchData.totalReward.toString(),
      coordinator: batchData.validators?.[0]?.toString() || '',
      createdAt: batchData.createdAt.toNumber(),
      settled: batchData.isSettled.isTrue,
      merkleRoot: ''
    };
  }

  /**
   * Get claimable rewards for a provider
   * @param providerAddress - Provider's address
   * @returns Claimable rewards information
   */
  async getClaimableRewards(providerAddress: string): Promise<ClaimableRewards> {
    const claimableDataRaw: any = await this.api.query.rewardDistribution.claimableRewards(providerAddress);

    if (claimableDataRaw.isNone) {
      return {
        provider: providerAddress,
        totalClaimable: 0n,
        rewardsByTask: new Map()
      };
    }

    const claimableData = claimableDataRaw.unwrap();
    const rewardsByTask = new Map<string, bigint>();

    // Parse rewards by task from the chain data
    claimableData.rewardsByTask.forEach((reward: any, taskId: any) => {
      rewardsByTask.set(taskId.toString(), reward.toBigInt());
    });

    return {
      provider: providerAddress,
      totalClaimable: claimableData.totalClaimable.toBigInt(),
      rewardsByTask
    };
  }

  /**
   * Calculate reward distribution based on contributions
   * Mining pool formula: reward = base × quality × hardware_tier × reputation
   *
   * @param params - Calculation parameters
   * @returns Array of reward calculations for each provider
   */
  calculateRewards(params: {
    totalReward: bigint;
    providers: Array<{
      address: string;
      gradientsContributed: number;
      qualityScore: number; // 0-1000
      hardwareMultiplier: number; // 100 = 1.0x, 150 = 1.5x, 200 = 2.0x
      reputation?: number; // 0-1000, defaults to 500
    }>;
  }): RewardCalculation[] {
    const { totalReward, providers } = params;

    // Calculate weighted contributions
    // weight = gradientsContributed × (qualityScore/1000) × (hardwareMultiplier/100) × (reputation/1000)
    const weightedContributions = providers.map(p => {
      const reputation = p.reputation ?? 500;
      return {
        provider: p.address,
        gradientsContributed: p.gradientsContributed,
        qualityScore: p.qualityScore,
        hardwareMultiplier: p.hardwareMultiplier,
        weight:
          p.gradientsContributed *
          (p.qualityScore / 1000) *
          (p.hardwareMultiplier / 100) *
          (reputation / 1000)
      };
    });

    const totalWeight = weightedContributions.reduce((sum, p) => sum + p.weight, 0);

    // Calculate rewards proportionally
    return weightedContributions.map(p => {
      const baseReward = (totalReward * BigInt(Math.floor(p.gradientsContributed * 1000))) / BigInt(Math.floor(totalWeight * 1000));

      // Quality bonus: 0-20% based on quality score
      const qualityBonus = (baseReward * BigInt(p.qualityScore)) / 5000n;

      // Hardware bonus: based on hardware multiplier
      const hardwareBonus = (baseReward * BigInt(p.hardwareMultiplier - 100)) / 100n;

      const totalProviderReward = baseReward + qualityBonus + hardwareBonus;

      return {
        provider: p.provider,
        baseReward,
        qualityBonus,
        hardwareBonus,
        totalReward: totalProviderReward,
        qualityScore: p.qualityScore,
        hardwareMultiplier: p.hardwareMultiplier
      };
    });
  }

  /**
   * Get provider rewards for a specific task
   * @param taskId - Task ID
   * @param providerAddress - Provider's address
   * @returns Provider reward details
   */
  async getProviderRewardForTask(taskId: string, providerAddress: string): Promise<ProviderReward | null> {
    const rewardDataRaw: any = await this.api.query.rewardDistribution.providerRewards(taskId, providerAddress);

    if (rewardDataRaw.isNone) {
      return null;
    }

    const rewardData = rewardDataRaw.unwrap();

    return {
      provider: providerAddress,
      amount: rewardData.amount.toString(),
      gradientsContributed: rewardData.gradientsContributed.toNumber(),
      qualityScore: rewardData.qualityScore.toNumber(),
      hardwareMultiplier: rewardData.hardwareMultiplier.toNumber()
    };
  }

  /**
   * Get all rewards for a task
   * @param taskId - Task ID
   * @returns Array of provider rewards
   */
  async getTaskRewards(taskId: string): Promise<ProviderReward[]> {
    // Get task providers first
    const providersRaw: any = await this.api.query.taskRegistry.taskProviders(taskId);

    if (providersRaw.isNone) {
      return [];
    }

    const providers = providersRaw.unwrap().map((p: any) => p.toString());
    const rewards: ProviderReward[] = [];

    for (const provider of providers) {
      const reward = await this.getProviderRewardForTask(taskId, provider);
      if (reward) {
        rewards.push(reward);
      }
    }

    return rewards;
  }

  /**
   * Monitor reward batch settlement status
   * @param batchId - Batch ID to monitor
   * @param callback - Callback function called when batch is settled
   * @returns Unsubscribe function
   */
  async monitorBatchSettlement(
    batchId: string,
    callback: (batch: RewardBatch) => void
  ): Promise<any> {
    const unsubscribe = await this.api.query.rewardDistribution.batches(
      batchId,
      (batchDataRaw: any) => {
        if (batchDataRaw.isNone) return;

        const batchData = batchDataRaw.unwrap();

        if (batchData.isSettled.isTrue) {
          const batch: RewardBatch = {
            batchId,
            taskId: batchData.taskId.toString(),
            totalBounty: batchData.totalReward.toString(),
            coordinator: batchData.validators?.[0]?.toString() || '',
            createdAt: batchData.createdAt.toNumber(),
            settled: true,
            merkleRoot: ''
          };

          callback(batch);
        }
      }
    );

    return unsubscribe;
  }
}
