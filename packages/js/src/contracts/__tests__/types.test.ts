/**
 * Unit tests for contract types
 */

import { describe, it, expect } from 'vitest';
import {
  MilestoneStatus,
  ProfessionalRole,
  DisputeStatus,
  VoteChoice,
} from '../types';

describe('Contract Types', () => {
  describe('MilestoneStatus', () => {
    it('should have correct enum values', () => {
      expect(MilestoneStatus.Pending).toBe('Pending');
      expect(MilestoneStatus.Completed).toBe('Completed');
      expect(MilestoneStatus.Disputed).toBe('Disputed');
      expect(MilestoneStatus.Resolved).toBe('Resolved');
      expect(MilestoneStatus.Cancelled).toBe('Cancelled');
    });
  });

  describe('ProfessionalRole', () => {
    it('should have correct enum values', () => {
      expect(ProfessionalRole.Lawyer).toBe('Lawyer');
      expect(ProfessionalRole.Doctor).toBe('Doctor');
      expect(ProfessionalRole.Arbitrator).toBe('Arbitrator');
      expect(ProfessionalRole.Notary).toBe('Notary');
      expect(ProfessionalRole.Auditor).toBe('Auditor');
      expect(ProfessionalRole.ConsultantOther).toBe('ConsultantOther');
    });
  });

  describe('DisputeStatus', () => {
    it('should have correct enum values', () => {
      expect(DisputeStatus.Open).toBe('Open');
      expect(DisputeStatus.Voting).toBe('Voting');
      expect(DisputeStatus.Resolved).toBe('Resolved');
      expect(DisputeStatus.Appealed).toBe('Appealed');
      expect(DisputeStatus.Cancelled).toBe('Cancelled');
    });
  });

  describe('VoteChoice', () => {
    it('should have correct enum values', () => {
      expect(VoteChoice.InFavorOfClaimant).toBe('InFavorOfClaimant');
      expect(VoteChoice.InFavorOfDefendant).toBe('InFavorOfDefendant');
    });
  });

  describe('Type Conversions', () => {
    it('should convert balance to BigInt', () => {
      const balance = '1000000000000000000000'; // 1000 GLIN
      const bigIntBalance = BigInt(balance);
      expect(bigIntBalance).toBe(1000000000000000000000n);
    });

    it('should convert timestamp to number', () => {
      const timestamp = Date.now();
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });

    it('should handle GLIN token decimals', () => {
      const amount = 100n; // 100 GLIN
      const decimals = 18n;
      const wei = amount * 10n ** decimals;
      expect(wei).toBe(100000000000000000000n);
    });
  });
});
