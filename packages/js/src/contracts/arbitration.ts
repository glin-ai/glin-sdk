/**
 * ArbitrationDAO Contract Wrapper
 *
 * Provides methods to interact with the ArbitrationDAO smart contract
 * for decentralized dispute resolution through stake-weighted voting.
 */

import type { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import type {
  Dispute,
  Arbitrator,
  CreateDisputeParams,
  VoteParams,
  VoteChoice,
  ContractCallOptions,
  ContractQueryOptions,
  ContractResult,
  Balance
} from './types';

// Import the contract metadata (will be generated from build)
import arbitrationMetadata from '../../../contracts-metadata/arbitration_dao.json';

/**
 * Wrapper for ArbitrationDAO smart contract interactions
 */
export class ArbitrationContract {
  private api: ApiPromise;
  private contract?: ContractPromise;
  private signer?: KeyringPair;
  private contractAddress?: string;

  constructor(api: ApiPromise, contractAddress?: string, signer?: KeyringPair) {
    this.api = api;
    this.signer = signer;
    this.contractAddress = contractAddress;

    if (contractAddress) {
      this.contract = new ContractPromise(this.api, arbitrationMetadata, contractAddress);
    }
  }

  /**
   * Initialize contract with address (if not set in constructor)
   */
  setContractAddress(address: string): void {
    this.contractAddress = address;
    this.contract = new ContractPromise(this.api, arbitrationMetadata, address);
  }

  /**
   * Update the signer for transactions
   */
  setSigner(signer: KeyringPair): void {
    this.signer = signer;
  }

  /**
   * Register as an arbitrator
   */
  async registerArbitrator(
    stakeAmount: Balance,
    options: ContractCallOptions = {}
  ): Promise<ContractResult<void>> {
    if (!this.contract) throw new Error('Contract not initialized');
    if (!this.signer) throw new Error('Signer not set');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 50000000000n,
      proofSize: 50000n,
    }) as WeightV2;

    const storageDepositLimit = options.storageDepositLimit || null;
    const value = options.value || stakeAmount;

    try {
      await this.contract.tx
        .registerArbitrator(
          { gasLimit, storageDepositLimit, value }
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
   * Increase arbitrator stake
   */
  async increaseArbitratorStake(
    additionalStake: Balance,
    options: ContractCallOptions = {}
  ): Promise<ContractResult<void>> {
    if (!this.contract) throw new Error('Contract not initialized');
    if (!this.signer) throw new Error('Signer not set');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 30000000000n,
      proofSize: 30000n,
    }) as WeightV2;

    try {
      await this.contract.tx
        .increaseArbitratorStake(
          { gasLimit, storageDepositLimit: options.storageDepositLimit || null, value: additionalStake }
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
   * Create a new dispute
   */
  async createDispute(
    params: CreateDisputeParams,
    options: ContractCallOptions = {}
  ): Promise<ContractResult<bigint>> {
    if (!this.contract) throw new Error('Contract not initialized');
    if (!this.signer) throw new Error('Signer not set');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 60000000000n,
      proofSize: 60000n,
    }) as WeightV2;

    try {
      const result = await this.contract.tx
        .createDispute(
          { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
          params.defendant,
          params.description,
          params.evidenceUri
        )
        .signAndSend(this.signer);

      // In production, extract dispute_id from events
      return {
        success: true,
        data: 0n, // Would extract from events
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Start voting period for a dispute
   */
  async startVoting(
    disputeId: bigint,
    options: ContractCallOptions = {}
  ): Promise<ContractResult<void>> {
    if (!this.contract) throw new Error('Contract not initialized');
    if (!this.signer) throw new Error('Signer not set');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 40000000000n,
      proofSize: 40000n,
    }) as WeightV2;

    try {
      await this.contract.tx
        .startVoting(
          { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
          disputeId
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
   * Cast a vote on a dispute
   */
  async vote(
    params: VoteParams,
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
        .vote(
          { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
          params.disputeId,
          params.choice
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
   * Finalize a dispute after voting period
   */
  async finalizeDispute(
    disputeId: bigint,
    options: ContractCallOptions = {}
  ): Promise<ContractResult<VoteChoice>> {
    if (!this.contract) throw new Error('Contract not initialized');
    if (!this.signer) throw new Error('Signer not set');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 50000000000n,
      proofSize: 50000n,
    }) as WeightV2;

    try {
      const result = await this.contract.tx
        .finalizeDispute(
          { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
          disputeId
        )
        .signAndSend(this.signer);

      // In production, extract resolution from events
      return {
        success: true,
        data: VoteChoice.InFavorOfClaimant, // Would extract from events
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Appeal a dispute decision
   */
  async appealDispute(
    disputeId: bigint,
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
        .appealDispute(
          { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
          disputeId
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
   * Get dispute details
   */
  async getDispute(
    disputeId: bigint,
    options: ContractQueryOptions = {}
  ): Promise<Dispute | null> {
    if (!this.contract) throw new Error('Contract not initialized');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 10000000000n,
      proofSize: 10000n,
    }) as WeightV2;

    try {
      const result = await this.contract.query.getDispute(
        this.signer?.address || this.contractAddress!,
        { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
        disputeId
      );

      if (result.result.isOk && result.output) {
        const data = result.output.toHuman() as any;
        if (data && data !== 'None') {
          return {
            disputeId: data.disputeId,
            claimant: data.claimant,
            defendant: data.defendant,
            description: data.description,
            evidenceUri: data.evidenceUri,
            status: data.status,
            createdAt: parseInt(data.createdAt),
            votingEndsAt: parseInt(data.votingEndsAt),
            votesForClaimant: BigInt(data.votesForClaimant.replace(/,/g, '')),
            votesForDefendant: BigInt(data.votesForDefendant.replace(/,/g, '')),
            resolution: data.resolution || undefined,
            canAppeal: data.canAppeal,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get dispute:', error);
      return null;
    }
  }

  /**
   * Get arbitrator information
   */
  async getArbitrator(
    account: string,
    options: ContractQueryOptions = {}
  ): Promise<Arbitrator | null> {
    if (!this.contract) throw new Error('Contract not initialized');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 10000000000n,
      proofSize: 10000n,
    }) as WeightV2;

    try {
      const result = await this.contract.query.getArbitrator(
        this.signer?.address || this.contractAddress!,
        { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
        account
      );

      if (result.result.isOk && result.output) {
        const data = result.output.toHuman() as any;
        if (data && data !== 'None') {
          return {
            account: data.account,
            stake: BigInt(data.stake.replace(/,/g, '')),
            disputesParticipated: parseInt(data.disputesParticipated),
            disputesResolved: parseInt(data.disputesResolved),
            reputation: parseInt(data.reputation),
            isActive: data.isActive,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get arbitrator:', error);
      return null;
    }
  }

  /**
   * Get vote for a specific arbitrator on a dispute
   */
  async getVote(
    disputeId: bigint,
    arbitrator: string,
    options: ContractQueryOptions = {}
  ): Promise<VoteChoice | null> {
    if (!this.contract) throw new Error('Contract not initialized');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 10000000000n,
      proofSize: 10000n,
    }) as WeightV2;

    try {
      const result = await this.contract.query.getVote(
        this.signer?.address || this.contractAddress!,
        { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
        disputeId,
        arbitrator
      );

      if (result.result.isOk && result.output) {
        const data = result.output.toHuman();
        if (data && data !== 'None') {
          return data as VoteChoice;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get vote:', error);
      return null;
    }
  }

  /**
   * Check if account is an active arbitrator
   */
  async isActiveArbitrator(
    account: string,
    options: ContractQueryOptions = {}
  ): Promise<boolean> {
    if (!this.contract) throw new Error('Contract not initialized');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 10000000000n,
      proofSize: 10000n,
    }) as WeightV2;

    try {
      const result = await this.contract.query.isActiveArbitrator(
        this.signer?.address || this.contractAddress!,
        { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
        account
      );

      if (result.result.isOk && result.output) {
        return result.output.toHuman() === true || result.output.toHuman() === 'true';
      }
      return false;
    } catch (error) {
      console.error('Failed to check active arbitrator:', error);
      return false;
    }
  }
}
