import { useContext } from "react"
import { GlinContext } from "../context/GlinContext"

/**
 * Hook to access current account information
 *
 * @example
 * ```tsx
 * function AccountDisplay() {
 *   const { account, address, isConnected } = useAccount()
 *
 *   if (!isConnected) {
 *     return <p>Not connected</p>
 *   }
 *
 *   return (
 *     <div>
 *       <p>Address: {address}</p>
 *       <p>Name: {account?.name}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useAccount() {
  const context = useContext(GlinContext)

  if (!context) {
    throw new Error("useAccount must be used within GlinProvider")
  }

  return {
    /** Current account */
    account: context.wallet.account,
    /** Account address (shorthand) */
    address: context.wallet.account?.address,
    /** Is wallet connected */
    isConnected: context.wallet.isConnected,
  }
}
