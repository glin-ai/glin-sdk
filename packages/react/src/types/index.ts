import type { GlinAccount, GlinClient, GlinAuth } from "@glin-ai/sdk"

/**
 * Configuration for GlinProvider
 */
export interface GlinConfig {
  /** RPC endpoint URL (e.g., ws://localhost:9944) */
  providerUrl?: string
  /** App name for authentication */
  appName?: string
  /** Auto-connect on mount */
  autoConnect?: boolean
}

/**
 * Wallet connection state
 */
export interface WalletState {
  /** Currently connected account */
  account: GlinAccount | null
  /** Is wallet connected */
  isConnected: boolean
  /** Is connection in progress */
  isConnecting: boolean
  /** Connection error */
  error: Error | null
}

/**
 * Balance information
 */
export interface BalanceInfo {
  /** Free balance */
  free: string
  /** Reserved balance */
  reserved: string
  /** Total balance */
  total: string
  /** Is loading */
  isLoading: boolean
  /** Error if any */
  error: Error | null
}

/**
 * Authentication result
 */
export interface AuthResult {
  /** Account address */
  address: string
  /** Signed message */
  signature: string
  /** Original message */
  message: string
}

/**
 * Transaction state
 */
export interface TransactionState {
  /** Is transaction in progress */
  isLoading: boolean
  /** Transaction error */
  error: Error | null
  /** Transaction hash */
  hash?: string
}

/**
 * Glin context state
 */
export interface GlinContextState {
  // Configuration
  config: GlinConfig

  // SDK Instances
  auth: GlinAuth | null
  client: GlinClient | null

  // Wallet State
  wallet: WalletState

  // Balance
  balance: BalanceInfo

  // Actions
  connect: () => Promise<void>
  disconnect: () => void
  refreshBalance: () => Promise<void>
  authenticate: () => Promise<AuthResult>
}
