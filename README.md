# GLIN SDK

Official Software Development Kits for the GLIN AI Training Network.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## 📦 Available SDKs

### JavaScript/TypeScript (npm)
```bash
npm install @glin-ai/sdk
```
- ✅ Browser extension detection
- ✅ "Sign in with GLIN" authentication
- ✅ Blockchain client (Polkadot.js)
- ✅ Smart contract interactions
- ✅ Full TypeScript support

**[📚 JS/TS Documentation](./packages/js/)**

### Python (PyPI)
```bash
pip install glin-sdk
```
- ✅ Blockchain client (substrate-interface)
- ✅ Signature verification
- ✅ Smart contract interactions
- ✅ Type hints support
- ✅ Async/await ready

**[📚 Python Documentation](./packages/python/)**

### Rust (crates.io)
```bash
cargo add glin-sdk
```
- ✅ Type-safe API (subxt)
- ✅ Smart contract interactions
- ✅ Zero-cost abstractions
- ✅ Async/await (Tokio)
- ✅ Production-ready

**[📚 Rust Documentation](./packages/rust/)**

## 🚀 Quick Start

### TypeScript - "Sign in with GLIN" (v-lawyer use case)

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

### Python - Blockchain Queries

```python
from glin_sdk import GlinClient

with GlinClient("wss://rpc.glin.ai") as client:
    balance = client.get_balance("5GrwvaEF...")
    print(f"Balance: {balance.free} GLIN")
```

### Rust - Backend Integration

```rust
use glin_sdk::GlinClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = GlinClient::new("wss://rpc.glin.ai").await?;
    let balance = client.get_balance("5GrwvaEF...").await?;
    println!("Balance: {} GLIN", balance.free);
    Ok(())
}
```

## 🔐 Smart Contracts

GLIN provides three production-ready smart contracts for building decentralized applications:

### **GenericEscrow** - Milestone-based Payments
Secure payment escrow with milestone tracking and dispute resolution.

```typescript
import { GlinContracts } from '@glin-ai/sdk';

const contracts = new GlinContracts({ api, signer, escrowAddress: '5Escrow...' });

// Create escrow agreement
const agreementId = await contracts.escrow.createAgreement({
  provider: '5Provider...',
  milestoneDescriptions: ['Design', 'Development', 'Testing'],
  milestoneAmounts: [500n * 10n**18n, 1500n * 10n**18n, 1000n * 10n**18n],
  milestoneDeadlines: [deadline1, deadline2, deadline3],
  disputeTimeout: finalDeadline,
  value: 3000n * 10n**18n
});
```

### **ProfessionalRegistry** - Reputation System
On-chain professional registration with reputation scoring.

```python
from glin_sdk.contracts import GlinContracts, RegisterProfessionalParams, ProfessionalRole

contracts = GlinContracts(substrate, registry_address="5Registry...")

# Register as professional
await contracts.registry.register(RegisterProfessionalParams(
    role=ProfessionalRole.LAWYER,
    metadata_uri="ipfs://QmXYZ.../profile.json",
    stake_amount="100000000000000000000"
))

# Submit review
await contracts.registry.submit_review(SubmitReviewParams(
    professional="5Professional...",
    rating=5,
    comment="Excellent service!"
))
```

### **ArbitrationDAO** - Dispute Resolution
Decentralized dispute resolution through stake-weighted voting.

```rust
use glin_sdk::contracts::{GlinContracts, CreateDisputeParams, VoteChoice};

let contracts = GlinContracts::new("wss://rpc.glin.ai", ...).await?;

// Create dispute
let dispute_id = contracts.arbitration.create_dispute(
    CreateDisputeParams {
        defendant: defendant_addr,
        description: "Service not delivered".into(),
        evidence_uri: "ipfs://evidence".into(),
    },
    &keypair
).await?;

// Vote on dispute
contracts.arbitration.vote(
    VoteParams { dispute_id, choice: VoteChoice::InFavorOfClaimant },
    &keypair
).await?;
```

**📦 Contract Repository**: https://github.com/glin-ai/glin-contracts

**📚 Documentation**:
- [Getting Started with Contracts](./docs/contracts/getting-started.md)
- [Escrow Contract Guide](./docs/contracts/escrow.md)
- [Registry Contract Guide](./docs/contracts/registry.md)
- [Arbitration Contract Guide](./docs/contracts/arbitration.md)
- [Deployment Guide](./docs/contracts/deployment.md)

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

## 📋 Features Comparison

| Feature | TypeScript | Python | Rust |
|---------|-----------|--------|------|
| Blockchain Client | ✅ | ✅ | ✅ |
| Authentication | ✅ | ✅ | ✅ |
| Extension Support | ✅ | ❌ | ❌ |
| Signature Verification | ✅ | ✅ | ✅ |
| **Smart Contracts** | ✅ | ✅ | ✅ |
| - GenericEscrow | ✅ | ✅ | ✅ |
| - ProfessionalRegistry | ✅ | ✅ | ✅ |
| - ArbitrationDAO | ✅ | ✅ | ✅ |
| Task Queries | ✅ | ✅ | 🚧 |
| Provider Queries | ✅ | ✅ | 🚧 |
| Event Subscriptions | ✅ | ❌ | 🚧 |

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
glin-sdk/ (Monorepo)
├── packages/js/      ──▶  npm publish  ──▶  @glin-ai/sdk
├── packages/python/  ──▶  twine upload ──▶  glin-sdk (PyPI)
└── packages/rust/    ──▶  cargo publish ──▶ glin-sdk (crates.io)
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
