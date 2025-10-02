/**
 * Transfer module for GLIN token transfers
 */

import { ApiPromise } from '@polkadot/api';

export class GlinTransfer {
  constructor(private api: ApiPromise) {}

  /**
   * Transfer tokens from one account to another
   */
  async transfer(
    from: any, // KeyringPair or InjectedAccountWithMeta
    to: string,
    amount: string,
    onStatus?: (status: any) => void
  ): Promise<string> {
    // Convert amount to smallest unit (18 decimals for GLIN)
    const decimals = 18;
    const amountInSmallestUnit = BigInt(Math.floor(parseFloat(amount) * (10 ** decimals))).toString();

    const transfer = this.api.tx.balances.transferKeepAlive(to, amountInSmallestUnit);

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
   */
  async estimateFee(
    from: string,
    to: string,
    amount: string
  ): Promise<string> {
    // Convert amount to smallest unit (18 decimals for GLIN)
    const decimals = 18;
    const amountInSmallestUnit = BigInt(Math.floor(parseFloat(amount) * (10 ** decimals))).toString();

    const transfer = this.api.tx.balances.transferKeepAlive(to, amountInSmallestUnit);
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
   */
  async transferAllowDeath(
    from: any,
    to: string,
    amount: string,
    onStatus?: (status: any) => void
  ): Promise<string> {
    const decimals = 18;
    const amountInSmallestUnit = BigInt(Math.floor(parseFloat(amount) * (10 ** decimals))).toString();

    const transfer = this.api.tx.balances.transferAllowDeath(to, amountInSmallestUnit);

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
