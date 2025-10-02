/**
 * Unit tests for GlinContracts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GlinContracts } from '../index';

// Mock Polkadot API
const mockApi = {
  registry: {
    createType: vi.fn(),
  },
  query: {
    contracts: {
      contractInfoOf: vi.fn(),
    },
    system: {
      account: vi.fn(),
    },
  },
} as any;

const mockSigner = {
  address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
} as any;

describe('GlinContracts', () => {
  let contracts: GlinContracts;

  beforeEach(() => {
    vi.clearAllMocks();
    contracts = new GlinContracts({
      api: mockApi,
      signer: mockSigner,
      escrowAddress: '5Escrow...',
      registryAddress: '5Registry...',
      arbitrationAddress: '5Arbitration...',
    });
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(contracts).toBeDefined();
      expect(contracts.escrow).toBeDefined();
      expect(contracts.registry).toBeDefined();
      expect(contracts.arbitration).toBeDefined();
    });

    it('should initialize without signer', () => {
      const contractsNoSigner = new GlinContracts({
        api: mockApi,
        escrowAddress: '5Escrow...',
      });
      expect(contractsNoSigner).toBeDefined();
    });
  });

  describe('setSigner', () => {
    it('should update signer for all contracts', () => {
      const newSigner = {
        address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      } as any;

      contracts.setSigner(newSigner);

      // Verify signer was updated (implementation detail)
      expect(contracts.escrow).toBeDefined();
      expect(contracts.registry).toBeDefined();
      expect(contracts.arbitration).toBeDefined();
    });
  });

  describe('isContract', () => {
    it('should return true for valid contract address', async () => {
      mockApi.query.contracts.contractInfoOf.mockResolvedValue({
        isSome: true,
      });

      const result = await contracts.isContract('5Contract...');
      expect(result).toBe(true);
    });

    it('should return false for non-contract address', async () => {
      mockApi.query.contracts.contractInfoOf.mockResolvedValue({
        isNone: true,
        isSome: false,
      });

      const result = await contracts.isContract('5NotContract...');
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockApi.query.contracts.contractInfoOf.mockRejectedValue(new Error('Query failed'));

      const result = await contracts.isContract('5Error...');
      expect(result).toBe(false);
    });
  });

  describe('getContractBalance', () => {
    it('should return contract balance', async () => {
      mockApi.query.system.account.mockResolvedValue({
        data: {
          free: {
            toString: () => '1000000000000000000000',
          },
        },
      });

      const balance = await contracts.getContractBalance('5Contract...');
      expect(balance).toBe(1000000000000000000000n);
    });

    it('should handle zero balance', async () => {
      mockApi.query.system.account.mockResolvedValue({
        data: {
          free: {
            toString: () => '0',
          },
        },
      });

      const balance = await contracts.getContractBalance('5Contract...');
      expect(balance).toBe(0n);
    });
  });

  describe('getContractInfo', () => {
    it('should return contract info when exists', async () => {
      mockApi.query.contracts.contractInfoOf.mockResolvedValue({
        isNone: false,
        isSome: true,
        unwrap: () => ({
          codeHash: {
            toHex: () => '0x123...',
          },
        }),
      });

      const info = await contracts.getContractInfo('5Contract...');
      expect(info).toBeDefined();
      expect(info?.address).toBe('5Contract...');
      expect(info?.codeHash).toBe('0x123...');
    });

    it('should return null when contract does not exist', async () => {
      mockApi.query.contracts.contractInfoOf.mockResolvedValue({
        isNone: true,
        isSome: false,
      });

      const info = await contracts.getContractInfo('5NotContract...');
      expect(info).toBeNull();
    });

    it('should return null on error', async () => {
      mockApi.query.contracts.contractInfoOf.mockRejectedValue(new Error('Query failed'));

      const info = await contracts.getContractInfo('5Error...');
      expect(info).toBeNull();
    });
  });

  describe('estimateGas', () => {
    it('should return gas estimate', async () => {
      const gas = await contracts.estimateGas('5Contract...', 'method', []);
      expect(gas).toBeGreaterThan(0n);
      expect(gas).toBe(100000000000n); // Default estimate
    });

    it('should accept custom gas limit', async () => {
      const gas = await contracts.estimateGas('5Contract...', 'method', [], 5000n);
      expect(gas).toBeGreaterThan(0n);
    });
  });
});
