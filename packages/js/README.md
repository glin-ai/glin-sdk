# @glin-ai/sdk

Official JavaScript/TypeScript SDK for the GLIN AI Training Network.

## Installation

```bash
npm install @glin-ai/sdk
# or
pnpm add @glin-ai/sdk
# or
yarn add @glin-ai/sdk
```

## Quick Start

### 1. Authentication - "Sign in with GLIN"

Perfect for apps like v-lawyer that need wallet-based login:

```typescript
import { GlinAuth } from '@glin-ai/sdk';

// Create auth instance
const auth = new GlinAuth();

// Connect and authenticate
const result = await auth.authenticate('Your App Name');

console.log('Address:', result.address);
console.log('Signature:', result.signature);

// Send to your backend to create session
await fetch('/api/auth/glin', {
  method: 'POST',
  body: JSON.stringify(result)
});
```

### 2. Blockchain Client

Query the GLIN network:

```typescript
import { GlinClient } from '@glin-ai/sdk';

const client = new GlinClient('wss://rpc.glin.ai');
await client.connect();

// Get balance
const balance = await client.getBalance('5GrwvaEF...');
console.log(`Balance: ${balance.free}`);

// Get task details
const task = await client.getTask('task_123');
console.log(`Task bounty: ${task?.bounty}`);

// Subscribe to new blocks
const unsubscribe = await client.subscribeNewBlocks((blockNumber) => {
  console.log(`New block: ${blockNumber}`);
});

// Cleanup
await client.disconnect();
```

### 3. Provider Detection

Detect GLIN browser extension:

```typescript
import { ProviderDetector } from '@glin-ai/sdk';

// Check if extension is installed
if (ProviderDetector.isExtensionAvailable()) {
  console.log('GLIN extension found!');
} else {
  // Show install link
  const installUrl = ProviderDetector.getInstallUrl();
  console.log(`Install from: ${installUrl}`);
}

// Wait for extension to load (useful for page load)
const extension = await ProviderDetector.waitForExtension(3000);
if (extension) {
  // Use extension
  const accounts = await extension.enable();
}
```

## API Reference

### GlinAuth

#### `new GlinAuth(config?: GlinSDKConfig)`

Create authentication instance.

```typescript
const auth = new GlinAuth({
  preferExtension: true,  // Try extension first
  rpcUrl: 'wss://rpc.glin.ai'  // Fallback RPC
});
```

#### `connect(): Promise<GlinAccount>`

Connect to wallet (extension or direct).

#### `authenticate(appName?: string): Promise<AuthResult>`

Complete auth flow: connect + sign message.

```typescript
const { address, signature, message, timestamp } = await auth.authenticate('v-lawyer');
```

#### `signMessage(message?: string): Promise<SignatureResult>`

Sign a custom message.

#### `static verifySignature(address: string, message: string, signature: string): boolean`

Verify signature (use on backend).

```typescript
// Backend verification
import { GlinAuth } from '@glin-ai/sdk';

const isValid = GlinAuth.verifySignature(address, message, signature);
if (isValid) {
  // Create session
}
```

#### `disconnect(): void`

Disconnect wallet.

#### `getCurrentAccount(): GlinAccount | null`

Get currently connected account.

#### `isConnected(): boolean`

Check connection status.

### GlinClient

#### `new GlinClient(rpcUrl?: string)`

Create blockchain client.

#### `connect(): Promise<void>`

Connect to blockchain.

#### `disconnect(): Promise<void>`

Disconnect from blockchain.

#### `getBalance(address: string): Promise<Balance>`

Get account balance.

Returns:
```typescript
{
  free: string;      // Available balance
  reserved: string;  // Reserved (staked, etc.)
  frozen: string;    // Frozen balance
  total: string;     // Total balance
}
```

#### `getTask(taskId: string): Promise<ChainTask | null>`

Get task details from chain.

#### `getProvider(address: string): Promise<ChainProvider | null>`

Get provider details from chain.

#### `getBlockNumber(): Promise<number>`

Get current block number.

#### `subscribeNewBlocks(callback: (blockNumber: number) => void): Promise<() => void>`

Subscribe to new blocks. Returns unsubscribe function.

### ProviderDetector

#### `static isExtensionAvailable(): boolean`

Check if GLIN extension is available.

#### `static getExtension(): InjectedExtension | null`

Get extension instance.

#### `static waitForExtension(timeout?: number): Promise<InjectedExtension | null>`

Wait for extension to load (default 3s timeout).

#### `static getInstallUrl(): string`

Get browser-specific install URL.

## TypeScript Types

```typescript
interface GlinAccount {
  address: string;
  name?: string;
  source?: 'extension' | 'direct' | 'walletconnect';
}

interface AuthResult {
  address: string;
  signature: string;
  message: string;
  timestamp: number;
}

interface Balance {
  free: string;
  reserved: string;
  frozen: string;
  total: string;
}

interface ChainTask {
  id: string;
  creator: string;
  bounty: string;
  minProviders: number;
  maxProviders: number;
  ipfsHash: string;
  status: 'Pending' | 'Recruiting' | 'Running' | 'Validating' | 'Completed' | 'Failed' | 'Cancelled';
}

interface ChainProvider {
  account: string;
  stake: string;
  reputationScore: number;
  hardwareTier: 'Consumer' | 'Prosumer' | 'Professional';
  status: 'Active' | 'Idle' | 'Busy' | 'Offline' | 'Suspended' | 'Unbonding';
  isSlashed: boolean;
}
```

## React Integration

```typescript
import { useState, useEffect } from 'react';
import { GlinAuth, GlinAccount } from '@glin-ai/sdk';

function LoginButton() {
  const [account, setAccount] = useState<GlinAccount | null>(null);
  const [auth] = useState(() => new GlinAuth());

  const handleLogin = async () => {
    try {
      const result = await auth.authenticate('My App');
      setAccount(auth.getCurrentAccount());

      // Send to backend
      await fetch('/api/auth', {
        method: 'POST',
        body: JSON.stringify(result)
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => {
    auth.disconnect();
    setAccount(null);
  };

  if (account) {
    return (
      <div>
        <span>{account.address}</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return <button onClick={handleLogin}>Sign in with GLIN</button>;
}
```

## Examples

- **[Next.js Authentication](../../examples/nextjs-auth/)** - Full "Sign in with GLIN" example
- More examples coming soon...

## Browser Support

- Chrome/Chromium (with extension)
- Firefox (with extension)
- Edge (with extension)
- Node.js (for backend verification)

## License

Apache-2.0
