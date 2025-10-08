/**
 * Base wallet error class
 */
export class WalletError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = "WalletError"

    // Maintain proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

/**
 * Error thrown when wallet is locked
 */
export class WalletLockedError extends WalletError {
  constructor(message = "Wallet is locked. Please unlock your wallet first.") {
    super(message, "WALLET_LOCKED")
    this.name = "WalletLockedError"
  }
}

/**
 * Error thrown when no wallet is found
 */
export class WalletNotFoundError extends WalletError {
  constructor(message = "No wallet found. Please install GLIN Wallet extension.") {
    super(message, "WALLET_NOT_FOUND")
    this.name = "WalletNotFoundError"
  }
}

/**
 * Error thrown when user rejects connection
 */
export class WalletConnectionRejectedError extends WalletError {
  constructor(message = "User rejected the connection request.") {
    super(message, "CONNECTION_REJECTED")
    this.name = "WalletConnectionRejectedError"
  }
}

/**
 * Error thrown on network failures
 */
export class NetworkError extends WalletError {
  constructor(message = "Network connection failed.") {
    super(message, "NETWORK_ERROR")
    this.name = "NetworkError"
  }
}

/**
 * Error thrown when balance fetch fails
 */
export class BalanceFetchError extends WalletError {
  constructor(message = "Failed to fetch balance.") {
    super(message, "BALANCE_FETCH_ERROR")
    this.name = "BalanceFetchError"
  }
}
