/**
 * Blockchain client for GLIN network
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Balance, ChainTask, ChainProvider } from '../types';

export class GlinClient {
  private api: ApiPromise | null = null;
  private rpcUrl: string;

  constructor(rpcUrl: string = 'wss://rpc.glin.ai') {
    this.rpcUrl = rpcUrl;
  }

  /**
   * Connect to GLIN blockchain
   */
  async connect(): Promise<void> {
    if (this.api) {
      return; // Already connected
    }

    const provider = new WsProvider(this.rpcUrl);
    this.api = await ApiPromise.create({ provider });
  }

  /**
   * Disconnect from blockchain
   */
  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<Balance> {
    await this.ensureConnected();

    const account: any = await this.api!.query.system.account(address);
    const data = account.data;

    return {
      free: data.free.toString(),
      reserved: data.reserved.toString(),
      frozen: data.frozen?.toString() || data.miscFrozen?.toString() || '0',
      total: (BigInt(data.free.toString()) + BigInt(data.reserved.toString())).toString()
    };
  }

  /**
   * Get task details
   */
  async getTask(taskId: string): Promise<ChainTask | null> {
    await this.ensureConnected();

    try {
      const task: any = await this.api!.query.taskRegistry.tasks(taskId);

      if (task.isNone) {
        return null;
      }

      const taskData = task.unwrap();

      return {
        id: taskId,
        creator: taskData.creator.toString(),
        bounty: taskData.bounty.toString(),
        minProviders: taskData.minProviders.toNumber(),
        maxProviders: taskData.maxProviders.toNumber(),
        ipfsHash: taskData.ipfsHash.toString(),
        status: taskData.status.toString()
      };
    } catch (error) {
      console.error('Error fetching task:', error);
      return null;
    }
  }

  /**
   * Get provider details
   */
  async getProvider(address: string): Promise<ChainProvider | null> {
    await this.ensureConnected();

    try {
      const provider: any = await this.api!.query.providerStaking.providers(address);

      if (provider.isNone) {
        return null;
      }

      const providerData = provider.unwrap();

      return {
        account: address,
        stake: providerData.stake.toString(),
        reputationScore: providerData.reputationScore.toNumber(),
        hardwareTier: providerData.hardwareTier.toString(),
        status: providerData.status.toString(),
        isSlashed: providerData.isSlashed.valueOf()
      };
    } catch (error) {
      console.error('Error fetching provider:', error);
      return null;
    }
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    await this.ensureConnected();
    const header = await this.api!.rpc.chain.getHeader();
    return header.number.toNumber();
  }

  /**
   * Subscribe to new blocks
   */
  async subscribeNewBlocks(callback: (blockNumber: number) => void): Promise<() => void> {
    await this.ensureConnected();

    const unsubscribe = await this.api!.rpc.chain.subscribeNewHeads((header) => {
      callback(header.number.toNumber());
    });

    return unsubscribe;
  }

  /**
   * Ensure API is connected
   */
  private async ensureConnected(): Promise<void> {
    if (!this.api) {
      await this.connect();
    }
  }

  /**
   * Get API instance (for advanced usage)
   */
  getApi(): ApiPromise | null {
    return this.api;
  }
}
