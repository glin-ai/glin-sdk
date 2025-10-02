/**
 * Provider detection and management
 */

import { InjectedExtension } from '../types';

export class ProviderDetector {
  /**
   * Check if GLIN browser extension is available
   */
  static isExtensionAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.glin;
  }

  /**
   * Get GLIN extension provider
   */
  static getExtension(): InjectedExtension | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.glin || null;
  }

  /**
   * Wait for extension to be injected (up to 3 seconds)
   */
  static async waitForExtension(timeout: number = 3000): Promise<InjectedExtension | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    // If already available, return immediately
    if (window.glin) {
      return window.glin;
    }

    // Wait for injection
    return new Promise((resolve) => {
      const checkInterval = 100;
      let elapsed = 0;

      const interval = setInterval(() => {
        if (window.glin) {
          clearInterval(interval);
          resolve(window.glin!);
          return;
        }

        elapsed += checkInterval;
        if (elapsed >= timeout) {
          clearInterval(interval);
          resolve(null);
        }
      }, checkInterval);
    });
  }

  /**
   * Get extension installation URL
   */
  static getInstallUrl(): string {
    // Detect browser
    if (typeof navigator === 'undefined') {
      return 'https://glin.ai/wallet';
    }

    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('chrome') || userAgent.includes('chromium')) {
      return 'https://chrome.google.com/webstore/detail/glin-wallet/...';
    } else if (userAgent.includes('firefox')) {
      return 'https://addons.mozilla.org/firefox/addon/glin-wallet/';
    } else if (userAgent.includes('edg')) {
      return 'https://microsoftedge.microsoft.com/addons/detail/glin-wallet/...';
    }

    return 'https://glin.ai/wallet';
  }
}
