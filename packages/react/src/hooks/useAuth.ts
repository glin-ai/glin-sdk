import { useContext, useState } from "react"
import { GlinContext } from "../context/GlinContext"
import type { AuthResult } from "../types"

/**
 * Hook for authentication (connect + sign message)
 *
 * @example
 * ```tsx
 * function LoginButton() {
 *   const { authenticate, isAuthenticating, error } = useAuth()
 *
 *   const handleLogin = async () => {
 *     try {
 *       const { address, signature, message } = await authenticate()
 *       // Send to backend for verification
 *       await fetch('/api/auth/verify', {
 *         method: 'POST',
 *         body: JSON.stringify({ address, signature, message })
 *       })
 *     } catch (err) {
 *       console.error('Login failed:', err)
 *     }
 *   }
 *
 *   return (
 *     <button onClick={handleLogin} disabled={isAuthenticating}>
 *       {isAuthenticating ? 'Signing in...' : 'Sign in with GLIN'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(GlinContext)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  if (!context) {
    throw new Error("useAuth must be used within GlinProvider")
  }

  const authenticate = async (): Promise<AuthResult> => {
    setIsAuthenticating(true)
    setError(null)

    try {
      const result = await context.authenticate()
      setIsAuthenticating(false)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Authentication failed")
      setError(error)
      setIsAuthenticating(false)
      throw error
    }
  }

  return {
    /** Authenticate (connect + sign message) */
    authenticate,
    /** Is authentication in progress */
    isAuthenticating,
    /** Authentication error */
    error,
    /** Clear error */
    clearError: () => setError(null),
  }
}
