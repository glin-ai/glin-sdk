/**
 * Unit tests for GlinClient
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GlinClient } from './index';

describe('GlinClient', () => {
  let client: GlinClient;

  beforeAll(() => {
    client = new GlinClient('wss://glin-rpc-production.up.railway.app');
  });

  afterAll(async () => {
    await client.disconnect();
  });

  describe('Connection', () => {
    it('should connect to blockchain', async () => {
      await client.connect();
      const api = client.getApi();
      expect(api).not.toBeNull();
    });

    it('should get current block number', async () => {
      const blockNumber = await client.getBlockNumber();
      expect(blockNumber).toBeGreaterThan(0);
    });
  });

  describe('Balance queries', () => {
    it('should get balance for an address', async () => {
      const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      const balance = await client.getBalance(testAddress);

      expect(balance).toBeDefined();
      expect(balance.free).toBeDefined();
      expect(balance.reserved).toBeDefined();
      expect(balance.frozen).toBeDefined();
      expect(balance.total).toBeDefined();
    });
  });

  describe('Block queries', () => {
    it('should get latest blocks', async () => {
      const blocks = await client.getLatestBlocks(5);

      expect(blocks.length).toBeGreaterThan(0);
      expect(blocks.length).toBeLessThanOrEqual(5);
      expect(blocks[0].number).toBeGreaterThan(0);
      expect(blocks[0].hash).toBeDefined();
    });

    it('should get block by number', async () => {
      const block = await client.getBlock(1);

      expect(block).not.toBeNull();
      expect(block?.number).toBe(1);
      expect(block?.hash).toBeDefined();
    });
  });

  describe('Account info', () => {
    it('should get account info', async () => {
      const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      const accountInfo = await client.getAccountInfo(testAddress);

      expect(accountInfo.address).toBe(testAddress);
      expect(accountInfo.nonce).toBeGreaterThanOrEqual(0);
      expect(accountInfo.balance.free).toBeDefined();
    });
  });

  describe('Search', () => {
    it('should search for block by number', async () => {
      const result = await client.search('1');

      expect(result).not.toBeNull();
      expect(result?.type).toBe('block');
    });

    it('should search for account by address', async () => {
      const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      const result = await client.search(testAddress);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('account');
    });

    it('should return null for invalid query', async () => {
      const result = await client.search('invalid');

      expect(result).toBeNull();
    });
  });

  describe('Subscriptions', () => {
    it('should subscribe to new blocks', async () => {
      let receivedBlock = false;

      const unsubscribe = await client.subscribeNewBlocks((blockNumber) => {
        expect(blockNumber).toBeGreaterThan(0);
        receivedBlock = true;
      });

      // Wait for at least one block
      await new Promise((resolve) => setTimeout(resolve, 15000));

      unsubscribe();
      expect(receivedBlock).toBe(true);
    }, 20000);
  });
});
