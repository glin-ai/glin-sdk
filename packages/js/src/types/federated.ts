/**
 * Federated Learning Types for GLIN SDK
 *
 * These types support the federated learning marketplace
 * where GPU providers train models in a distributed manner.
 */

// ============================================================================
// Task Types
// ============================================================================

export type ModelType = 'ResNet' | 'Bert' | 'Gpt' | 'Custom' | 'LoraFineTune'
export type TaskStatus = 'Pending' | 'Recruiting' | 'Running' | 'Validating' | 'Completed' | 'Failed' | 'Cancelled'

export interface FederatedTask {
  id: string
  creator: string
  name: string
  modelType: ModelType
  bounty: string
  minProviders: number
  maxProviders: number
  status: TaskStatus
  ipfsHash: string  // Initial model/dataset IPFS hash
  hardwareRequirements: HardwareRequirements
  createdAt: number
  completedAt?: number
}

export interface HardwareRequirements {
  minVramGb: number
  minComputeCapability: number  // e.g., 75 for RTX 3070 (7.5)
  minBandwidthMbps: number
}

// ============================================================================
// Provider Types
// ============================================================================

export type ProviderStatus = 'Active' | 'Idle' | 'Busy' | 'Offline' | 'Suspended' | 'Unbonding'
export type HardwareTier = 'Consumer' | 'Prosumer' | 'Professional'  // RTX 3060 | RTX 4090 | H100

export interface FederatedProvider {
  address: string
  stake: string
  reputation: number
  hardwareSpec: HardwareSpec
  status: ProviderStatus
  tasksCompleted: number
}

export interface HardwareSpec {
  vramGb: number
  computeCapability: number  // Stored as int (75 = 7.5)
  gpuModel: string
  bandwidthMbps: number
  tier: HardwareTier
}

// ============================================================================
// Gradient & Training Types
// ============================================================================

export interface GradientSubmission {
  taskId: string
  provider: string
  round: number
  gradientsIpfs: string  // Compressed gradients on IPFS
  qualityMetrics: QualityMetrics
  proof?: ValidationProof
}

export interface QualityMetrics {
  lossValue: number
  gradientNorm: number
  convergenceScore: number
}

export interface ValidationProof {
  type: 'statistical' | 'redundancy' | 'zkp'
  data: string
}

// ============================================================================
// Reward Types (Mining Pool Style)
// ============================================================================

export interface RewardBatch {
  batchId: string
  taskId: string
  totalBounty: string
  coordinator: string
  createdAt: number
  settled: boolean
  merkleRoot: string
}

export interface ProviderReward {
  provider: string
  amount: string
  gradientsContributed: number
  qualityScore: number  // 0-1000
  hardwareMultiplier: number  // Stored as int, divide by 100 (150 = 1.5x)
}

// ============================================================================
// Aggregation Types
// ============================================================================

export type AggregationMethod = 'FedAvg' | 'FedProx' | 'FedOpt'

export interface TrainingRound {
  roundNumber: number
  participants: string[]
  aggregatedModelIpfs: string
  avgLoss: number
  participationRate: number
}

// ============================================================================
// Workflow Parameter Types
// ============================================================================

export interface CreateTaskParams {
  name: string
  modelType: ModelType
  initialModelIpfs: string
  bounty: bigint
  minProviders: number
  maxProviders: number
  hardwareRequirements: HardwareRequirements
}

export interface RegisterProviderParams {
  stake: bigint
  hardwareSpec: HardwareSpec
}

export interface CreateRewardBatchParams {
  taskId: string
  totalBounty: bigint
}

export interface SubmitRewardsParams {
  batchId: string
  rewards: ProviderReward[]
}

export interface FindTasksParams {
  minReward?: bigint
  modelTypes?: ModelType[]
  maxVramRequired?: number
}

export interface CalculateRewardParams {
  totalBounty: bigint
  gradientsContributed: number
  totalGradients: number
  qualityScore: number  // 0-1000
  hardwareMultiplier: number  // 100 = 1.0x, 150 = 1.5x
  reputationBonus: number  // 0-100 (percentage)
}

// ============================================================================
// Pattern Types (High-level API)
// ============================================================================

export interface CreateFederatedTaskParams {
  name: string
  model: 'llama-3-8b' | 'resnet50' | 'bert-base' | 'custom'
  datasetIpfs: string
  reward: bigint
  minProviders: number
  rounds: number
}

export interface MiningConfig {
  hardwareSpec: HardwareSpec
  stake: bigint
  minRewardPerGradient: bigint
  modelPreferences?: ModelType[]
}

// ============================================================================
// Callback Types
// ============================================================================

export interface TaskMonitorCallbacks {
  onProviderJoin?: (provider: string) => void
  onRoundComplete?: (round: TrainingRound) => void
  onTaskComplete?: (finalModelIpfs: string) => void
}
