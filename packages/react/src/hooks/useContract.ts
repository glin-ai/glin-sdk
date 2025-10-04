import { useState, useEffect, useMemo } from 'react';
import { Contract } from '@glin-ai/sdk';
import type { Signer } from '@polkadot/api/types';
import { useGlinClient } from './useGlinClient';

export interface UseContractOptions {
  address: string;
  abi: any;
  signer?: Signer;
}

export interface UseContractReturn {
  contract: Contract | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to initialize a contract instance
 *
 * @example
 * ```tsx
 * import { useContract } from '@glin-ai/sdk-react';
 * import tokenAbi from './MyToken.json';
 *
 * function MyComponent() {
 *   const { contract, loading } = useContract({
 *     address: '5ContractAddress...',
 *     abi: tokenAbi,
 *   });
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (!contract) return <div>Failed to load contract</div>;
 *
 *   return <div>Contract loaded!</div>;
 * }
 * ```
 */
export function useContract({
  address,
  abi,
  signer,
}: UseContractOptions): UseContractReturn {
  const { client } = useGlinClient();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!client || !address || !abi) {
      setContract(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const api = client.getApi();
      if (!api) {
        throw new Error('API not available');
      }

      const contractInstance = new Contract(api, address, abi, signer);
      setContract(contractInstance);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize contract'));
      setContract(null);
    } finally {
      setLoading(false);
    }
  }, [client, address, abi, signer]);

  return { contract, loading, error };
}
