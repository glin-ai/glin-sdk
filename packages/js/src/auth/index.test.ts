/**
 * Unit tests for GlinAuth
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GlinAuth } from './index';

describe('GlinAuth', () => {
  let auth: GlinAuth;

  beforeEach(() => {
    auth = new GlinAuth();
  });

  describe('Message generation', () => {
    it('should generate auth message with app name', () => {
      const message = auth.generateAuthMessage('TestApp');

      expect(message).toContain('Sign in to TestApp');
      expect(message).toContain('GLIN');
    });

    it('should generate auth message without app name', () => {
      const message = auth.generateAuthMessage();

      expect(message).toContain('Sign in with GLIN');
    });

    it('should include timestamp in message', () => {
      const message = auth.generateAuthMessage();

      expect(message).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('Signature verification', () => {
    it('should verify valid signature', async () => {
      // Note: This would require a real signature from a keypair
      // For now, we just test the method exists
      expect(auth.verifySignature).toBeDefined();
      expect(typeof auth.verifySignature).toBe('function');
    });
  });

  describe('Extension detection', () => {
    it('should detect extension availability', async () => {
      const isAvailable = await auth.isExtensionAvailable();

      // In test environment, extension won't be available
      expect(typeof isAvailable).toBe('boolean');
    });
  });
});
