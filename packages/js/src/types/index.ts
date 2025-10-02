/**
 * Core types for GLIN SDK
 */

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
