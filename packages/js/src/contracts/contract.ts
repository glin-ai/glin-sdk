/**
 * Generic Contract class for interacting with ANY ink! smart contract
 *
 * Provides an ethers.js-like API for contract interaction:
 * - contract.query.methodName(...args) - Read contract state
 * - contract.tx.methodName(...args) - Execute contract transactions
 *
 * @example
 * ```typescript
 * import { Contract } from '@glin-ai/sdk';
 * import myTokenAbi from './MyToken.json';
 *
 * const token = new Contract(api, tokenAddress, myTokenAbi, signer);
 *
 * // Query (read-only)
 * const balance = await token.query.balanceOf(userAddress);
 *
 * // Execute (transaction)
 * const result = await token.tx.transfer(recipient, amount);
 * ```
 */

import type { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import type { Signer } from '@polkadot/api/types';
import type { ContractCallOutcome } from '@polkadot/api-contract/types';
import type { ISubmittableResult } from '@polkadot/types/types';

/**
 * Contract query result
 */
export interface QueryResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  gasConsumed?: bigint;
  storageDeposit?: bigint;
}

/**
 * Contract transaction result
 */
export interface TxResult {
  txHash: string;
  blockHash?: string;
  blockNumber?: number;
  success: boolean;
  events?: ContractEvent[];
  error?: string;
}

/**
 * Contract event
 */
export interface ContractEvent {
  section: string;
  method: string;
  data: any;
  index?: number;
}

/**
 * Contract call options
 */
export interface CallOptions {
  value?: bigint;
  gasLimit?: bigint | any;
  storageDepositLimit?: bigint | null;
}

/**
 * Generic Contract class for interacting with ink! smart contracts
 */
export class Contract {
  private api: ApiPromise;
  private contract: ContractPromise;
  private contractAddress: string;
  private signer?: Signer;
  private abi: any;

  // Dynamic query and tx interfaces
  public readonly query: Record<string, (...args: any[]) => Promise<QueryResult>>;
  public readonly tx: Record<string, (...args: any[]) => Promise<TxResult>>;

  /**
   * Create a new contract instance
   *
   * @param api - Connected Polkadot API instance
   * @param address - Contract address
   * @param abi - Contract ABI (metadata JSON)
   * @param signer - Optional signer for transactions
   *
   * @example
   * ```typescript
   * const contract = new Contract(api, '5Contract...', myAbi, signer);
   * ```
   */
  constructor(
    api: ApiPromise,
    address: string,
    abi: any,
    signer?: Signer
  ) {
    this.api = api;
    this.contractAddress = address;
    this.abi = abi;
    this.signer = signer;
    this.contract = new ContractPromise(api, abi, address);

    // Build dynamic query interface
    this.query = this.buildQueryInterface();

    // Build dynamic tx interface
    this.tx = this.buildTxInterface();
  }

  /**
   * Build query interface from ABI
   * Creates methods like: contract.query.balanceOf(account)
   */
  private buildQueryInterface(): Record<string, (...args: any[]) => Promise<QueryResult>> {
    const queryMethods: Record<string, (...args: any[]) => Promise<QueryResult>> = {};

    // Get all contract messages from ABI
    const messages = this.abi?.spec?.messages || [];

    for (const message of messages) {
      const methodName = message.label;

      queryMethods[methodName] = async (...args: any[]): Promise<QueryResult> => {
        return this.executeQuery(methodName, {}, ...args);
      };
    }

    return queryMethods;
  }

  /**
   * Build transaction interface from ABI
   * Creates methods like: contract.tx.transfer(recipient, amount)
   */
  private buildTxInterface(): Record<string, (...args: any[]) => Promise<TxResult>> {
    const txMethods: Record<string, (...args: any[]) => Promise<TxResult>> = {};

    // Get all contract messages from ABI
    const messages = this.abi?.spec?.messages || [];

    for (const message of messages) {
      const methodName = message.label;

      // Only create tx method if message is mutating
      if (message.mutates !== false) {
        txMethods[methodName] = async (...args: any[]): Promise<TxResult> => {
          if (!this.signer) {
            throw new Error('Signer required for transactions. Provide signer in constructor.');
          }

          // Get signer address - assume first account for now
          const accounts = await this.api.query.system.account.keys();
          const signerAddress = accounts[0]?.toString();

          if (!signerAddress) {
            throw new Error('No accounts found');
          }

          return this.executeTransaction(methodName, signerAddress, {}, ...args);
        };
      }
    }

    return txMethods;
  }

  /**
   * Execute a contract query (read-only)
   */
  private async executeQuery<T>(
    method: string,
    options: CallOptions = {},
    ...args: any[]
  ): Promise<QueryResult<T>> {
    try {
      // Get caller address
      const accounts = await this.api.query.system.account.keys();
      const callerAddress = accounts[0]?.toString();

      if (!callerAddress) {
        return {
          success: false,
          error: 'No caller address available'
        };
      }

      // Prepare gas config
      const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
        refTime: 3_000_000_000_000n,
        proofSize: 500_000n
      });

