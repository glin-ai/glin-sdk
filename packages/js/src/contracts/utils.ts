/**
 * Contract utility functions
 *
 * Helper functions for working with ink! smart contracts:
 * - ABI parsing and validation
 * - Event decoding
 * - Contract detection
 * - Code hash utilities
 */

import type { ApiPromise } from '@polkadot/api';
import { Abi } from '@polkadot/api-contract';

/**
 * Contract metadata information
 */
export interface ContractMetadata {
  name: string;
  version: string;
  authors: string[];
  description?: string;
  source?: {
    hash: string;
    language: string;
    compiler: string;
    wasm?: string;
  };
}

/**
 * Contract message information
 */
export interface ContractMessage {
  label: string;
  selector: string;
  mutates: boolean;
  payable: boolean;
  args: Array<{
    label: string;
    type: any;
  }>;
  returnType: any;
  docs: string[];
}

/**
 * Parse contract ABI and extract metadata
 *
 * @param abi - Contract ABI (JSON or string)
 * @returns Parsed contract metadata
 *
 * @example
 * ```typescript
 * const metadata = parseContractAbi(myAbi);
 * console.log(`Contract: ${metadata.name} v${metadata.version}`);
 * ```
 */
export function parseContractAbi(abi: any): ContractMetadata {
  const abiObj = typeof abi === 'string' ? JSON.parse(abi) : abi;

  return {
    name: abiObj.contract?.name || 'Unknown',
    version: abiObj.contract?.version || '0.0.0',
    authors: abiObj.contract?.authors || [],
    description: abiObj.contract?.description,
    source: abiObj.source
  };
}

/**
 * Get all contract messages from ABI
 *
 * @param abi - Contract ABI
 * @returns Array of contract messages
 *
 * @example
 * ```typescript
 * const messages = getContractMessages(myAbi);
 * messages.forEach(msg => {
 *   console.log(`${msg.label}(${msg.args.map(a => a.label).join(', ')})`);
 * });
 * ```
 */
export function getContractMessages(abi: any): ContractMessage[] {
  const abiObj = typeof abi === 'string' ? JSON.parse(abi) : abi;
  const messages = abiObj.spec?.messages || [];

  return messages.map((msg: any) => ({
    label: msg.label,
    selector: msg.selector,
    mutates: msg.mutates !== false,
    payable: msg.payable || false,
    args: msg.args || [],
    returnType: msg.returnType,
    docs: msg.docs || []
  }));
}

/**
 * Check if an address is a contract
 *
 * @param api - Polkadot API instance
 * @param address - Address to check
 * @returns Whether the address is a contract
 *
 * @example
 * ```typescript
 * const isContract = await isContractAddress(api, '5Contract...');
 * if (isContract) {
 *   console.log('This is a contract address');
 * }
 * ```
 */
export async function isContractAddress(
  api: ApiPromise,
  address: string
): Promise<boolean> {
  try {
    const contractInfo = await api.query.contracts.contractInfoOf(address);
    return !contractInfo.isEmpty;
  } catch (error) {
    return false;
  }
}

/**
 * Get contract code hash
 *
 * @param api - Polkadot API instance
 * @param address - Contract address
 * @returns Code hash or null if not a contract
 *
 * @example
 * ```typescript
 * const codeHash = await getContractCodeHash(api, contractAddress);
 * console.log('Code hash:', codeHash);
 * ```
 */
