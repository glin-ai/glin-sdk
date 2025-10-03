import { createContext } from "react"
import type { GlinContextState } from "../types"

/**
 * Default context value (used before provider is mounted)
 */
const defaultContextValue: GlinContextState = {
  config: {},
  auth: null,
  client: null,
  contracts: null,
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
  connect: async () => {
    throw new Error("GlinProvider not found. Wrap your app with <GlinProvider>")
  },
  disconnect: () => {
    throw new Error("GlinProvider not found. Wrap your app with <GlinProvider>")
  },
  refreshBalance: async () => {
    throw new Error("GlinProvider not found. Wrap your app with <GlinProvider>")
  },
  authenticate: async () => {
    throw new Error("GlinProvider not found. Wrap your app with <GlinProvider>")
  },
}

/**
 * Glin React Context
 * Provides access to wallet, client, and contract state
 */
export const GlinContext = createContext<GlinContextState>(defaultContextValue)