      // Execute dry-run query
      const outcome: ContractCallOutcome = await this.contract.query[method](
        callerAddress,
        {
          gasLimit: gasLimit as any,
          storageDepositLimit: options.storageDepositLimit || null,
          value: options.value || 0
        },
        ...args
      );

      // Check if query was successful
      if (outcome.result.isOk) {
        const output = outcome.output;

        if (output && !output.isEmpty) {
          // Handle Weight type conversion
          const gasConsumed = outcome.gasConsumed
            ? BigInt((outcome.gasConsumed as any).refTime?.toString() || outcome.gasConsumed.toString())
            : undefined;

          const storageDeposit = outcome.storageDeposit.asCharge
            ? BigInt(outcome.storageDeposit.asCharge.toString())
            : undefined;

          return {
            success: true,
            data: output.toJSON() as T,
            gasConsumed,
            storageDeposit
          };
        } else {
          return {
            success: false,
            error: 'Query returned empty output'
          };
        }
      } else {
        return {
          success: false,
          error: outcome.result.asErr.toString()
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown query error'
      };
    }
  }

  /**
   * Execute a contract transaction (write)
   */
  private async executeTransaction(
    method: string,
    signerAddress: string,
    options: CallOptions = {},
    ...args: any[]
  ): Promise<TxResult> {
    try {
      // Prepare gas config
      const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
        refTime: 3_000_000_000_000n,
        proofSize: 500_000n
      });

      // Create transaction
      const tx = this.contract.tx[method](
        {
          gasLimit: gasLimit as any,
          storageDepositLimit: options.storageDepositLimit || null,
          value: options.value || 0
        },
        ...args
      );

      // Sign and send transaction
      return new Promise((resolve, reject) => {
        let txHash = '';

        tx.signAndSend(signerAddress, (result: ISubmittableResult) => {
          if (result.status.isInBlock) {
            txHash = result.txHash.toString();
          }

          if (result.status.isFinalized) {
            const events = this.extractEvents(result);

            // Check for errors
            const failed = result.events.find(
              ({ event }) => event.section === 'system' && event.method === 'ExtrinsicFailed'
            );

            if (failed) {
              resolve({
                txHash,
                blockHash: result.status.asFinalized.toString(),
                success: false,
                events,
                error: 'Transaction failed'
              });
            } else {
              const blockNum = (result as any).blockNumber;
              const blockNumber = blockNum ? Number(blockNum.toString()) : undefined;

              resolve({
                txHash,
                blockHash: result.status.asFinalized.toString(),
                blockNumber,
                success: true,
                events
              });
            }
          }

          if (result.isError) {
            reject(new Error('Transaction error'));
          }
        }).catch(reject);
      });
    } catch (error) {
      return {
        txHash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown transaction error'
      };
    }
  }

  /**
   * Extract events from transaction result
   */
  private extractEvents(result: ISubmittableResult): ContractEvent[] {
    return result.events.map((record: any, index: number) => ({
      section: record.event.section,
      method: record.event.method,
      data: record.event.data.toJSON(),
      index
    }));
  }

  /**
   * Estimate gas for a contract call
   *
   * @param method - Contract method name
   * @param args - Method arguments
   * @returns Estimated gas required (with 20% buffer)
   */
  public async estimateGas(method: string, ...args: any[]): Promise<bigint> {
    const accounts = await this.api.query.system.account.keys();
    const callerAddress = accounts[0]?.toString();

    if (!callerAddress) {
      throw new Error('No caller address available');
    }

    try {
      // Use a large gas limit for estimation
      const maxGas = this.api.registry.createType('WeightV2', {
        refTime: 5_000_000_000_000n,
        proofSize: 1_000_000n
      });

      const outcome: ContractCallOutcome = await this.contract.query[method](
        callerAddress,
        {
          gasLimit: maxGas as any,
          storageDepositLimit: null,
          value: 0
        },
        ...args
      );

      if (outcome.result.isOk) {
        // Add 20% buffer to gas estimate
        const gasReq = outcome.gasRequired as any;
        const gasRequired = BigInt(gasReq.refTime?.toString() || gasReq.toString());
        return (gasRequired * 120n) / 100n;
      } else {
        throw new Error(`Gas estimation failed: ${outcome.result.asErr.toString()}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to estimate gas: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get contract address
   */
  public getAddress(): string {
    return this.contractAddress;
  }

  /**
   * Get contract ABI
   */
  public getAbi(): any {
    return this.abi;
  }

  /**
   * Update signer
   */
  public setSigner(signer: Signer): void {
    this.signer = signer;
  }

  /**
   * Get API instance
   */
  public getApi(): ApiPromise {
    return this.api;
  }
}
