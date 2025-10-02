/**
 * GLIN SDK - Official JavaScript/TypeScript SDK for GLIN AI Training Network
 */

export { GlinAuth } from './auth';
export { GlinClient } from './client';
export { ProviderDetector } from './provider';
export { GlinTasks } from './tasks';
export { GlinProviders } from './providers';
export { GlinPoints } from './points';
export { GlinTransfer } from './transfer';

// Smart Contracts
export { GlinContracts } from './contracts';
export { EscrowContract } from './contracts/escrow';
export { RegistryContract } from './contracts/registry';
export { ArbitrationContract } from './contracts/arbitration';

export type {
  GlinAccount,
  SignatureResult,
  AuthResult,
  Balance,
  ChainTask,
  ChainProvider,
  ProviderStake,
  TestnetPoints,
  ExtrinsicInfo,
  EventInfo,
  BlockInfo,
  TransactionInfo,
  AccountInfo,
  Task,
  SearchResult,
  GlinSDKConfig,
  InjectedExtension
} from './types';

// Contract types
export type {
  Agreement,
  Milestone,
  MilestoneStatus,
  CreateAgreementParams,
  ProfessionalProfile,
  ProfessionalRole,
  Review,
  RegisterProfessionalParams,
  SubmitReviewParams,
  Dispute,
  DisputeStatus,
  Arbitrator,
  CreateDisputeParams,
  VoteParams,
  VoteChoice,
  ContractCallOptions,
  ContractQueryOptions,
  ContractResult,
  ContractEvent,
  ContractMetadata,
  ContractInfo,
  GlinContractsConfig
} from './contracts/types';

// Version
export const VERSION = '0.3.0';
