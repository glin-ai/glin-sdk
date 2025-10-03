/**
 * Core types for GLIN SDK
 */

export * from './signer';

export interface GlinAccount {
  address: string;
  name?: string;
  source?: 'extension' | 'direct' | 'walletconnect';
}

export interface SignatureResult {
  signature: string;
  address: string;
  message: string;
}

export interface AuthResult {
  address: string;
  signature: string;
  message: string;
  timestamp: number;
}

export interface Balance {
  free: string;
  reserved: string;
  frozen: string;
  total: string;
}

export interface ChainTask {
  id: string;
  creator: string;
  bounty: string;
  minProviders: number;
  maxProviders: number;
  ipfsHash: string;
  status: 'Pending' | 'Recruiting' | 'Running' | 'Validating' | 'Completed' | 'Failed' | 'Cancelled';
}

export interface ChainProvider {
  account: string;
  stake: string;
  reputationScore: number;
  hardwareTier: 'Consumer' | 'Prosumer' | 'Professional';
  status: 'Active' | 'Idle' | 'Busy' | 'Offline' | 'Suspended' | 'Unbonding';
  isSlashed: boolean;
}

export interface ProviderStake {
  address: string;
  stake: string;
  reputation: number;
  tasksCompleted: number;
  isActive: boolean;
}

export interface TestnetPoints {
  address: string;
  points: number;
  lastUpdated: number;
}

export interface ExtrinsicInfo {
  hash: string;
  method: string;
  section: string;
  args?: string[];
}

export interface EventInfo {
  section: string;
  method: string;
  data: Record<string, unknown>;
}

export interface BlockInfo {
  number: number;
  hash: string;
  parentHash: string;
  stateRoot: string;
  extrinsicsRoot: string;
  author?: string;
  timestamp?: number;
  extrinsics?: ExtrinsicInfo[];
  isNew?: boolean;
  receivedAt?: number;
}

export interface TransactionInfo {
  hash: string;
  blockNumber: number;
  blockHash: string;
  method: string;
  section: string;
  args: string[];
  signer?: string;
  success: boolean;
  fee?: string;
  events?: EventInfo[];
}

export interface AccountInfo {
  address: string;
  nonce: number;
  balance: {
    free: string;
    reserved: string;
    frozen: string;
  };
}

export interface Task {
  id: string;
  creator: string;
  bounty: string;
  status: string;
  modelType: string;
  providers: string[];
}

export interface SearchResult {
  type: 'block' | 'transaction' | 'account' | 'task';
  data: BlockInfo | AccountInfo | Task | TransactionInfo;
}

export interface GlinSDKConfig {
  rpcUrl?: string;
  preferExtension?: boolean;
}

export interface InjectedExtension {
  name: string;
  version: string;
  enable: () => Promise<GlinAccount[]>;
  signMessage: (message: string) => Promise<SignatureResult>;
  isConnected: () => boolean;
  getAccounts: () => Promise<GlinAccount[]>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    glin?: InjectedExtension;
  }
}
