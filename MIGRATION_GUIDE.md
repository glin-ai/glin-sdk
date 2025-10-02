# GLIN SDK Migration Guide

Complete guide for migrating internal apps from direct @polkadot/api to @glin-ai/sdk.

## Overview

This migration introduces adapters that wrap the SDK to maintain backward compatibility while enabling gradual rollout through feature flags.

## Architecture

```
┌─────────────────────────────────────────┐
│         Your Application Code           │
│  (No changes needed - same interface)   │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         Migration Adapter                │
│  (WalletSDK / ExplorerSDK)              │
│  • Feature flags                         │
│  • Backward compatibility                │
│  • Gradual rollout                       │
└──────┬────────────────────────┬─────────┘
       │                        │
┌──────▼────────┐      ┌───────▼─────────┐
│  @glin-ai/sdk │      │  @polkadot/api  │
│  (New)        │      │  (Fallback)     │
└───────────────┘      └─────────────────┘
```

## Installation

### 1. Install SDK in each app

```bash
# In glin-wallet
cd /home/eralp/Projects/glin/glin-wallet
pnpm install

# In glin-explorer
cd /home/eralp/Projects/glin/glin-explorer
pnpm install

# In glin-extension
cd /home/eralp/Projects/glin/glin-extension
pnpm install
```

This will install `@glin-ai/sdk` as a file dependency.

### 2. Verify installation

```bash
pnpm list @glin-ai/sdk
# Should show: @glin-ai/sdk file:../glin-sdk/packages/js
```

## Migration Steps

### Step 1: Add adapter alongside existing client

```typescript
// src/lib/substrate/client.ts (keep existing)
import { SubstrateClient } from '@/lib/substrate/client';

// src/lib/sdk/adapter.ts (already created)
import { WalletSDK } from '@/lib/sdk/adapter';
```

### Step 2: Create environment variable for feature flag

```bash
# .env.local
NEXT_PUBLIC_USE_SDK=false  # Start disabled
```

### Step 3: Update client initialization

**Before:**
```typescript
const client = new SubstrateClient(rpcUrl);
await client.connect();
```

**After (with feature flag):**
```typescript
const useSDK = process.env.NEXT_PUBLIC_USE_SDK === 'true';

const client = useSDK
  ? new WalletSDK(rpcUrl, {
      useSDKForBalance: true,
      useSDKForTransfer: true,
      useSDKForSubscriptions: true,
      useSDKForBlocks: true,
    })
  : new SubstrateClient(rpcUrl);

await client.connect();
```

**Best (gradual feature flags):**
```typescript
const client = new WalletSDK(rpcUrl, {
  useSDKForBalance: process.env.NEXT_PUBLIC_SDK_BALANCE === 'true',
  useSDKForTransfer: process.env.NEXT_PUBLIC_SDK_TRANSFER === 'true',
  useSDKForSubscriptions: process.env.NEXT_PUBLIC_SDK_SUBS === 'true',
  useSDKForBlocks: process.env.NEXT_PUBLIC_SDK_BLOCKS === 'true',
});

await client.connect();
```

### Step 4: No code changes needed!

Because adapters maintain the exact same interface, all existing code continues to work:

```typescript
// This code works with BOTH old and new client
const balance = await client.getBalance(address);
const blockNumber = await client.getCurrentBlock();
const unsubscribe = client.subscribeBalance(address, (balance) => {
  console.log('Balance updated:', balance.free);
});
```

## Rollout Plan

### Week 1: Shadow Testing
- Keep feature flags disabled
- Run SDK in "shadow mode" (logs only, no real usage)
- Compare results with old implementation

### Week 2: Enable Balance Queries
```bash
NEXT_PUBLIC_SDK_BALANCE=true
```
- Monitor error rates
- Compare performance
- Rollback if issues

### Week 3: Enable Transfers
```bash
NEXT_PUBLIC_SDK_BALANCE=true
NEXT_PUBLIC_SDK_TRANSFER=true
```
- Critical path - test thoroughly
- Monitor transaction success rates
- Verify fee estimates match

### Week 4: Enable Subscriptions
```bash
NEXT_PUBLIC_SDK_BALANCE=true
NEXT_PUBLIC_SDK_TRANSFER=true
NEXT_PUBLIC_SDK_SUBS=true
```
- Test websocket stability
- Monitor memory usage
- Verify no memory leaks

### Week 5: Enable Block Queries
```bash
NEXT_PUBLIC_SDK_BALANCE=true
NEXT_PUBLIC_SDK_TRANSFER=true
NEXT_PUBLIC_SDK_SUBS=true
NEXT_PUBLIC_SDK_BLOCKS=true
```
- All features enabled
- Full SDK usage
- Monitor for any issues

### Week 6: Remove Old Code
- Delete `SubstrateClient` class
- Remove feature flag checks
- Use SDK directly

## Explorer-Specific Migration

For explorer, you get access to specialized modules:

