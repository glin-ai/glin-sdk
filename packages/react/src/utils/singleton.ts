import { GlinAuth, GlinClient } from "@glin-ai/sdk"
import type { GlinConfig } from "../types"

/**
 * Singleton instances for SDK classes
 * Ensures only one instance exists across the app
 */
let authInstance: GlinAuth | null = null
let clientInstance: GlinClient | null = null

/**
 * Get or create GlinAuth singleton
 */
export function getAuthInstance(): GlinAuth {
  if (typeof window === "undefined") {
    throw new Error("GlinAuth can only be initialized in the browser")
  }

  if (!authInstance) {
    authInstance = new GlinAuth({
      preferExtension: true,
    })
  }

  return authInstance
}

/**
 * Get or create GlinClient singleton
 */
export async function getClientInstance(config: GlinConfig): Promise<GlinClient> {
  if (typeof window === "undefined") {
    throw new Error("GlinClient can only be initialized in the browser")
  }

  if (clientInstance) {
    return clientInstance
  }

  const rpcUrl = config.providerUrl || "ws://localhost:9944"
  clientInstance = new GlinClient(rpcUrl)
  await clientInstance.connect()

  return clientInstance
}

/**
 * Reset all singleton instances
 * Call this on disconnect
 */
export function resetInstances(): void {
  authInstance = null
  clientInstance = null
}

/**
 * Get current auth instance (may be null)
 */
export function getCurrentAuthInstance(): GlinAuth | null {
  return authInstance
}

/**
 * Get current client instance (may be null)
 */
export function getCurrentClientInstance(): GlinClient | null {
  return clientInstance
}
