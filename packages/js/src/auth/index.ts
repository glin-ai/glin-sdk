/**
 * Authentication module - "Sign in with GLIN"
 */

import { stringToU8a, u8aToHex } from '@polkadot/util';
import { signatureVerify } from '@polkadot/util-crypto';
import { ProviderDetector } from '../provider';
import { GlinAccount, SignatureResult, AuthResult, GlinSDKConfig } from '../types';

export class GlinAuth {
  private config: GlinSDKConfig;
  private currentAccount: GlinAccount | null = null;
  private extension: any = null;

  constructor(config: GlinSDKConfig = {}) {
    this.config = {
      preferExtension: true,
      ...config
    };
  }

  /**
   * Connect wallet (browser extension or direct)
   */
  async connect(): Promise<GlinAccount> {
    // Try extension first if preferred
    if (this.config.preferExtension !== false) {
      const extension = await ProviderDetector.waitForExtension();

      if (extension) {
        this.extension = extension;
        const accounts = await extension.enable();

        if (accounts.length > 0) {
          this.currentAccount = {
            ...accounts[0],
            source: 'extension'
          };
          return this.currentAccount;
        }
      }
    }

    // If no extension or disabled, throw error
    // In production, this could redirect to wallet or show QR code
    throw new Error(
      `GLIN wallet extension not found. Install from: ${ProviderDetector.getInstallUrl()}`
    );
  }

  /**
   * Sign authentication message
   */
  async signMessage(message?: string): Promise<SignatureResult> {
    if (!this.currentAccount) {
      throw new Error('Not connected. Call connect() first.');
    }

    // Generate default auth message if not provided
    const authMessage = message || this.generateAuthMessage();

    if (this.extension && this.currentAccount.source === 'extension') {
      // Use extension to sign
      return await this.extension.signMessage(authMessage);
    }

    throw new Error('No signing method available');
  }

  /**
   * Complete authentication flow (connect + sign)
   */
  async authenticate(appName?: string): Promise<AuthResult> {
    // Connect to wallet
    const account = await this.connect();

    // Generate message with app name
    const message = this.generateAuthMessage(appName);

    // Sign message
    const { signature } = await this.signMessage(message);

    return {
      address: account.address,
      signature,
      message,
      timestamp: Date.now()
    };
  }

  /**
   * Verify signature (can be used on backend)
   */
  static verifySignature(address: string, message: string, signature: string): boolean {
    try {
      const messageU8a = stringToU8a(message);
      const result = signatureVerify(messageU8a, signature, address);
      return result.isValid;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.currentAccount = null;
    this.extension = null;
  }

  /**
   * Get current account
   */
  getCurrentAccount(): GlinAccount | null {
    return this.currentAccount;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.currentAccount !== null;
  }

  /**
   * Generate authentication message
   */
  private generateAuthMessage(appName?: string): string {
    const timestamp = new Date().toISOString();
    const app = appName || 'GLIN Application';

    return `Sign in to ${app}\n\nTimestamp: ${timestamp}\n\nThis signature will not trigger a blockchain transaction or cost any fees.`;
  }

  /**
   * Listen to account changes
   */
  onAccountsChanged(callback: (accounts: GlinAccount[]) => void): void {
    if (this.extension) {
      this.extension.on('accountsChanged', callback);
    }
  }

  /**
   * Listen to disconnection
   */
  onDisconnect(callback: () => void): void {
    if (this.extension) {
      this.extension.on('disconnect', callback);
    }
  }
}
