/**
 * @glin-ai/sdk-react
 *
 * React hooks and components for GLIN SDK
 */

// Provider & Context
export { GlinProvider } from "./context/GlinProvider"
export { GlinContext } from "./context/GlinContext"
export type { GlinProviderProps } from "./context/GlinProvider"

// Hooks
export { useWallet } from "./hooks/useWallet"
export { useAccount } from "./hooks/useAccount"
export { useBalance } from "./hooks/useBalance"
export { useAuth } from "./hooks/useAuth"
export { useGlinClient } from "./hooks/useGlinClient"
export { useGlinSigner } from "./hooks/useGlinSigner"

// Federated Learning Hooks
export { useFederatedTask } from "./hooks/useFederatedTask"
export { useProviderMining } from "./hooks/useProviderMining"
export { useRewards } from "./hooks/useRewards"

// Smart Contract Hooks
export { useContract } from "./hooks/useContract"
export { useContractQuery } from "./hooks/useContractQuery"
export { useContractTx } from "./hooks/useContractTx"
export { useContractDeploy } from "./hooks/useContractDeploy"
export type { UseContractOptions, UseContractReturn } from "./hooks/useContract"
export type { UseContractQueryOptions, UseContractQueryReturn } from "./hooks/useContractQuery"
export type { UseContractTxOptions, UseContractTxReturn } from "./hooks/useContractTx"
export type { UseContractDeployOptions, UseContractDeployReturn } from "./hooks/useContractDeploy"

// Components
export { ConnectWallet } from "./components/ConnectWallet"
export { AccountInfo } from "./components/AccountInfo"
export type { ConnectWalletProps } from "./components/ConnectWallet"
export type { AccountInfoProps } from "./components/AccountInfo"

// Types
export type {
  GlinConfig,
  WalletState,
  BalanceInfo,
  AuthResult,
  TransactionState,
  GlinContextState,
} from "./types"

// Error Classes
export {
  WalletError,
  WalletLockedError,
  WalletNotFoundError,
  WalletConnectionRejectedError,
  NetworkError,
  BalanceFetchError,
} from "./errors/WalletErrors"

// Error Utilities
export { classifyError } from "./utils/classifyError"
