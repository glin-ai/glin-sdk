# @glin-ai/sdk-react

React hooks and components for GLIN SDK - build wallet-connected apps with ease.

## Installation

```bash
npm install @glin-ai/sdk @glin-ai/sdk-react
```

## Quick Start

### 1. Wrap your app with GlinProvider

```tsx
import { GlinProvider } from '@glin-ai/sdk-react'

function App() {
  return (
    <GlinProvider rpcEndpoint="wss://testnet.glin.network">
      <YourApp />
    </GlinProvider>
  )
}
```

### 2. Use wallet hooks

```tsx
import { useWallet, useBalance } from '@glin-ai/sdk-react'

function WalletButton() {
  const { address, connect, disconnect, isConnected } = useWallet()
  const { balance, loading } = useBalance(address)

  if (!isConnected) {
    return <button onClick={connect}>Connect Wallet</button>
  }

  return (
    <div>
      <p>Address: {address}</p>
      <p>Balance: {balance} tGLIN</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  )
}
```

## Available Hooks

### Wallet & Account Hooks

#### `useWallet()`
Manage wallet connection and account state.

```tsx
const {
  address,        // Current wallet address
  isConnected,    // Connection status
  connect,        // Connect wallet
  disconnect,     // Disconnect wallet
  signer          // GlinSigner instance
} = useWallet()
```

#### `useBalance(address)`
Get real-time balance for an address.

```tsx
const { balance, loading, error } = useBalance(address)
```

#### `useAuth()`
Handle authentication flow with signature.

```tsx
const { authenticate, signature, loading } = useAuth()

const handleLogin = async () => {
  const result = await authenticate('My App')
  // Send result.signature to backend
}
```

### Smart Contract Hooks

#### `useContract(options)`
Initialize a contract instance for interaction.

```tsx
import { useContract, useGlinSigner } from '@glin-ai/sdk-react'
import tokenAbi from './MyToken.json'

function MyComponent() {
  const { signer } = useGlinSigner()

  const { contract, loading, error } = useContract({
    address: '5ContractAddress...',
    abi: tokenAbi,
    signer // optional, only needed for transactions
  })

  return <div>{contract ? 'Contract loaded' : 'Loading...'}</div>
}
```

#### `useContractQuery(options)`
Query contract state (read-only, no gas costs).

```tsx
import { useContract, useContractQuery } from '@glin-ai/sdk-react'
import tokenAbi from './MyToken.json'

function TokenBalance({ account }: { account: string }) {
  const { contract } = useContract({
    address: '5ContractAddress...',
    abi: tokenAbi
  })

  const {
    data: balance,
    loading,
    error,
    refetch,
    gasConsumed
  } = useContractQuery({
    contract,
    method: 'balanceOf',
    args: [account],
    enabled: true, // optional, default true
    refetchInterval: 5000 // optional, auto-refetch every 5s
  })

  if (loading) return <div>Loading balance...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <p>Balance: {balance?.toString()}</p>
      <p>Gas consumed: {gasConsumed?.toString()}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  )
}
```

#### `useContractTx(options)`
Execute contract transactions (state-changing, costs gas).

```tsx
import { useContract, useContractTx, useGlinSigner } from '@glin-ai/sdk-react'
import tokenAbi from './MyToken.json'

function TransferButton() {
  const { signer } = useGlinSigner()

  const { contract } = useContract({
    address: '5ContractAddress...',
    abi: tokenAbi,
    signer
  })

  const {
    execute,
    data,
    loading,
    error,
    reset
  } = useContractTx({
    contract,
    method: 'transfer'
  })

  const handleTransfer = async () => {
    const result = await execute(
      '5Recipient...',
      1000n,
      {
        value: 0,
        gasLimit: { refTime: 3000000000n, proofSize: 1000000n }
      }
    )

    if (result?.success) {
      console.log('Transfer successful!', result.txHash)
    }
  }

  if (data?.success) {
    return (
      <div>
        <p>✅ Transaction successful!</p>
        <p>Hash: {data.txHash}</p>
        <button onClick={reset}>Send Another</button>
      </div>
    )
  }

  return (
    <button onClick={handleTransfer} disabled={loading}>
      {loading ? 'Sending...' : 'Transfer Tokens'}
    </button>
  )
}
```

#### `useContractDeploy(options)`
Deploy new smart contracts.

