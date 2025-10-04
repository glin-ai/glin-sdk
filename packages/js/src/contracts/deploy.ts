/**
 * Contract deployment utilities
 *
 * Provides functions to deploy new ink! smart contracts to the GLIN chain.
 *
 * @example
 * ```typescript
 * import { deployContract } from '@glin-ai/sdk';
 * import wasmCode from './my_contract.wasm';
 * import abi from './my_contract.json';
 *
 * const contract = await deployContract(
 *   api,
 *   wasmCode,
 *   abi,
 *   ['constructor', 'args'],
 *   signer,
 *   { value: parseGLIN('10') }
 * );
 * ```
 */

import type { ApiPromise } from '@polkadot/api';
import { CodePromise } from '@polkadot/api-contract';
import type { Signer } from '@polkadot/api/types';
import type { ISubmittableResult } from '@polkadot/types/types';
import { Contract } from './contract';

/**
 * Contract deployment options
 */
export interface DeployOptions {
  /** Value to transfer to contract on instantiation (in planck) */
  value?: bigint;
  /** Gas limit for deployment */
  gasLimit?: bigint | any;
  /** Storage deposit limit */
  storageDepositLimit?: bigint | null;
  /** Salt for deterministic deployment */
  salt?: Uint8Array;
}

/**
 * Contract deployment result
 */
export interface DeployResult {
  /** Deployed contract instance */
  contract: Contract;
  /** Contract address */
  address: string;
  /** Transaction hash */
  txHash: string;
  /** Block hash where contract was deployed */
  blockHash?: string;
  /** Block number where contract was deployed */
  blockNumber?: number;
  /** Whether deployment was successful */
  success: boolean;
  /** Error message if deployment failed */
  error?: string;
  /** Code hash of deployed contract */
  codeHash?: string;
}

/**
 * Deploy a new ink! smart contract
 *
 * @param api - Connected Polkadot API instance
 * @param wasm - Contract WASM code (Uint8Array or hex string)
 * @param abi - Contract ABI metadata
 * @param constructorArgs - Arguments for contract constructor
 * @param signer - Signer for deployment transaction
 * @param options - Deployment options (value, gas, etc.)
 * @returns Deployment result with contract instance
 *
 * @example
 * ```typescript
 * // Load WASM and ABI
 * const wasmCode = await fs.readFile('./my_contract.wasm');
 * const abi = JSON.parse(await fs.readFile('./my_contract.json', 'utf-8'));
 *
 * // Deploy with constructor args
 * const result = await deployContract(
 *   api,
 *   wasmCode,
 *   abi,
 *   ['initialValue', 100],
 *   signer,
 *   { value: parseGLIN('10') }
 * );
 *
 * if (result.success) {
 *   console.log('Contract deployed at:', result.address);
 *   const balance = await result.contract.query.getBalance();
 * }
 * ```
 */
export async function deployContract(
  api: ApiPromise,
  wasm: Uint8Array | string,
  abi: any,
  constructorArgs: any[] = [],
  signer: Signer,
  options: DeployOptions = {}
): Promise<DeployResult> {
  try {
    // Convert hex string to Uint8Array if needed
    const wasmCode = typeof wasm === 'string'
      ? hexToU8a(wasm)
      : wasm;

    // Create code promise
    const code = new CodePromise(api, abi, wasmCode);

    // Get constructor name (usually "new" or "default")
    const constructorName = findConstructorName(abi);

    // Prepare gas limit
    const gasLimit = options.gasLimit || api.registry.createType('WeightV2', {
      refTime: 5_000_000_000_000n,
      proofSize: 1_000_000n
    });

    // Get signer address
    const accounts = await api.query.system.account.keys();
    const signerAddress = accounts[0]?.toString();

    if (!signerAddress) {
      throw new Error('No signer address found');
    }

    // Create deployment transaction
    const tx = code.tx[constructorName](
      {
        gasLimit: gasLimit as any,
        storageDepositLimit: options.storageDepositLimit || null,
        value: options.value || 0,
        salt: options.salt
      },
      ...constructorArgs
    );

    // Execute deployment
    return new Promise((resolve, reject) => {
      let txHash = '';
      let contractAddress = '';

      tx.signAndSend(signerAddress, (result: ISubmittableResult) => {
        if (result.status.isInBlock) {
          txHash = result.txHash.toString();

          // Extract contract address from events
          const instantiatedEvent = result.events.find(
            ({ event }) => event.section === 'contracts' && event.method === 'Instantiated'
          );

          if (instantiatedEvent) {
            // Contract address is usually the second parameter
            contractAddress = instantiatedEvent.event.data[1]?.toString() || '';
          }
        }

        if (result.status.isFinalized) {
          // Check for errors
          const failed = result.events.find(
            ({ event }) => event.section === 'system' && event.method === 'ExtrinsicFailed'
          );

          if (failed || !contractAddress) {
            resolve({
              contract: null as any,
              address: '',
              txHash,
              blockHash: result.status.asFinalized.toString(),
              success: false,
              error: failed ? 'Contract instantiation failed' : 'Contract address not found'
            });
          } else {
            // Get code hash from event
            const codeStoredEvent = result.events.find(
              ({ event }) => event.section === 'contracts' && event.method === 'CodeStored'
            );

            const codeHash = codeStoredEvent?.event.data[0]?.toString();

            const blockNum = (result as any).blockNumber;
            const blockNumber = blockNum ? Number(blockNum.toString()) : undefined;

            // Create contract instance
            const contract = new Contract(api, contractAddress, abi, signer);

            resolve({
              contract,
              address: contractAddress,
              txHash,
              blockHash: result.status.asFinalized.toString(),
              blockNumber,
              success: true,
              codeHash
            });
          }
        }

        if (result.isError) {
          reject(new Error('Transaction error during deployment'));
        }
      }).catch(reject);
    });
  } catch (error) {
    return {
      contract: null as any,
      address: '',
      txHash: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown deployment error'
    };
  }
}

