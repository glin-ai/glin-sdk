/**
 * Signer types for GLIN SDK
 * Supports both direct KeyringPair and browser extension signers
 */

import type { KeyringPair } from '@polkadot/keyring/types';
import type { Signer as InjectedSigner } from '@polkadot/api/types';

/**
 * Union type for signers
 * - KeyringPair: Direct key access (for Node.js, testing)
 * - InjectedSigner: Browser extension (Polkadot.js, Talisman, etc.)
 */
export type GlinSigner = KeyringPair | InjectedSigner;

/**
 * Check if signer is a KeyringPair
 */
export function isKeyringPair(signer: GlinSigner): signer is KeyringPair {
  return 'sign' in signer && 'address' in signer && typeof (signer as any).addressRaw !== 'undefined';
}

/**
 * Check if signer is an InjectedSigner (from browser extension)
 */
export function isInjectedSigner(signer: GlinSigner): signer is InjectedSigner {
  return 'signPayload' in signer && !isKeyringPair(signer);
}

/**
 * Get address from signer
 */
export function getSignerAddress(signer: GlinSigner, fallbackAddress?: string): string {
  if (isKeyringPair(signer)) {
    return signer.address;
  }

  // InjectedSigner doesn't have address, need to pass it separately
  if (!fallbackAddress) {
    throw new Error('Address required for extension signer');
  }

  return fallbackAddress;
}
