import { useState, useCallback } from 'react';
import type { Contract, TxResult } from '@glin-ai/sdk';

export interface UseContractTxOptions {
  contract: Contract | null;
  method: string;
}

export interface UseContractTxReturn {
  execute: (...args: any[]) => Promise<TxResult | null>;
  data: TxResult | null;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook to execute contract transactions (write)
 *
 * @example
 * ```tsx
 * import { useContract, useContractTx } from '@glin-ai/sdk-react';
 * import tokenAbi from './MyToken.json';
 *
 * function TransferButton() {
 *   const { contract } = useContract({
 *     address: '5ContractAddress...',
 *     abi: tokenAbi,
 *     signer: mySigner,
 *   });
 *
 *   const { execute, loading, error, data } = useContractTx({
 *     contract,
 *     method: 'transfer',
 *   });
 *
 *   const handleTransfer = async () => {
 *     const result = await execute('5Recipient...', 1000n);
 *     if (result?.success) {
 *       console.log('Transfer successful!', result.txHash);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleTransfer} disabled={loading}>
 *       {loading ? 'Sending...' : 'Transfer'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useContractTx({
  contract,
  method,
}: UseContractTxOptions): UseContractTxReturn {
  const [data, setData] = useState<TxResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: any[]): Promise<TxResult | null> => {
      if (!contract || !method) {
        const err = new Error('Contract or method not available');
        setError(err);
        return null;
      }

      try {
        setLoading(true);
        setError(null);
        setData(null);

        const result: TxResult = await contract.tx[method](...args);

        if (result.success) {
          setData(result);
          return result;
        } else {
          throw new Error(result.error || 'Transaction failed');
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown transaction error');
        setError(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [contract, method]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    execute,
    data,
    loading,
    error,
    reset,
  };
}
