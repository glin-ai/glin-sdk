/**
 * ProfessionalRegistry Contract Wrapper
 *
 * Provides methods to interact with the ProfessionalRegistry smart contract
 * for professional registration, reputation management, and reviews.
 */

import type { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import type {
  ProfessionalProfile,
  ProfessionalRole,
  Review,
  RegisterProfessionalParams,
  SubmitReviewParams,
  ContractCallOptions,
  ContractQueryOptions,
  ContractResult,
  Balance
} from './types';

// Import the contract metadata (will be generated from build)
import registryMetadata from '../../../contracts-metadata/professional_registry.json';

/**
 * Wrapper for ProfessionalRegistry smart contract interactions
 */
export class RegistryContract {
  private api: ApiPromise;
  private contract?: ContractPromise;
  private signer?: KeyringPair;
  private contractAddress?: string;

  constructor(api: ApiPromise, contractAddress?: string, signer?: KeyringPair) {
    this.api = api;
    this.signer = signer;
    this.contractAddress = contractAddress;

    if (contractAddress) {
      this.contract = new ContractPromise(this.api, registryMetadata, contractAddress);
    }
  }

  /**
   * Initialize contract with address (if not set in constructor)
   */
  setContractAddress(address: string): void {
    this.contractAddress = address;
    this.contract = new ContractPromise(this.api, registryMetadata, address);
  }

  /**
   * Update the signer for transactions
   */
  setSigner(signer: KeyringPair): void {
    this.signer = signer;
  }

  /**
   * Register as a professional
   */
  async register(
    params: RegisterProfessionalParams,
    options: ContractCallOptions = {}
  ): Promise<ContractResult<void>> {
    if (!this.contract) throw new Error('Contract not initialized');
    if (!this.signer) throw new Error('Signer not set');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 50000000000n,
      proofSize: 50000n,
    }) as WeightV2;

    const storageDepositLimit = options.storageDepositLimit || null;
    const value = options.value || params.stakeAmount;

    try {
      await this.contract.tx
        .register(
          { gasLimit, storageDepositLimit, value },
          params.role,
          params.metadataUri
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
   * Increase stake amount
   */
  async increaseStake(
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
        .increaseStake(
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
   * Submit a review for a professional
   */
  async submitReview(
    params: SubmitReviewParams,
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
        .submitReview(
          { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
          params.professional,
          params.rating,
          params.comment
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
   * Withdraw stake (deactivates profile)
   */
  async withdrawStake(
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
        .withdrawStake(
          { gasLimit, storageDepositLimit: options.storageDepositLimit || null }
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
   * Get professional profile
   */
  async getProfile(
    account: string,
    options: ContractQueryOptions = {}
  ): Promise<ProfessionalProfile | null> {
    if (!this.contract) throw new Error('Contract not initialized');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 10000000000n,
      proofSize: 10000n,
    }) as WeightV2;

    try {
      const result = await this.contract.query.getProfile(
        this.signer?.address || this.contractAddress!,
        { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
        account
      );

      if (result.result.isOk && result.output) {
        const data = result.output.toHuman() as any;
        if (data && data !== 'None') {
          return {
            account: data.account,
            role: data.role as ProfessionalRole,
            stakeAmount: BigInt(data.stakeAmount.replace(/,/g, '')),
            reputationScore: parseInt(data.reputationScore),
            totalJobs: parseInt(data.totalJobs),
            successfulJobs: parseInt(data.successfulJobs),
            registeredAt: parseInt(data.registeredAt),
            isActive: data.isActive,
            metadataUri: data.metadataUri,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get profile:', error);
      return null;
    }
  }

  /**
   * Get review by index
   */
  async getReview(
    professional: string,
    reviewIndex: number,
    options: ContractQueryOptions = {}
  ): Promise<Review | null> {
    if (!this.contract) throw new Error('Contract not initialized');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 10000000000n,
      proofSize: 10000n,
    }) as WeightV2;

    try {
      const result = await this.contract.query.getReview(
        this.signer?.address || this.contractAddress!,
        { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
        professional,
        reviewIndex
      );

      if (result.result.isOk && result.output) {
        const data = result.output.toHuman() as any;
        if (data && data !== 'None') {
          return {
            reviewer: data.reviewer,
            rating: parseInt(data.rating),
            comment: data.comment,
            timestamp: parseInt(data.timestamp),
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get review:', error);
      return null;
    }
  }

  /**
   * Get review count for a professional
   */
  async getReviewCount(
    professional: string,
    options: ContractQueryOptions = {}
  ): Promise<number> {
    if (!this.contract) throw new Error('Contract not initialized');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 10000000000n,
      proofSize: 10000n,
    }) as WeightV2;

    try {
      const result = await this.contract.query.getReviewCount(
        this.signer?.address || this.contractAddress!,
        { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
        professional
      );

      if (result.result.isOk && result.output) {
        return parseInt(result.output.toString());
      }
      return 0;
    } catch (error) {
      console.error('Failed to get review count:', error);
      return 0;
    }
  }

  /**
   * Get minimum stake required for a role
   */
  async getMinStake(
    role: ProfessionalRole,
    options: ContractQueryOptions = {}
  ): Promise<bigint> {
    if (!this.contract) throw new Error('Contract not initialized');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 10000000000n,
      proofSize: 10000n,
    }) as WeightV2;

    try {
      const result = await this.contract.query.getMinStake(
        this.signer?.address || this.contractAddress!,
        { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
        role
      );

      if (result.result.isOk && result.output) {
        return BigInt(result.output.toString().replace(/,/g, ''));
      }
      return 0n;
    } catch (error) {
      console.error('Failed to get min stake:', error);
      return 0n;
    }
  }

  /**
   * Check if account is an active professional
   */
  async isActiveProfessional(
    account: string,
    options: ContractQueryOptions = {}
  ): Promise<boolean> {
    if (!this.contract) throw new Error('Contract not initialized');

    const gasLimit = options.gasLimit || this.api.registry.createType('WeightV2', {
      refTime: 10000000000n,
      proofSize: 10000n,
    }) as WeightV2;

    try {
      const result = await this.contract.query.isActiveProfessional(
        this.signer?.address || this.contractAddress!,
        { gasLimit, storageDepositLimit: options.storageDepositLimit || null },
        account
      );

      if (result.result.isOk && result.output) {
        return result.output.toHuman() === true || result.output.toHuman() === 'true';
      }
      return false;
    } catch (error) {
      console.error('Failed to check active professional:', error);
      return false;
    }
  }

  /**
   * Get all reviews for a professional (convenience method)
   */
  async getAllReviews(
    professional: string,
    options: ContractQueryOptions = {}
  ): Promise<Review[]> {
    const count = await this.getReviewCount(professional, options);
    const reviews: Review[] = [];

    for (let i = 0; i < count; i++) {
      const review = await this.getReview(professional, i, options);
      if (review) {
        reviews.push(review);
      }
    }

    return reviews;
  }
}
