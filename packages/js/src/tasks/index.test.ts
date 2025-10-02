/**
 * Unit tests for GlinTasks
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { GlinTasks } from './index';

describe('GlinTasks', () => {
  let api: ApiPromise;
  let tasks: GlinTasks;

  beforeAll(async () => {
    const provider = new WsProvider('wss://glin-rpc-production.up.railway.app');
    api = await ApiPromise.create({ provider });
    tasks = new GlinTasks(api);
  });

  afterAll(async () => {
    await api.disconnect();
  });

  describe('Task queries', () => {
    it('should get all tasks', async () => {
      const allTasks = await tasks.getAllTasks();

      expect(Array.isArray(allTasks)).toBe(true);
    });

    it('should get task by ID if exists', async () => {
      const allTasks = await tasks.getAllTasks();

      if (allTasks.length > 0) {
        const taskId = allTasks[0].id;
        const task = await tasks.getTask(taskId);

        expect(task).not.toBeNull();
        expect(task?.id).toBe(taskId);
        expect(task?.creator).toBeDefined();
        expect(task?.bounty).toBeDefined();
        expect(task?.status).toBeDefined();
      }
    });

    it('should return null for non-existent task', async () => {
      const task = await tasks.getTask('non-existent-task-id');

      expect(task).toBeNull();
    });

    it('should filter tasks by status', async () => {
      const allTasks = await tasks.getAllTasks();

      if (allTasks.length > 0) {
        const status = allTasks[0].status;
        const filteredTasks = await tasks.getTasksByStatus(status);

        expect(filteredTasks.every(t => t.status === status)).toBe(true);
      }
    });

    it('should filter tasks by creator', async () => {
      const allTasks = await tasks.getAllTasks();

      if (allTasks.length > 0) {
        const creator = allTasks[0].creator;
        const filteredTasks = await tasks.getTasksByCreator(creator);

        expect(filteredTasks.every(t => t.creator === creator)).toBe(true);
      }
    });
  });
});
