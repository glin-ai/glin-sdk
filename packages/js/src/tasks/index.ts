/**
 * Tasks module for GLIN TaskRegistry pallet
 */

import { ApiPromise } from '@polkadot/api';
import type { Task } from '../types';

export class GlinTasks {
  constructor(private api: ApiPromise) {}

  /**
   * Get a specific task by ID
   */
  async getTask(taskId: string): Promise<Task | null> {
    try {
      const task = await this.api.query.taskRegistry.tasks(taskId);

      if (task.isEmpty) return null;

      const taskData = task.toJSON() as {
        creator: string;
        bounty: string;
        status: string;
        modelType?: string;
        providers?: string[];
      };

      return {
        id: taskId,
        creator: taskData.creator,
        bounty: taskData.bounty,
        status: taskData.status,
        modelType: taskData.modelType || 'Unknown',
        providers: taskData.providers || []
      };
    } catch (error) {
      console.error('Failed to fetch task:', error);
      return null;
    }
  }

  /**
   * Get all tasks from the registry
   */
  async getAllTasks(): Promise<Task[]> {
    try {
      const entries = await this.api.query.taskRegistry.tasks.entries();

      return entries.map(([key, value]) => {
        const taskId = key.args[0].toString();
        const taskData = value.toJSON() as {
          creator: string;
          bounty: string;
          status: string;
          modelType?: string;
          providers?: string[];
        };

        return {
          id: taskId,
          creator: taskData.creator,
          bounty: taskData.bounty,
          status: taskData.status,
          modelType: taskData.modelType || 'Unknown',
          providers: taskData.providers || []
        };
      });
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      return [];
    }
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(status: string): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.status === status);
  }

  /**
   * Get tasks by creator address
   */
  async getTasksByCreator(creatorAddress: string): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.creator === creatorAddress);
  }

  /**
   * Subscribe to task updates for a specific task
   */
  async subscribeTaskUpdates(taskId: string, callback: (task: Task | null) => void): Promise<() => void> {
    try {
      const unsubscribe = await this.api.query.taskRegistry.tasks(taskId, (taskData: any) => {
        if (taskData.isEmpty) {
          callback(null);
          return;
        }

        const data = taskData.toJSON() as {
          creator: string;
          bounty: string;
          status: string;
          modelType?: string;
          providers?: string[];
        };

        callback({
          id: taskId,
          creator: data.creator,
          bounty: data.bounty,
          status: data.status,
          modelType: data.modelType || 'Unknown',
          providers: data.providers || []
        });
      }) as unknown as () => void;

      return unsubscribe;
    } catch (error) {
      console.error('Failed to subscribe to task updates:', error);
      return () => {};
    }
  }

  /**
   * Subscribe to all tasks updates
   */
  async subscribeAllTasks(callback: (tasks: Task[]) => void): Promise<() => void> {
    try {
      const unsubscribe = await this.api.query.taskRegistry.tasks.entries((entries: any) => {
        const tasks = entries.map(([key, value]: [any, any]) => {
          const taskId = key.args[0].toString();
          const taskData = value.toJSON() as {
            creator: string;
            bounty: string;
            status: string;
            modelType?: string;
            providers?: string[];
          };

          return {
            id: taskId,
            creator: taskData.creator,
            bounty: taskData.bounty,
            status: taskData.status,
            modelType: taskData.modelType || 'Unknown',
            providers: taskData.providers || []
          };
        });

        callback(tasks);
      }) as unknown as () => void;

      return unsubscribe;
    } catch (error) {
      console.error('Failed to subscribe to all tasks:', error);
      return () => {};
    }
  }
}
