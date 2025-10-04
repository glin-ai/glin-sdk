import { useState, useEffect, useCallback } from 'react';
import type { Contract, QueryResult } from '@glin-ai/sdk';

export interface UseContractQueryOptions<T = any> {
  contract: Contract | null;
  method: string;
  args?: any[];
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseContractQueryReturn<T = any> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  gasConsumed?: bigint;
  storageDeposit?: bigint;
}

/**
 * Hook to query contract state (read-only)
 *
 * @example
 * ```tsx
 * import { useContract, useContractQuery } from '@glin-ai/sdk-react';
 * import tokenAbi from './MyToken.json';
 *
 * function TokenBalance({ account }: { account: string }) {
 *   const { contract } = useContract({
 *     address: '5ContractAddress...',
 *     abi: tokenAbi,
 *   });
 *
 *   const { data: balance, loading, error } = useContractQuery({
 *     contract,
 *     method: 'balanceOf',
 *     args: [account],
 *   });
 *
 *   if (loading) return <div>Loading balance...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return <div>Balance: {balance?.toString()}</div>;
 * }
 * ```
 */
export function useContractQuery<T = any>({
  contract,
  method,
  args = [],
  enabled = true,
  refetchInterval,
}: UseContractQueryOptions<T>): UseContractQueryReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [gasConsumed, setGasConsumed] = useState<bigint>();
  const [storageDeposit, setStorageDeposit] = useState<bigint>();

  const executeQuery = useCallback(async () => {
    if (!contract || !method || !enabled) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result: QueryResult<T> = await contract.query[method](...args);

      if (result.success && result.data !== undefined) {
        setData(result.data);
        setGasConsumed(result.gasConsumed);
        setStorageDeposit(result.storageDeposit);
      } else {
        throw new Error(result.error || 'Query failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown query error'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [contract, method, enabled, ...args]);

  // Initial fetch
  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(() => {
      executeQuery();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, enabled, executeQuery]);

  return {
    data,
    loading,
    error,
    refetch: executeQuery,
    gasConsumed,
    storageDeposit,
  };
}
