/**
 * Unit tests for contract utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  parseContractAbi,
  getContractMessages,
  validateContractAbi,
} from './utils';

const VALID_ABI = {
  source: {
    hash: '0x123',
    language: 'ink! 4.0.0',
    compiler: 'rustc 1.68.0',
  },
  contract: {
    name: 'test_contract',
    version: '1.0.0',
    authors: ['Test Author'],
    description: 'A test contract',
  },
  spec: {
    constructors: [
      {
        label: 'new',
        selector: '0x9bae9d5e',
        args: [],
        docs: ['Constructor'],
      },
    ],
    messages: [
      {
        label: 'get_value',
        selector: '0x1234',
        mutates: false,
        payable: false,
        args: [],
        returnType: { displayName: ['u128'], type: 0 },
        docs: ['Returns value'],
      },
      {
        label: 'set_value',
        selector: '0x5678',
        mutates: true,
        payable: false,
        args: [{ label: 'value', type: { displayName: ['u128'], type: 0 } }],
        returnType: { displayName: [], type: 1 },
        docs: ['Sets value'],
      },
    ],
    events: [],
  },
  types: [],
  version: 5,
};

describe('parseContractAbi', () => {
  it('should parse valid ABI metadata', () => {
    const metadata = parseContractAbi(VALID_ABI);

    expect(metadata.name).toBe('test_contract');
    expect(metadata.version).toBe('1.0.0');
    expect(metadata.authors).toEqual(['Test Author']);
    expect(metadata.description).toBe('A test contract');
    expect(metadata.source?.hash).toBe('0x123');
    expect(metadata.source?.language).toBe('ink! 4.0.0');
  });

  it('should handle ABI as JSON string', () => {
    const abiString = JSON.stringify(VALID_ABI);
    const metadata = parseContractAbi(abiString);

    expect(metadata.name).toBe('test_contract');
    expect(metadata.version).toBe('1.0.0');
  });

  it('should handle missing optional fields', () => {
    const minimalAbi = {
      contract: { name: 'minimal' },
      spec: { constructors: [], messages: [] },
    };

    const metadata = parseContractAbi(minimalAbi);

    expect(metadata.name).toBe('minimal');
    expect(metadata.version).toBe('0.0.0');
    expect(metadata.authors).toEqual([]);
    expect(metadata.description).toBeUndefined();
  });

  it('should handle completely missing contract info', () => {
    const noContractAbi = {
      spec: { constructors: [], messages: [] },
    };

    const metadata = parseContractAbi(noContractAbi);

    expect(metadata.name).toBe('Unknown');
    expect(metadata.version).toBe('0.0.0');
    expect(metadata.authors).toEqual([]);
  });
});

describe('getContractMessages', () => {
  it('should extract all contract messages', () => {
    const messages = getContractMessages(VALID_ABI);

    expect(messages).toHaveLength(2);
    expect(messages[0].label).toBe('get_value');
    expect(messages[1].label).toBe('set_value');
  });

  it('should parse message properties correctly', () => {
    const messages = getContractMessages(VALID_ABI);

    // get_value (read-only)
    expect(messages[0].mutates).toBe(false);
    expect(messages[0].payable).toBe(false);
    expect(messages[0].args).toEqual([]);
    expect(messages[0].docs).toEqual(['Returns value']);

    // set_value (mutating)
    expect(messages[1].mutates).toBe(true);
    expect(messages[1].payable).toBe(false);
    expect(messages[1].args).toHaveLength(1);
    expect(messages[1].args[0].label).toBe('value');
  });

  it('should handle ABI as JSON string', () => {
    const abiString = JSON.stringify(VALID_ABI);
    const messages = getContractMessages(abiString);

    expect(messages).toHaveLength(2);
  });

  it('should default mutates to true if not specified', () => {
    const abiWithoutMutates = {
      ...VALID_ABI,
      spec: {
        ...VALID_ABI.spec,
        messages: [
          {
            label: 'test',
            selector: '0x1111',
            args: [],
          },
        ],
      },
    };

    const messages = getContractMessages(abiWithoutMutates);

    expect(messages[0].mutates).toBe(true); // Defaults to true
  });

  it('should handle payable messages', () => {
    const abiWithPayable = {
      ...VALID_ABI,
      spec: {
        ...VALID_ABI.spec,
        messages: [
          {
            label: 'receive',
            selector: '0x9999',
            mutates: true,
            payable: true,
            args: [],
          },
        ],
      },
    };

    const messages = getContractMessages(abiWithPayable);

    expect(messages[0].payable).toBe(true);
  });

  it('should return empty array for missing messages', () => {
    const noMessagesAbi = {
      spec: {},
    };

    const messages = getContractMessages(noMessagesAbi);

    expect(messages).toEqual([]);
  });
});

describe('validateContractAbi', () => {
  it('should validate correct ABI', () => {
    const result = validateContractAbi(VALID_ABI);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should detect missing spec field', () => {
    const invalidAbi = { contract: { name: 'test' } };

    const result = validateContractAbi(invalidAbi);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing "spec" field');
  });

  it('should detect missing messages', () => {
    const invalidAbi = {
      spec: {
        constructors: [],
      },
    };

    const result = validateContractAbi(invalidAbi);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('messages'))).toBe(true);
  });

  it('should detect missing constructors', () => {
    const invalidAbi = {
      spec: {
        messages: [],
      },
    };

    const result = validateContractAbi(invalidAbi);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('constructors'))).toBe(true);
  });

  it('should detect invalid messages type', () => {
    const invalidAbi = {
      spec: {
        messages: 'not-an-array',
        constructors: [],
      },
    };

    const result = validateContractAbi(invalidAbi);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('messages'))).toBe(true);
  });

  it('should detect old ABI versions', () => {
    const oldAbi = {
      ...VALID_ABI,
      version: 3,
    };

    const result = validateContractAbi(oldAbi);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('version') && e.includes('3'))).toBe(true);
  });

  it('should accept version 4 and 5', () => {
    const v4Abi = { ...VALID_ABI, version: 4 };
    const v5Abi = { ...VALID_ABI, version: 5 };

    expect(validateContractAbi(v4Abi).valid).toBe(true);
    expect(validateContractAbi(v5Abi).valid).toBe(true);
  });

  it('should handle JSON string input', () => {
    const abiString = JSON.stringify(VALID_ABI);

    const result = validateContractAbi(abiString);

    expect(result.valid).toBe(true);
  });

  it('should handle invalid JSON string', () => {
    const invalidJson = '{ invalid json }';

    const result = validateContractAbi(invalidJson);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('parse'))).toBe(true);
  });

  it('should collect multiple errors', () => {
    const badAbi = {
      version: 2,
      spec: {
        // Missing both messages and constructors
      },
    };

    const result = validateContractAbi(badAbi);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
    expect(result.errors.some((e) => e.includes('messages'))).toBe(true);
    expect(result.errors.some((e) => e.includes('constructors'))).toBe(true);
    expect(result.errors.some((e) => e.includes('version'))).toBe(true);
  });
});
