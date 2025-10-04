/**
 * Transfer module for GLIN token transfers
 *
 * All amount parameters expect values in planck (smallest unit).
 * 1 GLIN = 10^18 planck
 *
 * Use parseGLIN() from '@glin-ai/sdk' to convert GLIN to planck.
 */

import { ApiPromise } from '@polkadot/api';

export class GlinTransfer {
  constructor(private api: ApiPromise) {}

  /**
   * Transfer tokens from one account to another
   *
   * @param from - KeyringPair or InjectedAccountWithMeta
   * @param to - Recipient address
   * @param amount - Amount in planck (smallest unit). Use parseGLIN() to convert from GLIN.
   * @param onStatus - Optional callback for transaction status
   * @returns Transaction hash
   *
   * @example
   * ```typescript
   * import { parseGLIN } from '@glin-ai/sdk';
   *
   * // Convert user input to planck
   * const amount = parseGLIN("10.5"); // 10.5 GLIN → 10500000000000000000n planck
   *
   * // Transfer (amount is in planck)
   * const hash = await transfer.transfer(keypair, recipient, amount);
   * ```
   */
  async transfer(
    from: any, // KeyringPair or InjectedAccountWithMeta
    to: string,
    amount: bigint,
    onStatus?: (status: any) => void
  ): Promise<string> {
    // Amount is already in planck (smallest unit) - use directly
    const transfer = this.api.tx.balances.transferKeepAlive(to, amount);

    return new Promise((resolve, reject) => {
      transfer.signAndSend(from, (result: any) => {
        if (onStatus) {
          onStatus(result);
        }

        if (result.status.isFinalized) {
          const hash = result.status.asFinalized.toString();
          resolve(hash);
        }

        if (result.isError) {
          reject(new Error('Transaction failed'));
        }
      }).catch(reject);
    });
  }

  /**
   * Estimate transaction fee for a transfer
   *
   * @param from - Sender address
   * @param to - Recipient address
   * @param amount - Amount in planck (smallest unit). Use parseGLIN() to convert from GLIN.
   * @returns Estimated fee in planck as string
   *
   * @example
   * ```typescript
   * import { parseGLIN } from '@glin-ai/sdk';
   *
   * const amount = parseGLIN("10.5");
   * const fee = await transfer.estimateFee(senderAddress, recipient, amount);
   * console.log(`Fee: ${formatGLIN(BigInt(fee))} GLIN`);
   * ```
   */
  async estimateFee(
    from: string,
    to: string,
    amount: bigint
  ): Promise<string> {
    // Amount is already in planck (smallest unit) - use directly
    const transfer = this.api.tx.balances.transferKeepAlive(to, amount);
    const info = await transfer.paymentInfo(from);
    return info.partialFee.toString();
  }

  /**
   * Transfer all available balance (minus fee) to another account
   */
  async transferAll(
    from: any,
    to: string,
    onStatus?: (status: any) => void
  ): Promise<string> {
    const transfer = this.api.tx.balances.transferAll(to, false);

    return new Promise((resolve, reject) => {
      transfer.signAndSend(from, (result: any) => {
        if (onStatus) {
          onStatus(result);
        }

        if (result.status.isFinalized) {
          const hash = result.status.asFinalized.toString();
          resolve(hash);
        }

        if (result.isError) {
          reject(new Error('Transaction failed'));
        }
      }).catch(reject);
    });
  }

  /**
   * Transfer with allow death (can reduce balance below existential deposit)
   *
   * @param from - KeyringPair or InjectedAccountWithMeta
   * @param to - Recipient address
   * @param amount - Amount in planck (smallest unit). Use parseGLIN() to convert from GLIN.
   * @param onStatus - Optional callback for transaction status
   * @returns Transaction hash
   *
   * @example
   * ```typescript
   * import { parseGLIN } from '@glin-ai/sdk';
   *
   * const amount = parseGLIN("10.5");
   * const hash = await transfer.transferAllowDeath(keypair, recipient, amount);
   * ```
   */
  async transferAllowDeath(
    from: any,
    to: string,
    amount: bigint,
    onStatus?: (status: any) => void
  ): Promise<string> {
    // Amount is already in planck (smallest unit) - use directly
    const transfer = this.api.tx.balances.transferAllowDeath(to, amount);

    return new Promise((resolve, reject) => {
      transfer.signAndSend(from, (result: any) => {
        if (onStatus) {
          onStatus(result);
        }

        if (result.status.isFinalized) {
          const hash = result.status.asFinalized.toString();
          resolve(hash);
        }

        if (result.isError) {
          reject(new Error('Transaction failed'));
        }
      }).catch(reject);
    });
  }
}
