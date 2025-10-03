import React, { useEffect, useMemo } from "react"
import { create } from "zustand"
import type { GlinAccount } from "@glin-ai/sdk"
import { GlinContext } from "./GlinContext"
import type { GlinConfig, GlinContextState, WalletState, BalanceInfo, AuthResult } from "../types"
import {
  getAuthInstance,
  getClientInstance,
  resetInstances,
  getCurrentAuthInstance,
  getCurrentClientInstance,
} from "../utils/singleton"

/**
 * Internal store state
 */
interface GlinStore {
  wallet: WalletState
  balance: BalanceInfo
  setWallet: (wallet: Partial<WalletState>) => void
  setBalance: (balance: Partial<BalanceInfo>) => void
}

/**
 * Create Zustand store
 */
const useGlinStore = create<GlinStore>((set) => ({
  wallet: {
    account: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  },
  balance: {
    free: "0",
    reserved: "0",
    total: "0",
    isLoading: false,
    error: null,
  },
  setWallet: (updates) =>
    set((state) => ({
      wallet: { ...state.wallet, ...updates },
    })),
  setBalance: (updates) =>
    set((state) => ({
      balance: { ...state.balance, ...updates },
    })),
}))

/**
 * Provider props
 */
export interface GlinProviderProps {
  children: React.ReactNode
  config?: GlinConfig
}

/**
 * GlinProvider component
 * Wrap your app with this to enable GLIN SDK hooks
 */
export function GlinProvider({ children, config = {} }: GlinProviderProps) {
  const { wallet, balance, setWallet, setBalance } = useGlinStore()

  /**
   * Connect wallet
   */
  const connect = async () => {
    if (typeof window === "undefined") {
      throw new Error("connect() can only be called in the browser")
    }

    setWallet({ isConnecting: true, error: null })

    try {
      const auth = getAuthInstance()
      const account = await auth.connect()

      setWallet({
        account,
        isConnected: true,
        isConnecting: false,
        error: null,
      })

      // Initialize client
      await getClientInstance(config)

      // Setup event listeners
      auth.onAccountsChanged((accounts: GlinAccount[]) => {
        if (accounts.length > 0) {
          setWallet({ account: accounts[0] })
          refreshBalance()
        } else {
          disconnect()
        }
      })

      auth.onDisconnect(() => {
        disconnect()
      })

      // Fetch balance
      await refreshBalance()
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Failed to connect wallet")
      setWallet({
        error: err,
        isConnecting: false,
        isConnected: false,
      })
      throw err
    }
  }

  /**
   * Disconnect wallet
   */
  const disconnect = () => {
    const auth = getCurrentAuthInstance()
    if (auth) {
      auth.disconnect()
    }

    resetInstances()

    setWallet({
      account: null,
      isConnected: false,
      error: null,
    })

    setBalance({
      free: "0",
      reserved: "0",
      total: "0",
      isLoading: false,
      error: null,
    })
  }

  /**
   * Refresh balance
   */
  const refreshBalance = async () => {
    const { account } = wallet

    if (!account) {
      return
    }

    setBalance({ isLoading: true, error: null })

    try {
      const client = getCurrentClientInstance()

      if (!client) {
        throw new Error("Client not initialized")
      }

      const balanceData = await client.getBalance(account.address)

      setBalance({
        free: balanceData.free.toString(),
        reserved: balanceData.reserved.toString(),
        total: balanceData.total.toString(),
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Failed to fetch balance")
      setBalance({
        isLoading: false,
        error: err,
      })
    }
  }

  /**
   * Authenticate (connect + sign message)
   */
  const authenticate = async (): Promise<AuthResult> => {
    if (typeof window === "undefined") {
      throw new Error("authenticate() can only be called in the browser")
    }

    const auth = getAuthInstance()
    const appName = config.appName || "GLIN App"

    const result = await auth.authenticate(appName)

    return {
      address: result.address,
      signature: result.signature,
      message: result.message,
    }
  }

  /**
   * Auto-connect on mount if enabled
   */
  useEffect(() => {
    if (config.autoConnect && typeof window !== "undefined") {
      connect().catch((err) => {
        console.error("Auto-connect failed:", err)
      })
    }
  }, [config.autoConnect])

  /**
   * Context value
   */
  const contextValue: GlinContextState = useMemo(
    () => ({
      config,
      auth: getCurrentAuthInstance(),
      client: getCurrentClientInstance(),
      wallet,
      balance,
      connect,
      disconnect,
      refreshBalance,
      authenticate,
    }),
    [wallet, balance, config]
  )

  return <GlinContext.Provider value={contextValue}>{children}</GlinContext.Provider>
}
