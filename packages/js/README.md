<div align="center">
  <img src="https://raw.githubusercontent.com/glin-ai/glin-sdk/main/assets/glin-coin.svg" alt="GLIN Logo" width="100" height="100">

  # @glin-ai/sdk

Official JavaScript/TypeScript SDK for the GLIN AI Training Network.

[![npm version](https://img.shields.io/npm/v/@glin-ai/sdk.svg)](https://www.npmjs.com/package/@glin-ai/sdk)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../../LICENSE)

</div>

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

## Smart Contracts

The SDK provides a powerful, ethers.js-like API for interacting with ink! smart contracts.

### Deploying a Contract

```typescript
import { GlinClient, deployContract } from '@glin-ai/sdk';
import { GlinAuth } from '@glin-ai/sdk';
import contractAbi from './my_contract.json';
import contractWasm from './my_contract.wasm';

const client = new GlinClient('wss://testnet.glin.network');
await client.connect();

const auth = new GlinAuth();
const { address, signer } = await auth.connect();

// Deploy contract
const result = await deployContract(
  client.getApi(),
  contractWasm,
  contractAbi,
  [1000000n], // constructor arguments
  signer,
  { value: '1000000000000000' } // 0.001 GLIN
);

if (result.success) {
  console.log('Contract deployed at:', result.address);
  console.log('Code hash:', result.codeHash);
}
```

### Interacting with Contracts

The `Contract` class provides dynamic interfaces for any ink! contract:

```typescript
import { Contract } from '@glin-ai/sdk';

// Connect to deployed contract
const contract = new Contract(
  client.getApi(),
  '5ContractAddress...',
  contractAbi,
  signer // optional, only needed for transactions
);

// Read-only queries (no gas costs)
const balance = await contract.query.balanceOf('5Account...');
if (balance.success) {
  console.log('Balance:', balance.data);
  console.log('Gas consumed:', balance.gasConsumed);
}

// State-changing transactions
const txResult = await contract.tx.transfer(
  '5Recipient...',
  1000n,
  { value: 0, gasLimit: { refTime: 3000000000n, proofSize: 1000000n } }
);

if (txResult.success) {
  console.log('Transaction hash:', txResult.txHash);
  console.log('Block hash:', txResult.blockHash);
}
```

### Contract Utilities

```typescript
import {
  parseContractAbi,
  validateContractAbi,
  isContractAddress,
  getContractCodeHash
} from '@glin-ai/sdk';

// Parse ABI metadata
const metadata = parseContractAbi(contractAbi);
console.log('Contract name:', metadata.contractName);
console.log('Constructors:', metadata.constructors);
console.log('Messages:', metadata.messages);

// Validate ABI
const isValid = validateContractAbi(contractAbi);

// Check if address is a contract
const api = client.getApi();
const isContract = await isContractAddress(api, '5Address...');

// Get contract code hash
const codeHash = await getContractCodeHash(api, '5ContractAddress...');
```

### Advanced: Upload & Instantiate Separately

For advanced use cases, you can upload code and instantiate separately:

```typescript
import { uploadCode, instantiateContract } from '@glin-ai/sdk';

// Step 1: Upload WASM code
const uploadResult = await uploadCode(
  client.getApi(),
  contractWasm,
  signer
);

if (uploadResult.success) {
  const codeHash = uploadResult.codeHash;

  // Step 2: Instantiate from code hash
  const instantiateResult = await instantiateContract(
    client.getApi(),
    codeHash,
    contractAbi,
    [1000000n], // constructor args
    signer,
    { value: '0', salt: null }
  );

  if (instantiateResult.success) {
    console.log('Contract address:', instantiateResult.address);
  }
}
```

### Contract API Reference

#### `Contract`

**Constructor:**
```typescript
new Contract(
  api: ApiPromise,
  address: string,
  abi: any,
  signer?: Signer
)
```

**Properties:**
- `query` - Object with all query methods from ABI
- `tx` - Object with all transaction methods from ABI
- `address` - Contract address
- `abi` - Contract ABI metadata

**Methods:**
- `executeQuery(method, options?, ...args)` - Execute a contract query
- `executeTx(method, options?, ...args)` - Execute a contract transaction

#### `deployContract()`

```typescript
async function deployContract(
  api: ApiPromise,
  wasm: Uint8Array | string,
  abi: any,
  constructorArgs: any[] = [],
  signer: Signer,
  options: DeployOptions = {}
): Promise<DeployResult>
```

**Options:**
- `value?: string | bigint` - Native tokens to send
- `gasLimit?: WeightV2` - Gas limit override
- `storageDepositLimit?: string | bigint` - Storage deposit limit
- `salt?: string | null` - Deployment salt for deterministic addresses

**Returns:**
```typescript
{
  success: boolean;
  address?: string;
  codeHash?: string;
  txHash?: string;
  blockHash?: string;
  error?: string;
}
```

#### `uploadCode()`

Upload WASM code to the chain:

```typescript
async function uploadCode(
  api: ApiPromise,
  wasm: Uint8Array | string,
  signer: Signer,
  options: UploadOptions = {}
): Promise<UploadResult>
```

#### `instantiateContract()`

Instantiate a contract from uploaded code hash:

```typescript
async function instantiateContract(
  api: ApiPromise,
  codeHash: string,
  abi: any,
  constructorArgs: any[] = [],
  signer: Signer,
  options: InstantiateOptions = {}
): Promise<InstantiateResult>
```

### Type Definitions

```typescript
interface QueryResult<T = any> {
  success: boolean;
  data?: T;
  gasConsumed?: bigint;
  storageDeposit?: bigint;
  error?: string;
}

interface TxResult {
  success: boolean;
  txHash?: string;
  blockHash?: string;
  events?: any[];
  error?: string;
}

interface ContractMetadata {
  contractName: string;
  version: string;
  authors: string[];
  constructors: ContractMessage[];
  messages: ContractMessage[];
  events: ContractEvent[];
  docs: string[];
}

interface ContractMessage {
  label: string;
  selector: string;
  args: ContractArgument[];
  returnType?: ContractType;
  mutates: boolean;
  payable: boolean;
  docs: string[];
}
```

## Examples

- **[Next.js Authentication](../../examples/nextjs-auth/)** - Full "Sign in with GLIN" example
- More examples coming soon...

## Migration Guide

### From Specific Contracts to Generic API

**Old approach (pre-0.5.0):**
```typescript
// Limited to pre-defined contracts
import { EscrowContract } from '@glin-ai/sdk';

const escrow = new EscrowContract(api, address, signer);
await escrow.createEscrow(...);
```

**New approach (0.5.0+):**
```typescript
// Works with ANY ink! contract
import { Contract } from '@glin-ai/sdk';

const contract = new Contract(api, address, abi, signer);
await contract.tx.createEscrow(...); // Dynamic method from ABI
```

The new approach:
- ✅ Works with any ink! contract
- ✅ Dynamic interface from ABI
- ✅ Type-safe with TypeScript
- ✅ Follows ethers.js patterns
- ✅ Simpler API surface

## Browser Support

- Chrome/Chromium (with extension)
- Firefox (with extension)
- Edge (with extension)
- Node.js (for backend verification)

## License

Apache-2.0
