/**
 * Format utilities for GLIN token amounts
 * Following ethers.js design principles
 */

/**
 * Convert GLIN (human-readable) to planck (smallest unit)
 *
 * @param glin - Amount in GLIN (e.g., "10.5")
 * @returns Amount in planck as BigInt
 *
 * @example
 * parseGLIN("10.5")        // → 10500000000000000000n
 * parseGLIN("1")           // → 1000000000000000000n
 * parseGLIN("0.000000000000000001") // → 1n (1 planck)
 */
export function parseGLIN(glin: string): bigint {
  const cleanGlin = glin.trim();

  if (!cleanGlin) {
    throw new Error('Amount cannot be empty');
  }

  // Split into integer and fractional parts
  const [integer = '0', fraction = ''] = cleanGlin.split('.');

  if (integer === '' && fraction === '') {
    throw new Error('Invalid amount format');
  }

  // GLIN has 18 decimals
  const decimals = 18;

  // Pad or trim fractional part to exactly 18 digits
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);

  // Combine integer and fractional parts
  const planckString = (integer || '0') + paddedFraction;

  return BigInt(planckString);
}

/**
 * Convert planck (smallest unit) to GLIN (human-readable)
 *
 * @param planck - Amount in planck
 * @returns Amount in GLIN as string
 *
 * @example
 * formatGLIN(10500000000000000000n) // → "10.5"
 * formatGLIN(1000000000000000000n)  // → "1.0"
 * formatGLIN(1n)                     // → "0.000000000000000001"
 */
export function formatGLIN(planck: bigint): string {
  const decimals = 18;
  const planckString = planck.toString();

  // Pad with leading zeros if needed
  const paddedPlanck = planckString.padStart(decimals + 1, '0');

  // Split into integer and fractional parts
  const integer = paddedPlanck.slice(0, -decimals) || '0';
  const fraction = paddedPlanck.slice(-decimals);

  // Remove trailing zeros from fraction
  const trimmedFraction = fraction.replace(/0+$/, '');

  // Return formatted string
  if (trimmedFraction) {
    return `${integer}.${trimmedFraction}`;
  } else {
    return integer;
  }
}

/**
 * Convert human-readable amount to smallest unit (generic version)
 *
 * @param value - Amount as string (e.g., "10.5")
 * @param decimals - Number of decimals for the token
 * @returns Amount in smallest unit as BigInt
 *
 * @example
 * parseUnits("10.5", 18)  // → 10500000000000000000n
 * parseUnits("100", 6)    // → 100000000n (USDC has 6 decimals)
 */
export function parseUnits(value: string, decimals: number): bigint {
  const cleanValue = value.trim();

  if (!cleanValue) {
    throw new Error('Amount cannot be empty');
  }

  // Split into integer and fractional parts
  const [integer = '0', fraction = ''] = cleanValue.split('.');

  if (integer === '' && fraction === '') {
    throw new Error('Invalid amount format');
  }

  // Pad or trim fractional part to exactly 'decimals' digits
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);

  // Combine integer and fractional parts
  const smallestUnitString = (integer || '0') + paddedFraction;

  return BigInt(smallestUnitString);
}

/**
 * Convert smallest unit to human-readable amount (generic version)
 *
 * @param value - Amount in smallest unit
 * @param decimals - Number of decimals for the token
 * @returns Amount as human-readable string
 *
 * @example
 * formatUnits(10500000000000000000n, 18) // → "10.5"
 * formatUnits(100000000n, 6)              // → "100.0" (USDC)
 */
export function formatUnits(value: bigint, decimals: number): string {
  const valueString = value.toString();

  // Pad with leading zeros if needed
  const paddedValue = valueString.padStart(decimals + 1, '0');

  // Split into integer and fractional parts
  const integer = paddedValue.slice(0, -decimals) || '0';
  const fraction = paddedValue.slice(-decimals);

  // Remove trailing zeros from fraction
  const trimmedFraction = fraction.replace(/0+$/, '');

  // Return formatted string
  if (trimmedFraction) {
    return `${integer}.${trimmedFraction}`;
  } else {
    return integer;
  }
}
