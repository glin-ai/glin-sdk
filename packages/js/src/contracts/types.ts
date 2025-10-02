/**
 * Smart Contract Types for GLIN SDK
 */

import type { AccountId, Balance } from '../types';

// ============================================================================
// Common Types
// ============================================================================

export interface ContractCallOptions {
  gasLimit?: bigint;
  storageDepositLimit?: bigint;
  value?: bigint;
}

export interface ContractQueryOptions {
  gasLimit?: bigint;
  storageDepositLimit?: bigint;
}

export interface ContractResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  gasConsumed?: bigint;
  storageDeposit?: bigint;
}

export interface ContractEvent {
  name: string;
  args: Record<string, any>;
  blockNumber: number;
  timestamp: number;
}

// ============================================================================
// Escrow Types
// ============================================================================

export enum MilestoneStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Disputed = 'Disputed',
  Resolved = 'Resolved',
  Cancelled = 'Cancelled'
}

export interface Milestone {
  description: string;
  amount: Balance;
  status: MilestoneStatus;
  deadline: number; // timestamp
  oracleVerification: boolean;
}

export interface Agreement {
  client: AccountId;
  provider: AccountId;
  totalAmount: Balance;
  depositedAmount: Balance;
  createdAt: number; // timestamp
  disputeTimeout: number; // timestamp
  oracle?: AccountId;
  isActive: boolean;
}

export interface CreateAgreementParams {
  provider: AccountId;
  milestoneDescriptions: string[];
  milestoneAmounts: Balance[];
  milestoneDeadlines: number[];
  disputeTimeout: number;
  oracle?: AccountId;
  value: Balance; // Amount to deposit
}

// ============================================================================
// Registry Types
// ============================================================================

export enum ProfessionalRole {
  Lawyer = 'Lawyer',
  Doctor = 'Doctor',
  Arbitrator = 'Arbitrator',
  Notary = 'Notary',
  Auditor = 'Auditor',
  ConsultantOther = 'ConsultantOther'
}

export interface ProfessionalProfile {
  account: AccountId;
  role: ProfessionalRole;
  stakeAmount: Balance;
  reputationScore: number;
  totalJobs: number;
  successfulJobs: number;
  registeredAt: number; // timestamp
  isActive: boolean;
  metadataUri: string;
}

export interface Review {
  reviewer: AccountId;
  rating: number; // 1-5
  comment: string;
  timestamp: number;
}

export interface RegisterProfessionalParams {
  role: ProfessionalRole;
  metadataUri: string;
  stakeAmount: Balance;
}

export interface SubmitReviewParams {
  professional: AccountId;
  rating: number;
  comment: string;
}

// ============================================================================
// Arbitration Types
// ============================================================================

export enum DisputeStatus {
  Open = 'Open',
  Voting = 'Voting',
  Resolved = 'Resolved',
  Appealed = 'Appealed',
  Cancelled = 'Cancelled'
}

export enum VoteChoice {
  InFavorOfClaimant = 'InFavorOfClaimant',
  InFavorOfDefendant = 'InFavorOfDefendant'
}

export interface Dispute {
  disputeId: string;
  claimant: AccountId;
  defendant: AccountId;
  description: string;
  evidenceUri: string;
  status: DisputeStatus;
  createdAt: number; // timestamp
  votingEndsAt: number; // timestamp
  votesForClaimant: Balance;
  votesForDefendant: Balance;
  resolution?: VoteChoice;
  canAppeal: boolean;
}

export interface Arbitrator {
  account: AccountId;
  stake: Balance;
  disputesParticipated: number;
  disputesResolved: number;
  reputation: number;
  isActive: boolean;
}

export interface CreateDisputeParams {
  defendant: AccountId;
  description: string;
  evidenceUri: string;
}

export interface VoteParams {
  disputeId: string;
  choice: VoteChoice;
}

// ============================================================================
// Contract Metadata
// ============================================================================

export interface ContractMetadata {
  source: {
    hash: string;
    language: string;
    compiler: string;
  };
  contract: {
    name: string;
    version: string;
    authors: string[];
  };
  spec: {
    constructors: any[];
    messages: any[];
    events: any[];
  };
}

export interface ContractInfo {
  address: AccountId;
  metadata: ContractMetadata;
  codeHash: string;
}