```typescript
import { ExplorerSDK } from '@/lib/sdk/adapter';

const explorer = new ExplorerSDK(rpcUrl);
await explorer.connect();

// Access specialized modules directly
const tasks = await explorer.tasks.getAllTasks();
const activeTasks = await explorer.tasks.getTasksByStatus('Running');

const providers = await explorer.providers.getActiveProviders();
const topProviders = await explorer.providers.getProvidersByStake();

const leaderboard = await explorer.points.getLeaderboard(100);
const myRank = await explorer.points.getRank(myAddress);

// Or use wrapper methods (same as before)
const task = await explorer.getTask(taskId);
const provider = await explorer.getProviderStake(address);
const points = await explorer.getTestnetPoints(address);
```

## Testing Strategy

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { WalletSDK } from '@/lib/sdk/adapter';

describe('WalletSDK', () => {
  it('should connect and get balance', async () => {
    const wallet = new WalletSDK('wss://rpc.glin.ai');
    await wallet.connect();

    const balance = await wallet.getBalance('5GrwvaEF...');
    expect(balance.free).toBeDefined();

    await wallet.disconnect();
  });
});
```

### Integration Tests

```typescript
// Compare old vs new implementation
async function compareImplementations(address: string) {
  const oldClient = new SubstrateClient(rpcUrl);
  const newClient = new WalletSDK(rpcUrl);

  await Promise.all([
    oldClient.connect(),
    newClient.connect()
  ]);

  const [oldBalance, newBalance] = await Promise.all([
    oldClient.getBalance(address),
    newClient.getBalance(address)
  ]);

  console.log('Old:', oldBalance);
  console.log('New:', newBalance);
  console.log('Match:', oldBalance.free === newBalance.free);

  await Promise.all([
    oldClient.disconnect(),
    newClient.disconnect()
  ]);
}
```

### Load Testing

```typescript
// Test under load
async function loadTest() {
  const wallet = new WalletSDK(rpcUrl);
  await wallet.connect();

  const addresses = [...]; // 100 addresses
  const start = Date.now();

  await Promise.all(
    addresses.map(addr => wallet.getBalance(addr))
  );

  const duration = Date.now() - start;
  console.log(`Loaded ${addresses.length} balances in ${duration}ms`);
  console.log(`Average: ${duration / addresses.length}ms per query`);

  await wallet.disconnect();
}
```

## Rollback Procedure

If issues are discovered:

### 1. Immediate rollback (disable feature flag)
```bash
NEXT_PUBLIC_SDK_BALANCE=false
```

### 2. Redeploy with old implementation
```typescript
const client = new SubstrateClient(rpcUrl);
```

### 3. Investigate issue
- Check error logs
- Compare behavior
- Fix SDK bug or adapter logic

### 4. Re-enable when fixed
```bash
NEXT_PUBLIC_SDK_BALANCE=true
```

## Common Issues

### Issue: "Module not found: @glin-ai/sdk"
**Solution:** Run `pnpm install` in the app directory

### Issue: Types mismatch between old and new
**Solution:** Adapters re-export all types for compatibility

### Issue: Performance degradation
**Solution:** Check if using fallback mode (direct API), enable SDK features

### Issue: Websocket connection failures
**Solution:** Verify RPC endpoint, check SDK connection handling

## Monitoring

### Key Metrics

1. **Error Rate**
   - Track errors in balance queries
   - Track transfer failures
   - Track subscription disconnects

2. **Performance**
   - Query latency (p50, p95, p99)
   - Transfer confirmation time
   - Subscription reconnect time

3. **Usage**
   - % of requests using SDK vs fallback
   - Feature flag distribution
   - Active subscriptions

### Logging

```typescript
// Add logging to adapter
async getBalance(address: string): Promise<Balance> {
  const start = Date.now();
  try {
    const balance = this.config.useSDKForBalance
      ? await this.client.getBalance(address)
      : await this.fallbackGetBalance(address);

    console.log({
      method: 'getBalance',
      useSDK: this.config.useSDKForBalance,
      duration: Date.now() - start,
      success: true
    });

    return balance;
  } catch (error) {
    console.error({
      method: 'getBalance',
      useSDK: this.config.useSDKForBalance,
      duration: Date.now() - start,
      success: false,
      error: error.message
    });
    throw error;
  }
}
```

## Benefits Summary

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Total LOC (3 apps) | 1,137 | ~250 | 78% reduction |
| Code duplication | High | None | Eliminated |
| Type safety | Medium | High | Better types |
| Testing | Per app | SDK only | Centralized |
| Bug fixes | 3 places | 1 place | 3x faster |
| Features | Per app | SDK shared | Consistent |

## Support

If you encounter issues during migration:

1. Check this guide first
2. Review adapter implementation
3. Test with feature flags disabled
4. Compare with old implementation
5. File issue on glin-sdk repo

---

**Remember:** Migration is gradual and safe. Feature flags allow instant rollback at any time.
