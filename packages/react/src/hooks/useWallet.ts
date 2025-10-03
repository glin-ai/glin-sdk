import { useContext } from "react"
import { GlinContext } from "../context/GlinContext"

/**
 * Hook to access wallet connection functionality
 *
 * @example
 * ```tsx
 * function ConnectButton() {
 *   const { connect, disconnect, isConnected, isConnecting, error } = useWallet()
 *
 *   if (isConnected) {
 *     return <button onClick={disconnect}>Disconnect</button>
 *   }
 *
 *   return (
 *     <button onClick={connect} disabled={isConnecting}>
 *       {isConnecting ? 'Connecting...' : 'Connect Wallet'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useWallet() {
  const context = useContext(GlinContext)

  if (!context) {
    throw new Error("useWallet must be used within GlinProvider")
  }

  return {
    /** Connect wallet */
    connect: context.connect,
    /** Disconnect wallet */
    disconnect: context.disconnect,
    /** Is wallet connected */
    isConnected: context.wallet.isConnected,
    /** Is connection in progress */
    isConnecting: context.wallet.isConnecting,
    /** Connection error */
    error: context.wallet.error,
    /** Current account */
    account: context.wallet.account,
    /** Account address (shorthand) */
    address: context.wallet.account?.address,
  }
}
