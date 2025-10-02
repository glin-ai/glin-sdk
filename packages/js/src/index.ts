/**
 * GLIN SDK - Official JavaScript/TypeScript SDK for GLIN AI Training Network
 */

export { GlinAuth } from './auth';
export { GlinClient } from './client';
export { ProviderDetector } from './provider';

export type {
  GlinAccount,
  SignatureResult,
  AuthResult,
  Balance,
  ChainTask,
  ChainProvider,
  GlinSDKConfig,
  InjectedExtension
} from './types';

// Version
export const VERSION = '0.1.0';
