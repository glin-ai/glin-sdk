import React from "react"
import { useWallet } from "../hooks/useWallet"

/**
 * Props for ConnectWallet component
 */
export interface ConnectWalletProps {
  /** Custom class name */
  className?: string
  /** Custom connect button text */
  connectText?: string
  /** Custom disconnect button text */
  disconnectText?: string
  /** Custom connecting button text */
  connectingText?: string
  /** Callback when connected */
  onConnect?: () => void
  /** Callback when disconnected */
  onDisconnect?: () => void
  /** Callback when error occurs */
  onError?: (error: Error) => void
}

/**
 * Pre-built Connect Wallet button component
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <ConnectWallet
 *       connectText="Connect GLIN"
 *       onConnect={() => console.log('Connected!')}
 *     />
 *   )
 * }
 * ```
 */
export function ConnectWallet({
  className = "",
  connectText = "Connect Wallet",
  disconnectText = "Disconnect",
  connectingText = "Connecting...",
  onConnect,
  onDisconnect,
  onError,
}: ConnectWalletProps) {
  const { connect, disconnect, isConnected, isConnecting, error, address } = useWallet()

  const handleConnect = async () => {
    try {
      await connect()
      onConnect?.()
    } catch (err) {
      if (err instanceof Error) {
        onError?.(err)
      }
    }
  }

  const handleDisconnect = () => {
    disconnect()
    onDisconnect?.()
  }

  // Show error state
  if (error && !isConnected) {
    return (
      <div className={className}>
        <button onClick={handleConnect}>{connectText}</button>
        <p style={{ color: "red", fontSize: "0.875rem" }}>{error.message}</p>
      </div>
    )
  }

  // Show connected state
  if (isConnected && address) {
    return (
      <button className={className} onClick={handleDisconnect}>
        {disconnectText}
      </button>
    )
  }

  // Show connecting state
  if (isConnecting) {
    return (
      <button className={className} disabled>
        {connectingText}
      </button>
    )
  }

  // Show connect button
  return (
    <button className={className} onClick={handleConnect}>
      {connectText}
    </button>
  )
}
