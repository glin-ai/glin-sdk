/**
 * Blockchain client for GLIN network
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Balance, ChainTask, ChainProvider, BlockInfo, TransactionInfo, ExtrinsicInfo, EventInfo, AccountInfo, SearchResult, Task } from '../types';

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
   * Transfer tokens
   *
   * @param from - KeyringPair or InjectedAccountWithMeta
   * @param to - Recipient address
   * @param amount - Amount in planck (smallest unit). Use parseGLIN() to convert from GLIN.
   * @param onStatus - Optional callback for transaction status
   * @returns Transaction hash
   *
   * @example
   * ```typescript
   * import { parseGLIN } from '@glin-ai/sdk';
   *
   * const amount = parseGLIN("10.5");
   * const hash = await client.transfer(keypair, recipient, amount);
   * ```
   */
  async transfer(
    from: any, // KeyringPair or InjectedAccountWithMeta
    to: string,
    amount: bigint,
    onStatus?: (status: any) => void
  ): Promise<string> {
    await this.ensureConnected();

    // Amount is already in planck (smallest unit) - use directly
    const transfer = this.api!.tx.balances.transferKeepAlive(to, amount);

    return new Promise((resolve, reject) => {
      transfer.signAndSend(from, (result: any) => {
        if (onStatus) {
          onStatus(result);
        }

        if (result.status.isFinalized) {
          const hash = result.status.asFinalized.toString();
          resolve(hash);
        }

        if (result.isError) {
          reject(new Error('Transaction failed'));
        }
      }).catch(reject);
    });
  }

  /**
   * Estimate transaction fee
   *
   * @param from - Sender address
   * @param to - Recipient address
   * @param amount - Amount in planck (smallest unit). Use parseGLIN() to convert from GLIN.
   * @returns Estimated fee in planck as string
   *
   * @example
   * ```typescript
   * import { parseGLIN, formatGLIN } from '@glin-ai/sdk';
   *
   * const amount = parseGLIN("10.5");
   * const fee = await client.estimateFee(senderAddress, recipient, amount);
   * console.log(`Fee: ${formatGLIN(BigInt(fee))} GLIN`);
   * ```
   */
  async estimateFee(
    from: string,
    to: string,
    amount: bigint
  ): Promise<string> {
    await this.ensureConnected();

    // Amount is already in planck (smallest unit) - use directly
    const transfer = this.api!.tx.balances.transferKeepAlive(to, amount);
    const info = await transfer.paymentInfo(from);
    return info.partialFee.toString();
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
   * Subscribe to balance changes for an address
   */
  async subscribeBalance(address: string, callback: (balance: Balance) => void): Promise<() => void> {
    await this.ensureConnected();

    const unsubscribe = await this.api!.query.system.account(address, (account: any) => {
      const data = account.data;
      callback({
        free: data.free.toString(),
        reserved: data.reserved.toString(),
        frozen: data.frozen?.toString() || data.miscFrozen?.toString() || '0',
        total: (BigInt(data.free.toString()) + BigInt(data.reserved.toString())).toString()
      });
    }) as unknown as () => void;

    return unsubscribe;
  }

  /**
   * Get latest blocks
   */
  async getLatestBlocks(count: number = 10): Promise<BlockInfo[]> {
    await this.ensureConnected();

    const latestHeader = await this.api!.rpc.chain.getHeader();
    const latestNumber = latestHeader.number.toNumber();

    const blocks: BlockInfo[] = [];

    for (let i = 0; i < count && latestNumber - i >= 0; i++) {
      const blockHash = await this.api!.rpc.chain.getBlockHash(latestNumber - i);
      const signedBlock = await this.api!.rpc.chain.getBlock(blockHash);
      const header = signedBlock.block.header;

      const extrinsics = signedBlock.block.extrinsics.map(ext => ({
        hash: ext.hash.toString(),
        method: ext.method.method,
        section: ext.method.section
      }));

      const timestamp = this.extractTimestamp(signedBlock.block.extrinsics);

      blocks.push({
        number: header.number.toNumber(),
        hash: blockHash.toString(),
        parentHash: header.parentHash.toString(),
        stateRoot: header.stateRoot.toString(),
        extrinsicsRoot: header.extrinsicsRoot.toString(),
        extrinsics,
        timestamp,
        receivedAt: Date.now()
      });
    }

    return blocks;
  }

  /**
   * Get block by hash or number
   */
  async getBlock(hashOrNumber: string | number): Promise<BlockInfo | null> {
    await this.ensureConnected();

    const blockHash = typeof hashOrNumber === 'number'
      ? await this.api!.rpc.chain.getBlockHash(hashOrNumber)
      : hashOrNumber;

    const signedBlock = await this.api!.rpc.chain.getBlock(blockHash);
    const header = signedBlock.block.header;

    const extrinsics = signedBlock.block.extrinsics.map(ext => ({
      hash: ext.hash.toString(),
      method: ext.method.method,
      section: ext.method.section,
      args: ext.args.map(arg => arg.toString())
    }));

    const timestamp = this.extractTimestamp(signedBlock.block.extrinsics);

    return {
      number: header.number.toNumber(),
      hash: blockHash.toString(),
      parentHash: header.parentHash.toString(),
      stateRoot: header.stateRoot.toString(),
      extrinsicsRoot: header.extrinsicsRoot.toString(),
      extrinsics,
      timestamp,
      receivedAt: Date.now()
    };
  }

  /**
   * Get transaction details with events
   */
  async getTransaction(blockHash: string, extrinsicIndex: number): Promise<TransactionInfo | null> {
    await this.ensureConnected();

    try {
      const signedBlock = await this.api!.rpc.chain.getBlock(blockHash);
      const extrinsic = signedBlock.block.extrinsics[extrinsicIndex];

      if (!extrinsic) return null;

      // Get events for this block
      const apiAt = await this.api!.at(blockHash);
      const events = await apiAt.query.system.events();

      // Filter events for this extrinsic
      type EventRecord = {
        phase: { isApplyExtrinsic: boolean; asApplyExtrinsic: { toNumber: () => number } };
        event: { section: string; method: string; data: { toJSON: () => Record<string, unknown> } };
      };

      const extrinsicEvents = (events as unknown as EventRecord[])
        .filter((record) => record.phase.isApplyExtrinsic &&
                record.phase.asApplyExtrinsic.toNumber() === extrinsicIndex)
        .map((record) => ({
          section: record.event.section,
          method: record.event.method,
          data: record.event.data.toJSON()
        }));

      const success = extrinsicEvents.some(
        (e: EventInfo) => e.section === 'system' && e.method === 'ExtrinsicSuccess'
      );

      const header = signedBlock.block.header;

      return {
        hash: extrinsic.hash.toString(),
        blockNumber: header.number.toNumber(),
        blockHash: blockHash.toString(),
        method: extrinsic.method.method,
        section: extrinsic.method.section,
        args: extrinsic.args.map(arg => arg.toString()),
        signer: extrinsic.signer?.toString(),
        success,
        events: extrinsicEvents
      };
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
      return null;
    }
  }

  /**
   * Get account info (balance + nonce)
   */
  async getAccountInfo(address: string): Promise<AccountInfo> {
    await this.ensureConnected();

    const accountData = await this.api!.query.system.account(address);
    const acc = accountData as unknown as {
      nonce: { toNumber: () => number };
      data: {
        free: { toString: () => string };
        reserved: { toString: () => string };
        frozen: { toString: () => string };
      };
    };

    return {
      address,
      nonce: acc.nonce.toNumber(),
      balance: {
        free: acc.data.free.toString(),
        reserved: acc.data.reserved.toString(),
        frozen: acc.data.frozen.toString()
      }
    };
  }

  /**
   * Search for block, transaction, account, or task
   */
  async search(query: string): Promise<SearchResult | null> {
    await this.ensureConnected();

    // Try as block number
    if (/^\d+$/.test(query)) {
      const block = await this.getBlock(parseInt(query));
      if (block) return { type: 'block', data: block };
    }

    // Try as block hash
    if (query.startsWith('0x') && query.length === 66) {
      try {
        const block = await this.getBlock(query);
        if (block) return { type: 'block', data: block };
      } catch {}
    }

    // Try as account address
    if (query.length >= 47 && query.length <= 48) {
      try {
        const account = await this.getAccountInfo(query);
        return { type: 'account', data: account };
      } catch {}
    }

    // Try as task ID
    try {
      const taskData = await this.api!.query.taskRegistry.tasks(query);
      if (!taskData.isEmpty) {
        const data = taskData.toJSON() as {
          creator: string;
          bounty: string;
          status: string;
          modelType?: string;
          providers?: string[];
        };

        const task: Task = {
          id: query,
          creator: data.creator,
          bounty: data.bounty,
          status: data.status,
          modelType: data.modelType || 'Unknown',
          providers: data.providers || []
        };

        return { type: 'task', data: task };
      }
    } catch {}

    return null;
  }

  /**
   * Extract timestamp from block extrinsics
   */
  private extractTimestamp(extrinsics: Array<any>): number | undefined {
    for (const ext of extrinsics) {
      if (ext.method.section === 'timestamp' && ext.method.method === 'set') {
        try {
          const timestamp = ext.method.args[0];
          return Number(timestamp.toString());
        } catch (error) {
          console.error('Error extracting timestamp:', error);
        }
      }
    }
    return undefined;
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