```tsx
import { useContractDeploy, useGlinSigner } from '@glin-ai/sdk-react'
import { parseGLIN } from '@glin-ai/sdk'
import contractAbi from './my_contract.json'
import contractWasm from './my_contract.wasm'

function DeployContract() {
  const { signer } = useGlinSigner()

  const {
    deploy,
    data,
    loading,
    error,
    reset
  } = useContractDeploy({ signer })

  const handleDeploy = async () => {
    const result = await deploy(
      contractWasm,
      contractAbi,
      [1000000n], // constructor arguments
      {
        value: parseGLIN('10'), // send 10 GLIN to contract
        salt: null // optional salt for deterministic addresses
      }
    )

    if (result?.success) {
      console.log('Contract deployed at:', result.address)
      console.log('Code hash:', result.codeHash)
    }
  }

  if (data?.success) {
    return (
      <div>
        <p>✅ Contract deployed!</p>
        <p>Address: {data.address}</p>
        <p>Code Hash: {data.codeHash}</p>
        <button onClick={reset}>Deploy Another</button>
      </div>
    )
  }

  return (
    <button onClick={handleDeploy} disabled={loading || !signer}>
      {loading ? 'Deploying...' : 'Deploy Contract'}
    </button>
  )
}
```

### Federated Learning Hooks

#### `useFederatedTask(taskId)`
Track federated learning task status.

```tsx
const { task, loading } = useFederatedTask('task_123')
```

#### `useProviderMining()`
Manage provider mining operations.

```tsx
const { startMining, stopMining, isMining } = useProviderMining()
```

#### `useRewards(address)`
Track rewards and earnings.

```tsx
const { rewards, claimRewards, loading } = useRewards(address)
```

## Complete Example: Token Transfer App

```tsx
import {
  GlinProvider,
  useWallet,
  useContract,
  useContractQuery,
  useContractTx,
  useGlinSigner
} from '@glin-ai/sdk-react'
import tokenAbi from './ERC20.json'

const TOKEN_ADDRESS = '5TokenContract...'

function TokenApp() {
  return (
    <GlinProvider rpcEndpoint="wss://testnet.glin.network">
      <WalletConnect />
      <TokenDashboard />
    </GlinProvider>
  )
}

function WalletConnect() {
  const { address, connect, disconnect, isConnected } = useWallet()

  if (!isConnected) {
    return <button onClick={connect}>Connect Wallet</button>
  }

  return (
    <div>
      <p>Connected: {address}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  )
}

function TokenDashboard() {
  const { address, isConnected } = useWallet()
  const { signer } = useGlinSigner()

  const { contract } = useContract({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    signer
  })

  const { data: balance } = useContractQuery({
    contract,
    method: 'balanceOf',
    args: [address],
    enabled: isConnected,
    refetchInterval: 10000 // refresh every 10s
  })

  const { execute, loading, data } = useContractTx({
    contract,
    method: 'transfer'
  })

  const handleTransfer = async (recipient: string, amount: bigint) => {
    await execute(recipient, amount)
  }

  if (!isConnected) {
    return <div>Please connect wallet</div>
  }

  return (
    <div>
      <h2>Your Balance: {balance?.toString()}</h2>
      {data?.success && <p>✅ Transfer successful!</p>}
      <TransferForm onSubmit={handleTransfer} loading={loading} />
    </div>
  )
}
```

## Hook Options & Return Types

### `useContract` Options
```typescript
interface UseContractOptions {
  address: string
  abi: any
  signer?: Signer // optional, needed for transactions
}

interface UseContractReturn {
  contract: Contract | null
  loading: boolean
  error: Error | null
}
```

### `useContractQuery` Options
```typescript
interface UseContractQueryOptions<T = any> {
  contract: Contract | null
  method: string
  args?: any[]
  enabled?: boolean // default: true
  refetchInterval?: number // milliseconds
}

interface UseContractQueryReturn<T = any> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  gasConsumed?: bigint
  storageDeposit?: bigint
}
```

### `useContractTx` Options
```typescript
interface UseContractTxOptions {
  contract: Contract | null
  method: string
}

interface UseContractTxReturn {
  execute: (...args: any[]) => Promise<TxResult | null>
  data: TxResult | null
  loading: boolean
  error: Error | null
  reset: () => void
}
```

### `useContractDeploy` Options
```typescript
interface UseContractDeployOptions {
  signer: Signer
}

interface UseContractDeployReturn {
  deploy: (
    wasm: Uint8Array | string,
    abi: any,
    constructorArgs?: any[],
    options?: DeployOptions
  ) => Promise<DeployResult | null>
  data: DeployResult | null
  loading: boolean
  error: Error | null
  reset: () => void
}
```

## Features

- ✅ Auto-detect GLIN wallet extension
- ✅ React hooks for wallet, balance, transactions
- ✅ Generic smart contract support (works with ANY ink! contract)
- ✅ TypeScript support with full type inference
- ✅ SSR compatible (Next.js, Remix, etc.)
- ✅ Zustand-powered state management
- ✅ Automatic refetching and real-time updates
- ✅ Error handling and loading states
- ✅ ethers.js-like API patterns

## Documentation

Full documentation: https://github.com/glin-ai/glin-sdk

## License

Apache-2.0
