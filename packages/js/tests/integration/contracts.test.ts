/**
 * Integration tests for GLIN contracts
 *
 * Prerequisites:
 * - Local GLIN node running (ws://localhost:9944)
 * - Contracts deployed (GenericEscrow, ProfessionalRegistry, ArbitrationDAO)
 * - Set contract addresses in environment variables:
 *   - ESCROW_ADDRESS
 *   - REGISTRY_ADDRESS
 *   - ARBITRATION_ADDRESS
 *
 * Run: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { GlinContracts, MilestoneStatus, ProfessionalRole, VoteChoice } from '../../src';

const RPC_URL = process.env.RPC_URL || 'ws://localhost:9944';
const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS || '';
const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS || '';
const ARBITRATION_ADDRESS = process.env.ARBITRATION_ADDRESS || '';

describe.skipIf(!ESCROW_ADDRESS)('Contracts Integration Tests', () => {
  let api: ApiPromise;
  let contracts: GlinContracts;
  let alice: any;
  let bob: any;

  beforeAll(async () => {
    // Connect to local node
    const provider = new WsProvider(RPC_URL);
    api = await ApiPromise.create({ provider });

    // Create test accounts
    const keyring = new Keyring({ type: 'sr25519' });
    alice = keyring.addFromUri('//Alice');
    bob = keyring.addFromUri('//Bob');

    // Initialize contracts
    contracts = new GlinContracts({
      api,
      signer: alice,
      escrowAddress: ESCROW_ADDRESS,
      registryAddress: REGISTRY_ADDRESS,
      arbitrationAddress: ARBITRATION_ADDRESS,
    });
  }, 30000);

  afterAll(async () => {
    await api?.disconnect();
  });

  describe('GenericEscrow', () => {
    it('should create an escrow agreement', async () => {
      const result = await contracts.escrow.createAgreement({
        provider: bob.address,
        milestoneDescriptions: ['Test milestone'],
        milestoneAmounts: [1000n * 10n**18n],
        milestoneDeadlines: [Date.now() + 86400000],
        disputeTimeout: Date.now() + 259200000,
        value: 1000n * 10n**18n,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    }, 60000);

    it('should query agreement details', async () => {
      const agreement = await contracts.escrow.getAgreement(0n);

      if (agreement) {
        expect(agreement.client).toBe(alice.address);
        expect(agreement.provider).toBe(bob.address);
        expect(agreement.isActive).toBe(true);
      }
    }, 30000);

    it('should get milestone count', async () => {
      const count = await contracts.escrow.getMilestoneCount(0n);
      expect(count).toBeGreaterThan(0);
    }, 30000);
  });

  describe('ProfessionalRegistry', () => {
    it('should register as professional', async () => {
      const result = await contracts.registry.register({
        role: ProfessionalRole.Lawyer,
        metadataUri: 'ipfs://test',
        stakeAmount: 100n * 10n**18n,
      });

      expect(result.success).toBe(true);
    }, 60000);

    it('should query professional profile', async () => {
      const profile = await contracts.registry.getProfile(alice.address);

      if (profile) {
        expect(profile.account).toBe(alice.address);
        expect(profile.role).toBe(ProfessionalRole.Lawyer);
        expect(profile.isActive).toBe(true);
      }
    }, 30000);

    it('should check minimum stake', async () => {
      const minStake = await contracts.registry.getMinStake(ProfessionalRole.Lawyer);
      expect(minStake).toBeGreaterThan(0n);
    }, 30000);
  });

  describe('ArbitrationDAO', () => {
    it('should register as arbitrator', async () => {
      const result = await contracts.arbitration.registerArbitrator(200n * 10n**18n);
      expect(result.success).toBe(true);
    }, 60000);

    it('should create dispute', async () => {
      const result = await contracts.arbitration.createDispute({
        defendant: bob.address,
        description: 'Test dispute',
        evidenceUri: 'ipfs://evidence',
      });

      expect(result.success).toBe(true);
    }, 60000);

    it('should query arbitrator info', async () => {
      const arbitrator = await contracts.arbitration.getArbitrator(alice.address);

      if (arbitrator) {
        expect(arbitrator.account).toBe(alice.address);
        expect(arbitrator.isActive).toBe(true);
      }
    }, 30000);
  });

  describe('Contract Utilities', () => {
    it('should check if address is contract', async () => {
      if (ESCROW_ADDRESS) {
        const isContract = await contracts.isContract(ESCROW_ADDRESS);
        expect(isContract).toBe(true);
      }
    }, 30000);

    it('should get contract balance', async () => {
      if (ESCROW_ADDRESS) {
        const balance = await contracts.getContractBalance(ESCROW_ADDRESS);
        expect(balance).toBeGreaterThanOrEqual(0n);
      }
    }, 30000);

    it('should get contract info', async () => {
      if (ESCROW_ADDRESS) {
        const info = await contracts.getContractInfo(ESCROW_ADDRESS);
        expect(info).toBeDefined();
        expect(info?.address).toBe(ESCROW_ADDRESS);
      }
    }, 30000);
  });
});
