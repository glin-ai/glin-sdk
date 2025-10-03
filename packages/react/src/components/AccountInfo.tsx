import React from "react"
import { useAccount } from "../hooks/useAccount"
import { useBalance } from "../hooks/useBalance"

/**
 * Props for AccountInfo component
 */
export interface AccountInfoProps {
  /** Custom class name */
  className?: string
  /** Show balance */
  showBalance?: boolean
  /** Format address (number of chars to show on each side) */
  addressFormat?: number
  /** Custom renderer for address */
  renderAddress?: (address: string) => React.ReactNode
  /** Custom renderer for balance */
  renderBalance?: (balance: { free: string; reserved: string; total: string }) => React.ReactNode
}

/**
 * Utility to format address
 */
function formatAddress(address: string, chars: number = 6): string {
  if (!address) return ""
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

/**
 * Pre-built Account Info display component
 *
 * @example
 * ```tsx
 * function Header() {
 *   return (
 *     <AccountInfo
 *       showBalance
 *       addressFormat={8}
 *     />
 *   )
 * }
 * ```
 */
export function AccountInfo({
  className = "",
  showBalance = false,
  addressFormat = 6,
  renderAddress,
  renderBalance,
}: AccountInfoProps) {
  const { account, address, isConnected } = useAccount()
  const { balance, isLoading: balanceLoading } = useBalance()

  if (!isConnected || !address) {
    return <p className={className}>Not connected</p>
  }

  return (
    <div className={className}>
      <div>
        {renderAddress ? renderAddress(address) : (
          <>
            {account?.name && <p style={{ fontWeight: 600 }}>{account.name}</p>}
            <p style={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
              {formatAddress(address, addressFormat)}
            </p>
          </>
        )}
      </div>

      {showBalance && (
        <div style={{ marginTop: "0.5rem" }}>
          {balanceLoading ? (
            <p>Loading balance...</p>
          ) : renderBalance ? (
            renderBalance(balance)
          ) : (
            <p>
              Balance: {balance.free} GLIN
            </p>
          )}
        </div>
      )}
    </div>
  )
}
