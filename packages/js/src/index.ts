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
export const VERSION = '0.3.0';
