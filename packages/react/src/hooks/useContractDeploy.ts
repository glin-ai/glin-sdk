import { useState, useCallback } from 'react';
import { deployContract, type DeployResult, type DeployOptions } from '@glin-ai/sdk';
import type { Signer } from '@polkadot/api/types';
import { useGlinClient } from './useGlinClient';

export interface UseContractDeployOptions {
  signer: Signer;
}

export interface UseContractDeployReturn {
  deploy: (
    wasm: Uint8Array | string,
    abi: any,
    constructorArgs?: any[],
    options?: DeployOptions
  ) => Promise<DeployResult | null>;
  data: DeployResult | null;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook to deploy smart contracts
 *
 * @example
 * ```tsx
 * import { useContractDeploy, useGlinSigner } from '@glin-ai/sdk-react';
 * import wasmCode from './my_contract.wasm';
 * import abi from './my_contract.json';
 *
 * function DeployContract() {
 *   const { signer } = useGlinSigner();
 *   const { deploy, loading, error, data } = useContractDeploy({ signer });
 *
 *   const handleDeploy = async () => {
 *     const result = await deploy(
 *       wasmCode,
 *       abi,
 *       [1000000n], // constructor args
 *       { value: parseGLIN('10') }
 *     );
 *
 *     if (result?.success) {
 *       console.log('Contract deployed at:', result.address);
 *     }
 *   };
 *
 *   if (data?.success) {
 *     return <div>Contract deployed at: {data.address}</div>;
 *   }
 *
 *   return (
 *     <button onClick={handleDeploy} disabled={loading}>
 *       {loading ? 'Deploying...' : 'Deploy Contract'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useContractDeploy({
  signer,
}: UseContractDeployOptions): UseContractDeployReturn {
  const { client } = useGlinClient();
  const [data, setData] = useState<DeployResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deploy = useCallback(
    async (
      wasm: Uint8Array | string,
      abi: any,
      constructorArgs: any[] = [],
      options: DeployOptions = {}
    ): Promise<DeployResult | null> => {
      if (!client || !signer) {
        const err = new Error('Client or signer not available');
        setError(err);
        return null;
      }

      try {
        setLoading(true);
        setError(null);
        setData(null);

        const api = client.getApi();
        if (!api) {
          throw new Error('API not available');
        }

        const result = await deployContract(
          api,
          wasm,
          abi,
          constructorArgs,
          signer,
          options
        );

        if (result.success) {
          setData(result);
          return result;
        } else {
          throw new Error(result.error || 'Deployment failed');
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown deployment error');
        setError(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client, signer]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    deploy,
    data,
    loading,
    error,
    reset,
  };
}
