import { ApiPromise } from '@polkadot/api';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { HardwareSpec, FederatedTask, TaskStatus } from '../types/federated';

export interface RegisterProviderParams {
  stake: bigint;
  hardwareSpec: HardwareSpec;
}

export interface FindTasksParams {
  minBounty?: bigint;
  modelTypes?: string[];
  maxVramRequired?: number;
  status?: TaskStatus[];
}

export interface ProviderInfo {
  provider: string;
  stake: bigint;
  hardwareSpec: HardwareSpec;
  activeTasks: string[];
  totalTasksCompleted: number;
  reputation: number;
  isActive: boolean;
}

/**
 * High-level workflow for GPU providers to manage their participation in federated learning tasks.
 * Handles registration, hardware management, task discovery, and stake management.
 */
export class ProviderWorkflow {
  constructor(
    private api: ApiPromise,
    private signer?: KeyringPair
  ) {}

  /**
   * Register as a provider with initial stake and hardware specifications
   * @param params - Registration parameters including stake amount and hardware specs
   */
  async register(params: RegisterProviderParams): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required for registration');
    }

    const tx = this.api.tx.providerStaking.registerProvider(
      params.stake,
      {
        vramGb: params.hardwareSpec.vramGb,
        computeCapability: params.hardwareSpec.computeCapability,
        gpuModel: params.hardwareSpec.gpuModel,
        bandwidthMbps: params.hardwareSpec.bandwidthMbps,
        tier: params.hardwareSpec.tier
      }
    );

    await new Promise<void>((resolve, reject) => {
      tx.signAndSend(this.signer!, ({ status, events }) => {
        if (status.isInBlock) {
          const providerRegisteredEvent = events.find(
            ({ event }) =>
              event.section === 'providerStaking' && event.method === 'ProviderRegistered'
          );

          if (providerRegisteredEvent) {
            resolve();
          } else {
            reject(new Error('Provider registration failed'));
          }
        }
      }).catch(reject);
    });
  }

  /**
   * Update hardware specifications (e.g., GPU upgrade)
   * @param hardwareSpec - New hardware specifications
   */
  async updateHardware(hardwareSpec: HardwareSpec): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required for hardware update');
    }

    const tx = this.api.tx.providerStaking.updateHardware({
      vramGb: hardwareSpec.vramGb,
      computeCapability: hardwareSpec.computeCapability,
      gpuModel: hardwareSpec.gpuModel,
      bandwidthMbps: hardwareSpec.bandwidthMbps,
      tier: hardwareSpec.tier
    });

    await new Promise<void>((resolve, reject) => {
      tx.signAndSend(this.signer!, ({ status }) => {
        if (status.isInBlock) {
          resolve();
        }
      }).catch(reject);
    });
  }

  /**
   * Join a federated learning task
   * @param taskId - ID of the task to join
   */
  async joinTask(taskId: string): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required to join task');
    }

    const tx = this.api.tx.taskRegistry.joinTask(taskId);

    await new Promise<void>((resolve, reject) => {
      tx.signAndSend(this.signer!, ({ status, events }) => {
        if (status.isInBlock) {
          const providerJoinedEvent = events.find(
            ({ event }) =>
              event.section === 'taskRegistry' && event.method === 'ProviderJoined'
          );

          if (providerJoinedEvent) {
            resolve();
          } else {
            reject(new Error('Failed to join task'));
          }
        }
      }).catch(reject);
    });
  }

  /**
   * Find tasks matching provider's hardware capabilities and preferences
   * @param criteria - Search criteria for task discovery
   * @returns Array of matching federated learning tasks
   */
  async findMatchingTasks(criteria: FindTasksParams = {}): Promise<FederatedTask[]> {
    // Query all tasks from chain
    const taskCountRaw: any = await this.api.query.taskRegistry.taskCount();
    const taskCount = taskCountRaw.toNumber();

    const matchingTasks: FederatedTask[] = [];

    for (let i = 0; i < taskCount; i++) {
      const taskId = i.toString();
      const taskDataRaw: any = await this.api.query.taskRegistry.tasks(taskId);

      if (taskDataRaw.isNone) continue;

      const taskData = taskDataRaw.unwrap();

      // Parse task data
      const task: FederatedTask = {
        id: taskId,
        creator: taskData.creator.toString(),
        name: taskData.name.toUtf8(),
        modelType: taskData.modelType.toString() as any,
        bounty: taskData.bounty.toString(),
        minProviders: taskData.minProviders.toNumber(),
        maxProviders: taskData.maxProviders.toNumber(),
        status: taskData.status.toString() as TaskStatus,
        ipfsHash: taskData.ipfsHash.toUtf8(),
        hardwareRequirements: {
          minVramGb: taskData.hardwareRequirements.minVramGb.toNumber(),
          minComputeCapability: taskData.hardwareRequirements.minComputeCapability.toNumber(),
          minBandwidthMbps: taskData.hardwareRequirements.minBandwidthMbps.toNumber()
        },
        createdAt: taskData.createdAt.toNumber(),
        completedAt: taskData.completedAt.isSome ? taskData.completedAt.unwrap().toNumber() : undefined
      };

      // Apply filters
      if (criteria.minBounty && BigInt(task.bounty) < criteria.minBounty) continue;
      if (criteria.modelTypes && !criteria.modelTypes.includes(task.modelType)) continue;
      if (criteria.maxVramRequired && task.hardwareRequirements.minVramGb > criteria.maxVramRequired) continue;
      if (criteria.status && !criteria.status.includes(task.status)) continue;

      // Only include tasks that are recruiting or running
      if (task.status === 'Recruiting' || task.status === 'Running') {
        matchingTasks.push(task);
      }
    }

    return matchingTasks;
  }

  /**
   * Get provider information including stake, hardware, and active tasks
   * @param providerAddress - Provider's address (defaults to signer's address)
   * @returns Provider information
   */
  async getProviderInfo(providerAddress?: string): Promise<ProviderInfo | null> {
    const address = providerAddress || this.signer?.address;
    if (!address) {
      throw new Error('Provider address required');
    }

    const providerDataRaw: any = await this.api.query.providerStaking.providers(address);

    if (providerDataRaw.isNone) {
      return null;
    }

    const providerData = providerDataRaw.unwrap();

    return {
      provider: address,
      stake: providerData.stake.toBigInt(),
      hardwareSpec: {
        vramGb: providerData.hardwareSpec.vramGb.toNumber(),
        computeCapability: providerData.hardwareSpec.computeCapability.toNumber(),
        gpuModel: providerData.hardwareSpec.gpuModel.toUtf8(),
        bandwidthMbps: providerData.hardwareSpec.bandwidthMbps.toNumber(),
        tier: providerData.hardwareSpec.tier.toString() as any
      },
      activeTasks: providerData.activeTasks.map((t: any) => t.toString()),
      totalTasksCompleted: providerData.totalTasksCompleted.toNumber(),
      reputation: providerData.reputation.toNumber(),
      isActive: providerData.isActive.isTrue
    };
  }

  /**
   * Start the unbonding period for stake withdrawal
   * After unbonding period completes, use withdrawStake() to claim funds
   */
  async startUnbonding(): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required to start unbonding');
    }

    const tx = this.api.tx.providerStaking.startUnbonding();

    await new Promise<void>((resolve, reject) => {
      tx.signAndSend(this.signer!, ({ status, events }) => {
        if (status.isInBlock) {
          const unbondingStartedEvent = events.find(
            ({ event }) =>
              event.section === 'providerStaking' && event.method === 'UnbondingStarted'
          );

          if (unbondingStartedEvent) {
            resolve();
          } else {
            reject(new Error('Failed to start unbonding'));
          }
        }
      }).catch(reject);
    });
  }

  /**
   * Withdraw stake after unbonding period has completed
   * @returns Amount withdrawn
   */
  async withdrawStake(): Promise<bigint> {
    if (!this.signer) {
      throw new Error('Signer required to withdraw stake');
    }

    const tx = this.api.tx.providerStaking.withdrawStake();

    return new Promise<bigint>((resolve, reject) => {
      tx.signAndSend(this.signer!, ({ status, events }) => {
        if (status.isInBlock) {
          const stakeWithdrawnEvent = events.find(
            ({ event }) =>
              event.section === 'providerStaking' && event.method === 'StakeWithdrawn'
          );

          if (stakeWithdrawnEvent) {
            const amount = stakeWithdrawnEvent.event.data[1].toString();
            resolve(BigInt(amount));
          } else {
            reject(new Error('Failed to withdraw stake'));
          }
        }
      }).catch(reject);
    });
  }

  /**
   * Get provider's active tasks
   * @param providerAddress - Provider's address (defaults to signer's address)
   * @returns Array of active task IDs
   */
  async getActiveTasks(providerAddress?: string): Promise<string[]> {
    const address = providerAddress || this.signer?.address;
    if (!address) {
      throw new Error('Provider address required');
    }

    const providerDataRaw: any = await this.api.query.providerStaking.providers(address);

    if (providerDataRaw.isNone) {
      return [];
    }

    const providerData = providerDataRaw.unwrap();
    return providerData.activeTasks.map((t: any) => t.toString());
  }

  /**
   * Check if provider meets hardware requirements for a task
   * @param taskId - Task ID to check
   * @param providerAddress - Provider's address (defaults to signer's address)
   * @returns true if provider meets requirements
   */
  async meetsRequirements(taskId: string, providerAddress?: string): Promise<boolean> {
    const address = providerAddress || this.signer?.address;
    if (!address) {
      throw new Error('Provider address required');
    }

    // Get task requirements
    const taskDataRaw: any = await this.api.query.taskRegistry.tasks(taskId);
    if (taskDataRaw.isNone) {
      throw new Error('Task not found');
    }

    const taskData = taskDataRaw.unwrap();
    const requirements = taskData.hardwareRequirements;

    // Get provider hardware
    const providerInfo = await this.getProviderInfo(address);
    if (!providerInfo) {
      return false;
    }

    const hardware = providerInfo.hardwareSpec;

    // Check requirements
    return (
      hardware.vramGb >= requirements.minVramGb.toNumber() &&
      hardware.computeCapability >= requirements.minComputeCapability.toNumber() &&
      hardware.bandwidthMbps >= requirements.minBandwidthMbps.toNumber()
    );
  }
}
