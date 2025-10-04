/**
 * GLIN SDK - Official JavaScript/TypeScript SDK for GLIN AI Training Network
 */

// Core SDK exports
export { GlinAuth } from './auth';
export { GlinClient } from './client';
export { ProviderDetector } from './provider';
export { GlinTasks } from './tasks';
export { GlinProviders } from './providers';
export { GlinPoints } from './points';
export { GlinTransfer } from './transfer';

// Format utilities (following ethers.js pattern)
export { parseGLIN, formatGLIN, parseUnits, formatUnits } from './utils/format';

// Generic Smart Contract Support (ethers.js-like API)
export { Contract } from './contracts/contract';
export { deployContract, uploadCode, instantiateContract } from './contracts/deploy';
export {
  parseContractAbi,
  getContractMessages,
  isContractAddress,
  getContractCodeHash,
  getContractCode,
  decodeContractEvent,
  decodeContractCall,
  validateContractAbi,
  getContractStorageDeposit
} from './contracts/utils';

// Federated Learning Workflows
export { TaskCreatorWorkflow } from './workflows/TaskCreatorWorkflow';
export { ProviderWorkflow } from './workflows/ProviderWorkflow';
export { RewardWorkflow } from './workflows/RewardWorkflow';

// Federated Learning Patterns
export { FederatedLearningPattern } from './patterns/FederatedLearningPattern';
export { ProviderMiningPattern } from './patterns/ProviderMiningPattern';

// Core types
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
  InjectedExtension,
  GlinSigner
} from './types';

// Smart Contract types
export type {
  QueryResult,
  TxResult,
  ContractEvent,
  CallOptions
} from './contracts/contract';
export type {
  DeployOptions,
  DeployResult
} from './contracts/deploy';
export type {
  ContractMetadata,
  ContractMessage
} from './contracts/utils';

// Federated Learning types
export type {
  ModelType,
  TaskStatus,
  FederatedTask,
  HardwareRequirements,
  ProviderStatus,
  HardwareTier,
  FederatedProvider,
  HardwareSpec,
  GradientSubmission,
  QualityMetrics,
  ValidationProof,
  RewardBatch,
  ProviderReward,
  AggregationMethod,
  TrainingRound,
  CreateTaskParams,
  RegisterProviderParams,
  CreateRewardBatchParams,
  SubmitRewardsParams,
  FindTasksParams,
  CalculateRewardParams,
  CreateFederatedTaskParams,
  MiningConfig,
  TaskMonitorCallbacks
} from './types/federated';

// Version
export const VERSION = '0.5.0';