export async function getContractCodeHash(
  api: ApiPromise,
  address: string
): Promise<string | null> {
  try {
    const contractInfo = await api.query.contracts.contractInfoOf(address);

    if (contractInfo.isEmpty) {
      return null;
    }

    // Extract code hash from contract info
    const info = contractInfo.toJSON() as any;
    return info?.codeHash?.toString() || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get contract code (WASM)
 *
 * @param api - Polkadot API instance
 * @param codeHash - Code hash
 * @returns WASM code or null if not found
 */
export async function getContractCode(
  api: ApiPromise,
  codeHash: string
): Promise<Uint8Array | null> {
  try {
    const code = await api.query.contracts.pristineCode(codeHash);

    if (code.isEmpty) {
      return null;
    }

    return code.toU8a();
  } catch (error) {
    return null;
  }
}

/**
 * Decode contract event
 *
 * @param abi - Contract ABI
 * @param eventData - Raw event data
 * @returns Decoded event or null
 *
 * @example
 * ```typescript
 * const decoded = decodeContractEvent(myAbi, event.data);
 * if (decoded) {
 *   console.log(`Event: ${decoded.event.identifier}`);
 *   console.log('Args:', decoded.args);
 * }
 * ```
 */
export function decodeContractEvent(
  abi: any,
  eventData: any
): {
  event: {
    identifier: string;
    docs: string[];
  };
  args: Record<string, any>;
} | null {
  try {
    const abiInstance = new Abi(abi);

    // Find matching event in ABI
    const events = abi.spec?.events || [];
    const event = events.find((e: any) => {
      // Match event by some criteria (this is simplified)
      return e.label === eventData.identifier;
    });

    if (!event) {
      return null;
    }

    return {
      event: {
        identifier: event.label,
        docs: event.docs || []
      },
      args: eventData.args || {}
    };
  } catch (error) {
    return null;
  }
}

/**
 * Decode contract call data
 *
 * @param abi - Contract ABI
 * @param data - Encoded call data (hex string)
 * @returns Decoded method name and arguments
 *
 * @example
 * ```typescript
 * // Decode transaction data
 * const decoded = decodeContractCall(myAbi, '0x...');
 * if (decoded) {
 *   console.log(`Method: ${decoded.method}`);
 *   console.log('Args:', decoded.args);
 * }
 * ```
 */
export function decodeContractCall(
  abi: any,
  data: string | Uint8Array
): {
  method: string;
  args: Record<string, any>;
} | null {
  try {
    const abiInstance = new Abi(abi);

    // Convert to hex if needed
    const hexData = typeof data === 'string' ? data : u8aToHex(data);

    // Decode message (simplified - actual implementation depends on Abi class)
    const message = abiInstance.decodeMessage(hexToU8a(hexData));

    if (!message) {
      return null;
    }

    return {
      method: message.message.method,
      args: message.args
    };
  } catch (error) {
    return null;
  }
}

/**
 * Validate contract ABI
 *
 * @param abi - ABI to validate
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const validation = validateContractAbi(myAbi);
 * if (!validation.valid) {
 *   console.error('Invalid ABI:', validation.errors);
 * }
 * ```
 */
export function validateContractAbi(abi: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    const abiObj = typeof abi === 'string' ? JSON.parse(abi) : abi;

    // Check required fields
    if (!abiObj.spec) {
      errors.push('Missing "spec" field');
    }

    if (!abiObj.spec?.messages || !Array.isArray(abiObj.spec.messages)) {
      errors.push('Missing or invalid "spec.messages" field');
    }

    if (!abiObj.spec?.constructors || !Array.isArray(abiObj.spec.constructors)) {
      errors.push('Missing or invalid "spec.constructors" field');
    }

    // Check version (should be 4 or 5 for modern ink!)
    const version = abiObj.version;
    if (version && version < 4) {
      errors.push(`Old ABI version ${version}. Please use ink! 4.0+ with version 4 or 5 metadata`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    errors.push(`Failed to parse ABI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      valid: false,
      errors
    };
  }
}

/**
 * Get contract storage deposit
 *
 * @param api - Polkadot API instance
 * @param address - Contract address
 * @returns Storage deposit amount
 */
export async function getContractStorageDeposit(
  api: ApiPromise,
  address: string
): Promise<bigint | null> {
  try {
    const contractInfo = await api.query.contracts.contractInfoOf(address);

    if (contractInfo.isEmpty) {
      return null;
    }

    const info = contractInfo.toJSON() as any;
    return BigInt(info?.storageDeposit?.toString() || '0');
  } catch (error) {
    return null;
  }
}

/**
 * Convert Uint8Array to hex string
 */
function u8aToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array
 */
function hexToU8a(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);

  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
  }

  return bytes;
}
