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

// Federated Learning Hooks
export { useFederatedTask } from "./hooks/useFederatedTask"
export { useProviderMining } from "./hooks/useProviderMining"
export { useRewards } from "./hooks/useRewards"

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
