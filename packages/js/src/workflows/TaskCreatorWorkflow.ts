/**
 * Task Creator Workflow
 *
 * High-level workflow for creating and managing federated learning tasks.
 * Wraps the TaskRegistry pallet with a developer-friendly API.
 */

import type { ApiPromise } from '@polkadot/api'
import type { KeyringPair } from '@polkadot/keyring/types'
import type {
  FederatedTask,
  CreateTaskParams,
  HardwareRequirements,
  TrainingRound,
  TaskMonitorCallbacks
} from '../types/federated'

export class TaskCreatorWorkflow {
  constructor(
    private api: ApiPromise,
    private signer?: KeyringPair
  ) {}

  /**
   * Create a new federated learning task
   */
  async createTask(params: CreateTaskParams): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required to create task')
    }

    const tx = this.api.tx.taskRegistry.createTask(
      params.name,
      params.modelType,
      params.bounty,
      params.minProviders,
      params.maxProviders,
      params.initialModelIpfs,
      params.hardwareRequirements
    )

    return new Promise((resolve, reject) => {
      tx.signAndSend(this.signer!, ({ status, events }) => {
        if (status.isInBlock) {
          const taskCreatedEvent = events.find(
            ({ event }) =>
              event.section === 'taskRegistry' &&
              event.method === 'TaskCreated'
          )

          if (taskCreatedEvent) {
            const taskId = taskCreatedEvent.event.data[0].toString()
            resolve(taskId)
          } else {
            reject(new Error('Task creation event not found'))
          }
        }
      }).catch(reject)
    })
  }

  /**
   * Start recruiting providers for a task
   */
  async startRecruiting(taskId: string): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required to start recruiting')
    }

    const tx = this.api.tx.taskRegistry.startRecruiting(taskId)

    return new Promise((resolve, reject) => {
      tx.signAndSend(this.signer!, ({ status }) => {
        if (status.isInBlock) {
          resolve()
        }
      }).catch(reject)
    })
  }

  /**
   * Monitor task progress with callbacks
   */
  async monitorTask(
    taskId: string,
    callbacks: TaskMonitorCallbacks
  ): Promise<any> {
    const unsubscribers: any[] = []

    // Subscribe to task state changes
    const unsubTask = await this.api.query.taskRegistry.tasks(taskId, (taskData: any) => {
      if (taskData.isNone) return

      const task = taskData.unwrap()
      const taskJson = task.toJSON() as any

      // Check if task completed
      if (taskJson.status === 'Completed' && callbacks.onTaskComplete) {
        callbacks.onTaskComplete(taskJson.ipfsHash)
      }
    })
    unsubscribers.push(unsubTask)

    // Subscribe to provider join events
    if (callbacks.onProviderJoin) {
      const unsubEvents = await this.api.query.system.events((events: any) => {
        events.forEach(({ event }: any) => {
          if (
            event.section === 'taskRegistry' &&
            event.method === 'ProviderJoined'
          ) {
            const [eventTaskId, provider] = event.data
            if (eventTaskId.toString() === taskId) {
              callbacks.onProviderJoin!(provider.toString())
            }
          }
        })
      })
      unsubscribers.push(unsubEvents)
    }

    // Return cleanup function
    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<FederatedTask | null> {
    const taskData: any = await this.api.query.taskRegistry.tasks(taskId)

    if (taskData.isNone) {
      return null
    }

    const task = taskData.unwrap()
    const taskJson = task.toJSON() as any

    return {
      id: taskId,
      creator: taskJson.creator,
      name: taskJson.name,
      modelType: taskJson.modelType,
      bounty: taskJson.bounty.toString(),
      minProviders: taskJson.minProviders,
      maxProviders: taskJson.maxProviders,
      status: taskJson.status,
      ipfsHash: taskJson.ipfsHash,
      hardwareRequirements: {
        minVramGb: taskJson.hardwareRequirements.minVramGb,
        minComputeCapability: taskJson.hardwareRequirements.minComputeCapability,
        minBandwidthMbps: taskJson.hardwareRequirements.minBandwidthMbps
      },
      createdAt: taskJson.createdAt,
      completedAt: taskJson.completedAt
    }
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required to complete task')
    }

    const tx = this.api.tx.taskRegistry.completeTask(taskId)

    return new Promise((resolve, reject) => {
      tx.signAndSend(this.signer!, ({ status }) => {
        if (status.isInBlock) {
          resolve()
        }
      }).catch(reject)
    })
  }

  /**
   * Cancel a task and get refund
   */
  async cancelTask(taskId: string): Promise<bigint> {
    if (!this.signer) {
      throw new Error('Signer required to cancel task')
    }

    return new Promise((resolve, reject) => {
      this.api.tx.taskRegistry.cancelTask(taskId)
        .signAndSend(this.signer!, ({ status, events }) => {
          if (status.isInBlock) {
            const cancelEvent = events.find(
              ({ event }) =>
                event.section === 'taskRegistry' &&
                event.method === 'TaskCancelled'
            )

            if (cancelEvent) {
              const refundAmount = cancelEvent.event.data[1].toString()
              resolve(BigInt(refundAmount))
            } else {
              reject(new Error('Task cancellation event not found'))
            }
          }
        }).catch(reject)
    })
  }

  /**
   * Get list of providers who joined the task
   */
  async getTaskProviders(taskId: string): Promise<string[]> {
    const entries = await this.api.query.taskRegistry.taskProviders.entries(taskId)

    return entries
      .filter(([, hasJoined]) => hasJoined.toJSON() === true)
      .map(([key]) => {
        const provider = key.args[1].toString()
        return provider
      })
  }
}
