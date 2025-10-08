import {
  WalletLockedError,
  WalletNotFoundError,
  WalletConnectionRejectedError,
  NetworkError,
  BalanceFetchError,
  WalletError,
} from "../errors/WalletErrors"

/**
 * Classify generic errors into specific wallet error types
 * based on error message content
 */
export function classifyError(error: Error): WalletError {
  const message = error.message.toLowerCase()

  // Wallet locked
  if (message.includes("locked") || message.includes("unlock")) {
    return new WalletLockedError(error.message)
  }

  // Wallet not found
  if (
    message.includes("no wallet found") ||
    message.includes("not found") ||
    message.includes("wallet not found") ||
    message.includes("please create") ||
    message.includes("please install")
  ) {
    return new WalletNotFoundError(error.message)
  }

  // Connection rejected
  if (
    message.includes("rejected") ||
    message.includes("denied") ||
    message.includes("cancelled") ||
    message.includes("canceled") ||
    message.includes("user closed")
  ) {
    return new WalletConnectionRejectedError(error.message)
  }

  // Network errors
  if (
    message.includes("network") ||
    message.includes("connection failed") ||
    message.includes("rpc") ||
    message.includes("timeout") ||
    message.includes("disconnected")
  ) {
    return new NetworkError(error.message)
  }

  // Balance fetch errors
  if (message.includes("balance")) {
    return new BalanceFetchError(error.message)
  }

  // Unknown error - wrap in generic WalletError
  return new WalletError(error.message, "UNKNOWN_ERROR", error)
}
