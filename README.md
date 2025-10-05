<div align="center">
  <img src="https://raw.githubusercontent.com/glin-ai/glin-sdk/main/assets/glin-coin.svg" alt="GLIN Logo" width="120" height="120">

  # GLIN SDK

Official TypeScript/JavaScript SDK for the GLIN AI Training Network.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@glin-ai/sdk.svg)](https://www.npmjs.com/package/@glin-ai/sdk)

</div>

## 🎯 Overview

Complete TypeScript/JavaScript SDK for building applications on GLIN Network. Provides all core blockchain features for frontend and backend development.

### ✅ Features

- 🌐 **Network connection and RPC** - Connect to GLIN Network nodes
- 🔐 **Account management** - Create and manage blockchain accounts
- 📜 **Contract deployment** - Deploy ink! smart contracts
- 💸 **Transaction handling** - Sign and submit transactions
- 📡 **Event subscriptions** - Listen to blockchain events
- 🎨 **Browser extension support** - Integration with GLIN wallet extension
- ✨ **Full TypeScript support** - Type-safe API with IntelliSense

## 📦 Installation

```bash
npm install @glin-ai/sdk
# or
yarn add @glin-ai/sdk
# or
pnpm add @glin-ai/sdk
```

**[📚 Full Documentation](./packages/js/)**

## 🔗 Other SDKs

GLIN Network provides SDKs for multiple languages:

- **[glin-sdk-rust](https://github.com/glin-ai/glin-sdk-rust)**: Rust SDK (backend + CLI tools)
- **glin-sdk-python** (planned): Python SDK (data science + analytics)

All SDKs share the same **core features**, with language-specific extensions.

## 🚀 Quick Start

### "Sign in with GLIN" Authentication

```typescript
import { GlinAuth } from '@glin-ai/sdk';

// Frontend: Authenticate user
const auth = new GlinAuth();
const { address, signature, message } = await auth.authenticate('Your App');

// Backend: Verify signature
const isValid = GlinAuth.verifySignature(address, message, signature);
if (isValid) {
  // Create session with wallet address
  req.session.userId = address;
}
```

**[📖 Full Example](./examples/nextjs-auth/)**

### Blockchain Queries

```typescript
import { GlinClient } from '@glin-ai/sdk';

const client = await GlinClient.connect('wss://testnet.glin.ai');
const balance = await client.getBalance('5GrwvaEF...');
console.log(`Balance: ${balance.free} GLIN`);
```

### Contract Deployment

```typescript
import { GlinContracts } from '@glin-ai/sdk';

const contracts = new GlinContracts({ api, signer });
const result = await contracts.deploy({
  wasm: contractWasm,
  abi: contractAbi,
  constructorName: 'new',
  args: [],
  value: 0,
});
console.log(`Contract deployed at: ${result.address}`);
```

## 📜 Contract Interaction

Interact with ink! smart contracts deployed on GLIN Network:

```typescript
import { GlinContracts } from '@glin-ai/sdk';

const contracts = new GlinContracts({ api, signer });

// Call contract method
const result = await contracts.call({
  address: '5Contract...',
  abi: contractAbi,
  method: 'transfer',
  args: ['5Recipient...', 1000],
  value: 0,
});

// Query contract state
const balance = await contracts.query({
  address: '5Contract...',
  abi: contractAbi,
  method: 'balanceOf',
  args: ['5Account...'],
});
```

## 🎯 Use Cases

### 1. Web3 Authentication
Add "Sign in with GLIN" to your app (like OAuth):
- No passwords needed
- User owns their identity
- Works with browser extension

**Example apps**: v-lawyer, dashboards, marketplaces

### 2. Blockchain Integration
Query GLIN network from any language:
- Account balances
- Task details
- Provider information
- Event subscriptions

**Example apps**: Explorers, analytics, monitoring tools

### 3. Provider Tools
Build GPU provider applications:
- Task acceptance
- Reward claiming
- Status monitoring

**Example apps**: Provider CLI, desktop apps

## ✨ Key Features

| Feature | Status |
|---------|--------|
| Blockchain Client | ✅ |
| Account Management | ✅ |
| Browser Extension Support | ✅ |
| "Sign in with GLIN" Auth | ✅ |
| Signature Verification | ✅ |
| Contract Deployment | ✅ |
| Contract Interaction | ✅ |
| Event Subscriptions | ✅ |
| TypeScript Support | ✅ |
| React Hooks | 🚧 |

## 🏗️ Architecture

### How "Sign in with GLIN" Works

```
┌─────────────┐         ┌──────────────┐         ┌─────────┐
│  Your App   │────────▶│ GLIN Browser │────────▶│  GLIN   │
│  (v-lawyer) │         │  Extension   │         │  Chain  │
└─────────────┘         └──────────────┘         └─────────┘
      │                        │                        │
      │ 1. Connect()           │                        │
      ├───────────────────────▶│                        │
      │                        │                        │
      │ 2. Sign Message        │                        │
      ├───────────────────────▶│                        │
      │                        │ 3. User Approves       │
      │ 4. Signature ◀─────────┤                        │
      │                        │                        │
      │ 5. Verify (optional)   │                        │
      ├────────────────────────┼───────────────────────▶│
      │                        │                        │
      │ 6. Session Created     │                        │
```

### SDK Distribution

```
glin-sdk/
└── packages/js/  ──▶  npm publish  ──▶  @glin-ai/sdk
```

## 📚 Documentation

- **[Getting Started Guide](./docs/getting-started.md)**
- **[Authentication Guide](./docs/authentication.md)**
- **[API Reference](./docs/api-reference.md)**
- **[Examples](./examples/)**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

```bash
# Clone monorepo
git clone https://github.com/glin-ai/glin-sdk.git
cd glin-sdk

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## 📄 License

Apache-2.0 - see [LICENSE](LICENSE) for details.

## 🔗 Links

- **Website**: https://glin.ai
- **Documentation**: https://docs.glin.ai
- **Discord**: https://discord.gg/glin-ai
- **GitHub**: https://github.com/glin-ai

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/glin-ai/glin-sdk/issues)
- **Discord**: [Join our community](https://discord.gg/glin-ai)
- **Email**: dev@glin.ai
