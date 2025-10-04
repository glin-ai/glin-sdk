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

### `useWallet()`
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

### `useBalance(address)`
Get real-time balance for an address.

```tsx
const { balance, loading, error } = useBalance(address)
```

### `useContract(contractAddress, metadata)`
Interact with smart contracts.

```tsx
const contract = useContract(contractAddress, metadata)
const result = await contract.query.getValue()
```

## Features

- ✅ Auto-detect GLIN wallet extension
- ✅ React hooks for wallet, balance, transactions
- ✅ TypeScript support
- ✅ SSR compatible (Next.js, Remix)
- ✅ Zustand-powered state management

## Documentation

Full documentation: https://github.com/glin-ai/glin-sdk

## License

Apache-2.0
