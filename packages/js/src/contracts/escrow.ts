/**
 * GenericEscrow Contract Wrapper
 *
 * Provides methods to interact with the GenericEscrow smart contract
 * for milestone-based payment escrow with dispute resolution.
 */

import type { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import type {
  Agreement,
  Milestone,
  CreateAgreementParams,
  ContractCallOptions,
  ContractQueryOptions,
  ContractResult
} from './types';

// Import the contract metadata (will be generated from build)
import escrowMetadata from '../../../contracts-metadata/generic_escrow.json';

/**
 * Wrapper for GenericEscrow smart contract interactions
 */
export class EscrowContract {
  private api: ApiPromise;
  private contract?: ContractPromise;
  private signer?: KeyringPair;
  private contractAddress?: string;

  constructor(api: ApiPromise, contractAddress?: string, signer?: KeyringPair) {
    this.api = api;
    this.signer = signer;
    this.contractAddress = contractAddress;

    if (contractAddress) {
      this.contract = new ContractPromise(this.api, escrowMetadata, contractAddress);
    }
  }

  /**
   * Initialize contract with address (if not set in constructor)
   */
  setContractAddress(address: string): void {
    this.contractAddress = address;
    this.contract = new ContractPromise(this.api, escrowMetadata, address);
  }

  /**
   * Update the signer for transactions
   */
  setSigner(signer: KeyringPair): void {
    this.signer = signer;
  }

  /**
   * Create a new escrow agreement
   */
  async createAgreement(
    params: CreateAgreementParams,
    options: ContractCallOptions = {}
  ): Promise<ContractResult<bigint>> {
    if (!this.contract) throw new Error('Contract not initialized');
    if (!this.signer) throw new Error('Signer not set');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 100000000000n,
      proofSize: 100000n,
    }) as WeightV2;

    const storageDepositLimit = options.storageDepositLimit || null;

    try {
      const result = await this.contract.tx
        .createAgreement(
          { gasLimit, storageDepositLimit, value: params.value },
          params.provider,
          params.milestoneDescriptions,
          params.milestoneAmounts,
          params.milestoneDeadlines,
          params.disputeTimeout,
          params.oracle || null
        )
        .signAndSend(this.signer);

      // Wait for transaction to be finalized
      return new Promise((resolve, reject) => {
        result
          .then((unsub) => {
            // In production, properly handle events
            resolve({
              success: true,
              data: 0n, // Would extract agreement_id from events
            });
          })
          .catch(reject);
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Mark a milestone as completed (by provider)
   */
  async completeMilestone(
    agreementId: bigint,
    milestoneIndex: number,
    options: ContractCallOptions = {}
  ): Promise<ContractResult<void>> {
    if (!this.contract) throw new Error('Contract not initialized');
    if (!this.signer) throw new Error('Signer not set');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 50000000000n,
      proofSize: 50000n,
    }) as WeightV2;

    try {
      await this.contract.tx
        .completeMilestone(
          { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
          agreementId,
          milestoneIndex
        )
        .signAndSend(this.signer);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Approve milestone and release funds (by client or oracle)
   */
  async approveAndRelease(
    agreementId: bigint,
    milestoneIndex: number,
    options: ContractCallOptions = {}
  ): Promise<ContractResult<void>> {
    if (!this.contract) throw new Error('Contract not initialized');
    if (!this.signer) throw new Error('Signer not set');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 50000000000n,
      proofSize: 50000n,
    }) as WeightV2;

    try {
      await this.contract.tx
        .approveAndRelease(
          { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
          agreementId,
          milestoneIndex
        )
        .signAndSend(this.signer);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Raise a dispute for a milestone
   */
  async raiseDispute(
    agreementId: bigint,
    milestoneIndex: number,
    options: ContractCallOptions = {}
  ): Promise<ContractResult<void>> {
    if (!this.contract) throw new Error('Contract not initialized');
    if (!this.signer) throw new Error('Signer not set');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 50000000000n,
      proofSize: 50000n,
    }) as WeightV2;

    try {
      await this.contract.tx
        .raiseDispute(
          { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
          agreementId,
          milestoneIndex
        )
        .signAndSend(this.signer);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Resolve a dispute (by oracle or after timeout)
   */
  async resolveDispute(
    agreementId: bigint,
    milestoneIndex: number,
    releaseToProvider: boolean,
    options: ContractCallOptions = {}
  ): Promise<ContractResult<void>> {
    if (!this.contract) throw new Error('Contract not initialized');
    if (!this.signer) throw new Error('Signer not set');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 50000000000n,
      proofSize: 50000n,
    }) as WeightV2;

    try {
      await this.contract.tx
        .resolveDispute(
          { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
          agreementId,
          milestoneIndex,
          releaseToProvider
        )
        .signAndSend(this.signer);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get agreement details
   */
  async getAgreement(
    agreementId: bigint,
    options: ContractQueryOptions = {}
  ): Promise<Agreement | null> {
    if (!this.contract) throw new Error('Contract not initialized');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 10000000000n,
      proofSize: 10000n,
    }) as WeightV2;

    try {
      const result = await this.contract.query.getAgreement(
        this.signer?.address || this.contractAddress!,
        { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
        agreementId
      );

      if (result.result.isOk && result.output) {
        const data = result.output.toHuman() as any;
        if (data && data !== 'None') {
          return {
            client: data.client,
            provider: data.provider,
            totalAmount: BigInt(data.totalAmount.replace(/,/g, '')),
            depositedAmount: BigInt(data.depositedAmount.replace(/,/g, '')),
            createdAt: parseInt(data.createdAt),
            disputeTimeout: parseInt(data.disputeTimeout),
            oracle: data.oracle || undefined,
            isActive: data.isActive,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get agreement:', error);
      return null;
    }
  }

  /**
   * Get milestone details
   */
  async getMilestone(
    agreementId: bigint,
    milestoneIndex: number,
    options: ContractQueryOptions = {}
  ): Promise<Milestone | null> {
    if (!this.contract) throw new Error('Contract not initialized');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 10000000000n,
      proofSize: 10000n,
    }) as WeightV2;

    try {
      const result = await this.contract.query.getMilestone(
        this.signer?.address || this.contractAddress!,
        { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
        agreementId,
        milestoneIndex
      );

      if (result.result.isOk && result.output) {
        const data = result.output.toHuman() as any;
        if (data && data !== 'None') {
          return {
            description: data.description,
            amount: BigInt(data.amount.replace(/,/g, '')),
            status: data.status,
            deadline: parseInt(data.deadline),
            oracleVerification: data.oracleVerification,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get milestone:', error);
      return null;
    }
  }

  /**
   * Get milestone count for an agreement
   */
  async getMilestoneCount(
    agreementId: bigint,
    options: ContractQueryOptions = {}
  ): Promise<number> {
    if (!this.contract) throw new Error('Contract not initialized');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 10000000000n,
      proofSize: 10000n,
    }) as WeightV2;

    try {
      const result = await this.contract.query.getMilestoneCount(
        this.signer?.address || this.contractAddress!,
        { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
        agreementId
      );

      if (result.result.isOk && result.output) {
        return parseInt(result.output.toString());
      }
      return 0;
    } catch (error) {
      console.error('Failed to get milestone count:', error);
      return 0;
    }
  }
}