/**
 * Upload contract code without instantiating
 *
 * @param api - Connected Polkadot API instance
 * @param wasm - Contract WASM code
 * @param signer - Signer for upload transaction
 * @param options - Upload options
 * @returns Code hash and transaction details
 */
export async function uploadCode(
  api: ApiPromise,
  wasm: Uint8Array | string,
  signer: Signer,
  options: Omit<DeployOptions, 'value' | 'salt'> = {}
): Promise<{
  codeHash: string;
  txHash: string;
  success: boolean;
  error?: string;
}> {
  try {
    const wasmCode = typeof wasm === 'string' ? hexToU8a(wasm) : wasm;

    const accounts = await api.query.system.account.keys();
    const signerAddress = accounts[0]?.toString();

    if (!signerAddress) {
      throw new Error('No signer address found');
    }

    // Create upload transaction
    const tx = api.tx.contracts.uploadCode(
      wasmCode,
      options.storageDepositLimit || null
    );

    return new Promise((resolve, reject) => {
      let txHash = '';
      let codeHash = '';

      tx.signAndSend(signerAddress, (result: ISubmittableResult) => {
        if (result.status.isInBlock) {
          txHash = result.txHash.toString();

          // Extract code hash from event
          const codeStoredEvent = result.events.find(
            ({ event }) => event.section === 'contracts' && event.method === 'CodeStored'
          );

          if (codeStoredEvent) {
            codeHash = codeStoredEvent.event.data[0]?.toString() || '';
          }
        }

        if (result.status.isFinalized) {
          const failed = result.events.find(
            ({ event }) => event.section === 'system' && event.method === 'ExtrinsicFailed'
          );

          if (failed || !codeHash) {
            resolve({
              codeHash: '',
              txHash,
              success: false,
              error: 'Code upload failed'
            });
          } else {
            resolve({
              codeHash,
              txHash,
              success: true
            });
          }
        }

        if (result.isError) {
          reject(new Error('Transaction error during code upload'));
        }
      }).catch(reject);
    });
  } catch (error) {
    return {
      codeHash: '',
      txHash: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
}

/**
 * Instantiate a contract from uploaded code
 *
 * @param api - Connected Polkadot API instance
 * @param codeHash - Hash of uploaded contract code
 * @param abi - Contract ABI metadata
 * @param constructorArgs - Constructor arguments
 * @param signer - Signer for instantiation
 * @param options - Instantiation options
 * @returns Contract instance and deployment details
 */
export async function instantiateContract(
  api: ApiPromise,
  codeHash: string,
  abi: any,
  constructorArgs: any[] = [],
  signer: Signer,
  options: DeployOptions = {}
): Promise<DeployResult> {
  try {
    const code = new CodePromise(api, abi, codeHash);
    const constructorName = findConstructorName(abi);

    const gasLimit = options.gasLimit || api.registry.createType('WeightV2', {
      refTime: 5_000_000_000_000n,
      proofSize: 1_000_000n
    });

    const accounts = await api.query.system.account.keys();
    const signerAddress = accounts[0]?.toString();

    if (!signerAddress) {
      throw new Error('No signer address found');
    }

    const tx = code.tx[constructorName](
      {
        gasLimit: gasLimit as any,
        storageDepositLimit: options.storageDepositLimit || null,
        value: options.value || 0,
        salt: options.salt
      },
      ...constructorArgs
    );

    return new Promise((resolve, reject) => {
      let txHash = '';
      let contractAddress = '';

      tx.signAndSend(signerAddress, (result: ISubmittableResult) => {
        if (result.status.isInBlock) {
          txHash = result.txHash.toString();

          const instantiatedEvent = result.events.find(
            ({ event }) => event.section === 'contracts' && event.method === 'Instantiated'
          );

          if (instantiatedEvent) {
            contractAddress = instantiatedEvent.event.data[1]?.toString() || '';
          }
        }

        if (result.status.isFinalized) {
          const failed = result.events.find(
            ({ event }) => event.section === 'system' && event.method === 'ExtrinsicFailed'
          );

          if (failed || !contractAddress) {
            resolve({
              contract: null as any,
              address: '',
              txHash,
              blockHash: result.status.asFinalized.toString(),
              success: false,
              error: 'Contract instantiation failed'
            });
          } else {
            const blockNum = (result as any).blockNumber;
            const blockNumber = blockNum ? Number(blockNum.toString()) : undefined;

            const contract = new Contract(api, contractAddress, abi, signer);

            resolve({
              contract,
              address: contractAddress,
              txHash,
              blockHash: result.status.asFinalized.toString(),
              blockNumber,
              success: true,
              codeHash
            });
          }
        }

        if (result.isError) {
          reject(new Error('Transaction error during instantiation'));
        }
      }).catch(reject);
    });
  } catch (error) {
    return {
      contract: null as any,
      address: '',
      txHash: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown instantiation error'
    };
  }
}

/**
 * Find constructor name from ABI
 */
function findConstructorName(abi: any): string {
  const constructors = abi?.spec?.constructors || [];

  if (constructors.length === 0) {
    throw new Error('No constructors found in ABI');
  }

  // Return first constructor label (usually "new" or "default")
  return constructors[0].label;
}

/**
 * Convert hex string to Uint8Array
 */
function hexToU8a(hex: string): Uint8Array {
  // Remove 0x prefix if present
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;

  // Convert to Uint8Array
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
  }

  return bytes;
}
