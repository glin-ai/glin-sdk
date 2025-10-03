import { useContext } from "react"
import { GlinContext } from "../context/GlinContext"

/**
 * Hook to access low-level GlinClient instance
 * Use this for advanced blockchain operations
 *
 * @example
 * ```tsx
 * function ChainInfo() {
 *   const { client } = useGlinClient()
 *
 *   const [chainName, setChainName] = useState('')
 *
 *   useEffect(() => {
 *     if (client) {
 *       client.getChainName().then(setChainName)
 *     }
 *   }, [client])
 *
 *   return <p>Chain: {chainName}</p>
 * }
 * ```
 */
export function useGlinClient() {
  const context = useContext(GlinContext)

  if (!context) {
    throw new Error("useGlinClient must be used within GlinProvider")
  }

  return {
    /** GlinClient instance (may be null) */
    client: context.client,
    /** GlinAuth instance (may be null) */
    auth: context.auth,
    /** Is client connected */
    isConnected: !!context.client,
  }
}
