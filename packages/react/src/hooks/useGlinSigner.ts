import { useContext, useState, useEffect } from "react"
import { GlinContext } from "../context/GlinContext"
import type { GlinSigner } from "@glin-ai/sdk"

/**
 * Hook to get signer for signing blockchain transactions
 * Returns both the signer and address needed for workflows
 *
 * @example
 * ```tsx
 * function CreateTask() {
 *   const { client } = useGlinClient()
 *   const { signer, address, isLoading, error } = useGlinSigner()
 *
 *   async function handleCreateTask() {
 *     if (!client || !signer || !address) return
 *
 *     const workflow = new TaskCreatorWorkflow(
 *       client.getApi(),
 *       signer,
 *       address
 *     )
 *
 *     const taskId = await workflow.createTask({...})
 *   }
 * }
 * ```
 */
export function useGlinSigner() {
  const context = useContext(GlinContext)
  const [signer, setSigner] = useState<GlinSigner | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  if (!context) {
    throw new Error("useGlinSigner must be used within GlinProvider")
  }

  useEffect(() => {
    async function loadSigner() {
      if (!context.wallet.account?.address || !context.auth) {
        setSigner(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const injectedSigner = await context.auth.getSigner(context.wallet.account.address)
        setSigner(injectedSigner)
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err))
        setError(errorObj)
        setSigner(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadSigner()
  }, [context.wallet.account?.address, context.auth])

  return {
    /** Signer instance (InjectedSigner from extension) */
    signer,
    /** Address for the signer (needed for extension signers) */
    address: context.wallet.account?.address,
    /** Whether signer is being loaded */
    isLoading,
    /** Error loading signer */
    error,
    /** Whether signer is ready */
    isReady: !!signer && !!context.wallet.account?.address,
  }
}
