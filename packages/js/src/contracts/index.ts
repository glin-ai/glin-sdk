/**
 * GLIN Contracts Client
 *
 * Provides high-level access to GLIN smart contracts:
 * - GenericEscrow: Milestone-based payments
 * - ProfessionalRegistry: Reputation system
 * - ArbitrationDAO: Dispute resolution
 */

import type { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import type { KeyringPair } from '@polkadot/keyring/types';
import { EscrowContract } from './escrow';
import { RegistryContract } from './registry';
import { ArbitrationContract } from './arbitration';
import type { ContractMetadata, ContractInfo } from './types';

export interface GlinContractsConfig {
  api: ApiPromise;
  signer?: KeyringPair;
  escrowAddress?: string;
  registryAddress?: string;
  arbitrationAddress?: string;
}

/**
 * Main entry point for interacting with GLIN smart contracts
 *
 * @example
 * ```typescript
 * import { GlinContracts } from '@glin-ai/sdk';
 *
 * const contracts = new GlinContracts({
 *   api: polkadotApi,
 *   signer: keyringPair,
 *   escrowAddress: '5Gw8...',
 *   registryAddress: '5Hx9...',
 *   arbitrationAddress: '5Jy0...'
 * });
 *
 * // Create escrow agreement
 * const agreementId = await contracts.escrow.createAgreement({
 *   provider: '5Provider...',
 *   milestoneDescriptions: ['Design', 'Development'],
 *   milestoneAmounts: [500n * 10n**18n, 1500n * 10n**18n],
 *   milestoneDeadlines: [Date.now() + 86400000, Date.now() + 172800000],
 *   disputeTimeout: Date.now() + 259200000,
 *   value: 2000n * 10n**18n
 * });
 * ```
 */
export class GlinContracts {
  private api: ApiPromise;
  private signer?: KeyringPair;

  public readonly escrow: EscrowContract;
  public readonly registry: RegistryContract;
  public readonly arbitration: ArbitrationContract;

  constructor(config: GlinContractsConfig) {
    this.api = config.api;
    this.signer = config.signer;

    // Initialize contract wrappers
    this.escrow = new EscrowContract(
      this.api,
      config.escrowAddress,
      this.signer
    );

    this.registry = new RegistryContract(
      this.api,
      config.registryAddress,
      this.signer
    );

    this.arbitration = new ArbitrationContract(
      this.api,
      config.arbitrationAddress,
      this.signer
    );
  }

  /**
   * Update the signer for all contracts
   */
  setSigner(signer: KeyringPair) {
    this.signer = signer;
    this.escrow.setSigner(signer);
    this.registry.setSigner(signer);
    this.arbitration.setSigner(signer);
  }

  /**
   * Get contract information including metadata and code hash
   */
  async getContractInfo(address: string): Promise<ContractInfo | null> {
    try {
      const contractInfo = await this.api.query.contracts.contractInfoOf(address);

      if (contractInfo.isNone) {
        return null;
      }

      // In a real implementation, we'd also fetch the metadata
      // For now, return basic info
      return {
        address,
        metadata: {} as ContractMetadata, // Would load from IPFS/HTTP
        codeHash: contractInfo.unwrap().codeHash.toHex()
      };
    } catch (error) {
      console.error('Failed to get contract info:', error);
      return null;
    }
  }

  /**
   * Estimate gas for a contract call
   */
  async estimateGas(
    contractAddress: string,
    message: string,
    args: any[],
    value: bigint = 0n
  ): Promise<bigint> {
    // This is a simplified gas estimation
    // In production, you'd use the contract's actual gas estimation
    return 100000000000n; // 100 million gas units as default
  }

  /**
   * Check if an address is a valid contract
   */
  async isContract(address: string): Promise<boolean> {
    try {
      const contractInfo = await this.api.query.contracts.contractInfoOf(address);
      return contractInfo.isSome;
    } catch {
      return false;
    }
  }

  /**
   * Get the balance of a contract
   */
  async getContractBalance(address: string): Promise<bigint> {
    const accountInfo = await this.api.query.system.account(address);
    return BigInt(accountInfo.data.free.toString());
  }
}

// Re-export contract classes for direct use
export { EscrowContract } from './escrow';
export { RegistryContract } from './registry';
export { ArbitrationContract } from './arbitration';

// Re-export types
export * from './types';
