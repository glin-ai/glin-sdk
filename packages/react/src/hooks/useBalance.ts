import { useContext } from "react"
import { GlinContext } from "../context/GlinContext"

/**
 * Hook to access account balance
 *
 * @example
 * ```tsx
 * function BalanceDisplay() {
 *   const { balance, isLoading, error, refresh } = useBalance()
 *
 *   if (isLoading) return <p>Loading...</p>
 *   if (error) return <p>Error: {error.message}</p>
 *
 *   return (
 *     <div>
 *       <p>Free: {balance.free} GLIN</p>
 *       <p>Reserved: {balance.reserved} GLIN</p>
 *       <p>Total: {balance.total} GLIN</p>
 *       <button onClick={refresh}>Refresh</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useBalance() {
  const context = useContext(GlinContext)

  if (!context) {
    throw new Error("useBalance must be used within GlinProvider")
  }

  return {
    /** Balance information */
    balance: context.balance,
    /** Free balance (shorthand) */
    free: context.balance.free,
    /** Reserved balance (shorthand) */
    reserved: context.balance.reserved,
    /** Total balance (shorthand) */
    total: context.balance.total,
    /** Is loading */
    isLoading: context.balance.isLoading,
    /** Error */
    error: context.balance.error,
    /** Refresh balance */
    refresh: context.refreshBalance,
  }
}
