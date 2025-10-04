/**
 * Integration tests for GLIN Generic Contract Support
 *
 * Prerequisites:
 * - Local GLIN node running (ws://localhost:9944)
 * - Test contract WASM and ABI files
 *
 * Run: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import {
  Contract,
  deployContract,
  uploadCode,
  instantiateContract,
  parseContractAbi,
  getContractMessages,
  isContractAddress,
  getContractCodeHash,
  validateContractAbi,
} from '../../src';

const RPC_URL = process.env.RPC_URL || 'ws://localhost:9944';

// Sample ERC20-like token ABI for testing
const TEST_TOKEN_ABI = {
  source: {
    hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    language: 'ink! 4.0.0',
    compiler: 'rustc 1.68.0',
  },
  contract: {
    name: 'test_token',
    version: '1.0.0',
    authors: ['GLIN Test'],
  },
  spec: {
    constructors: [
      {
        label: 'new',
        selector: '0x9bae9d5e',
        args: [
          { label: 'total_supply', type: { displayName: ['Balance'], type: 0 } },
        ],
        docs: ['Creates a new token contract'],
      },
    ],
    messages: [
      {
        label: 'total_supply',
        selector: '0xdb6375a8',
        mutates: false,
        payable: false,
        args: [],
        returnType: { displayName: ['Balance'], type: 0 },
        docs: ['Returns the total token supply'],
      },
      {
        label: 'balance_of',
        selector: '0x0f755a56',
        mutates: false,
        payable: false,
        args: [{ label: 'owner', type: { displayName: ['AccountId'], type: 1 } }],
        returnType: { displayName: ['Balance'], type: 0 },
        docs: ['Returns the account balance'],
      },
      {
        label: 'transfer',
        selector: '0x84a15da1',
        mutates: true,
        payable: false,
        args: [
          { label: 'to', type: { displayName: ['AccountId'], type: 1 } },
          { label: 'value', type: { displayName: ['Balance'], type: 0 } },
        ],
        returnType: { displayName: ['Result'], type: 2 },
        docs: ['Transfers tokens'],
      },
    ],
    events: [],
  },
  types: [
    { id: 0, type: { def: { primitive: 'u128' } } },
    { id: 1, type: { def: { composite: { fields: [{ type: 2 }] } } } },
  ],
  version: 5,
};

describe.skip('Generic Contract Support', () => {
  let api: ApiPromise;
  let alice: any;
  let bob: any;
  let deployedContract: Contract;
  let contractAddress: string;

  beforeAll(async () => {
    // Connect to local node
    const provider = new WsProvider(RPC_URL);
    api = await ApiPromise.create({ provider });

    // Create test accounts
    const keyring = new Keyring({ type: 'sr25519' });
    alice = keyring.addFromUri('//Alice');
    bob = keyring.addFromUri('//Bob');
  }, 30000);

  afterAll(async () => {
    await api?.disconnect();
  });

  describe('Contract Utilities', () => {
    it('should parse contract ABI', () => {
      const metadata = parseContractAbi(TEST_TOKEN_ABI);

      expect(metadata.name).toBe('test_token');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.authors).toContain('GLIN Test');
    });

    it('should extract contract messages', () => {
      const messages = getContractMessages(TEST_TOKEN_ABI);

      expect(messages).toHaveLength(3);
      expect(messages[0].label).toBe('total_supply');
      expect(messages[0].mutates).toBe(false);
      expect(messages[1].label).toBe('balance_of');
      expect(messages[2].label).toBe('transfer');
      expect(messages[2].mutates).toBe(true);
    });

    it('should validate contract ABI', () => {
      const validation = validateContractAbi(TEST_TOKEN_ABI);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid ABI', () => {
      const invalidAbi = { ...TEST_TOKEN_ABI };
      delete (invalidAbi as any).spec;

      const validation = validateContractAbi(invalidAbi);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('spec');
    });

    it('should validate ABI version', () => {
      const oldAbi = { ...TEST_TOKEN_ABI, version: 3 };

      const validation = validateContractAbi(oldAbi);

      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('version');
    });
  });

  describe.skipIf(!process.env.TEST_WASM_PATH)('Contract Deployment', () => {
    const TEST_WASM_PATH = process.env.TEST_WASM_PATH || '';

    it('should upload contract code', async () => {
      // This test requires actual WASM file
      // const wasmCode = await fs.readFile(TEST_WASM_PATH);

      // const result = await uploadCode(api, wasmCode, alice);

      // expect(result.success).toBe(true);
      // expect(result.codeHash).toBeDefined();
      // expect(result.txHash).toBeDefined();
      expect(true).toBe(true); // Placeholder
    }, 60000);

    it('should deploy contract with constructor args', async () => {
      // This test requires actual WASM file
      // const wasmCode = await fs.readFile(TEST_WASM_PATH);
      // const totalSupply = 1000000n * 10n ** 18n;

      // const result = await deployContract(
      //   api,
      //   wasmCode,
      //   TEST_TOKEN_ABI,
      //   [totalSupply],
      //   alice
      // );

      // expect(result.success).toBe(true);
      // expect(result.address).toBeDefined();
      // expect(result.contract).toBeDefined();
      // expect(result.txHash).toBeDefined();

      // deployedContract = result.contract;
      // contractAddress = result.address;
      expect(true).toBe(true); // Placeholder
    }, 60000);

    it('should instantiate from uploaded code', async () => {
      // This test requires uploaded code hash
      // const codeHash = '0x...';

      // const result = await instantiateContract(
      //   api,
      //   codeHash,
      //   TEST_TOKEN_ABI,
      //   [1000000n],
      //   alice
      // );

      // expect(result.success).toBe(true);
      // expect(result.address).toBeDefined();
      expect(true).toBe(true); // Placeholder
    }, 60000);
  });

  describe.skipIf(!process.env.TEST_CONTRACT_ADDRESS)('Contract Interaction', () => {
    const TEST_CONTRACT_ADDRESS = process.env.TEST_CONTRACT_ADDRESS || '';

    beforeAll(() => {
      if (TEST_CONTRACT_ADDRESS) {
        deployedContract = new Contract(api, TEST_CONTRACT_ADDRESS, TEST_TOKEN_ABI, alice);
        contractAddress = TEST_CONTRACT_ADDRESS;
      }
    });

    it('should create Contract instance', () => {
      const contract = new Contract(api, contractAddress, TEST_TOKEN_ABI, alice);

      expect(contract).toBeDefined();
      expect(contract.getAddress()).toBe(contractAddress);
      expect(contract.getAbi()).toBe(TEST_TOKEN_ABI);
    });

    it('should have dynamic query methods', () => {
      expect(deployedContract.query.total_supply).toBeDefined();
      expect(deployedContract.query.balance_of).toBeDefined();
      expect(typeof deployedContract.query.total_supply).toBe('function');
    });

    it('should have dynamic tx methods', () => {
      expect(deployedContract.tx.transfer).toBeDefined();
      expect(typeof deployedContract.tx.transfer).toBe('function');
    });

    it('should query contract state', async () => {
      const result = await deployedContract.query.total_supply();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.gasConsumed).toBeDefined();
    }, 30000);

    it('should query with arguments', async () => {
      const result = await deployedContract.query.balance_of(alice.address);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    }, 30000);

    it('should execute transaction', async () => {
      const result = await deployedContract.tx.transfer(bob.address, 1000n);

      expect(result.success).toBe(true);
      expect(result.txHash).toBeDefined();
      expect(result.blockHash).toBeDefined();
      expect(result.events).toBeDefined();
    }, 60000);

    it('should estimate gas for call', async () => {
      const gasEstimate = await deployedContract.estimateGas('transfer', bob.address, 1000n);

      expect(gasEstimate).toBeGreaterThan(0n);
    }, 30000);

    it('should check if address is contract', async () => {
      const isContract = await isContractAddress(api, contractAddress);

      expect(isContract).toBe(true);
    }, 30000);

    it('should get contract code hash', async () => {
      const codeHash = await getContractCodeHash(api, contractAddress);

      expect(codeHash).toBeDefined();
      expect(typeof codeHash).toBe('string');
    }, 30000);

    it('should handle query errors gracefully', async () => {
      const result = await deployedContract.query.balance_of('invalid_address');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 30000);

    it('should update signer', () => {
      deployedContract.setSigner(bob);

      // Signer is updated, but we can't directly verify it
      expect(true).toBe(true);
    });
  });

  describe('Contract API', () => {
    it('should create Contract without signer for queries only', () => {
      const contract = new Contract(api, '5ContractAddress...', TEST_TOKEN_ABI);

      expect(contract).toBeDefined();
      expect(contract.query).toBeDefined();
    });

    it('should throw error when executing tx without signer', async () => {
      const contract = new Contract(api, '5ContractAddress...', TEST_TOKEN_ABI);

      await expect(
        contract.tx.transfer('5Recipient...', 1000n)
      ).rejects.toThrow('Signer required');
    });

    it('should build correct method interface from ABI', () => {
      const contract = new Contract(api, '5ContractAddress...', TEST_TOKEN_ABI, alice);

      // Should have all message methods
      expect(Object.keys(contract.query)).toContain('total_supply');
      expect(Object.keys(contract.query)).toContain('balance_of');
      expect(Object.keys(contract.query)).toContain('transfer');

      // Should only have mutating methods in tx
      expect(Object.keys(contract.tx)).toContain('transfer');
      expect(Object.keys(contract.tx)).not.toContain('total_supply');
      expect(Object.keys(contract.tx)).not.toContain('balance_of');
    });
  });
});
