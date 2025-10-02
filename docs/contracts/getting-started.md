# Getting Started with GLIN Smart Contracts

GLIN provides three production-ready smart contracts for building decentralized applications on the GLIN blockchain:

- **GenericEscrow**: Milestone-based payment escrow with dispute resolution
- **ProfessionalRegistry**: Professional registration and reputation management
- **ArbitrationDAO**: Decentralized dispute resolution through stake-weighted voting

This guide will help you get started with interacting with these contracts using the GLIN SDK.

## Prerequisites

- GLIN blockchain node running (local or testnet)
- Contract addresses for deployed contracts
- Wallet/keypair for signing transactions
- Basic understanding of smart contracts

## Installation

### JavaScript/TypeScript

```bash
npm install @glin-ai/sdk
# or
yarn add @glin-ai/sdk
```

### Python

```bash
pip install glin-sdk
```

### Rust

```toml
# Cargo.toml
[dependencies]
glin-sdk = "0.3.0"
```

## Quick Start

### JavaScript/TypeScript

```typescript
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { GlinContracts } from '@glin-ai/sdk';

// Connect to GLIN network
const provider = new WsProvider('wss://rpc.glin.ai');
const api = await ApiPromise.create({ provider });

// Create keypair for signing
const keyring = new Keyring({ type: 'sr25519' });
const alice = keyring.addFromUri('//Alice');

// Initialize contracts
const contracts = new GlinContracts({
  api,
  signer: alice,
  escrowAddress: '5Escrow...',
  registryAddress: '5Registry...',
  arbitrationAddress: '5Arbitration...'
});

// Use the contracts
const agreementId = await contracts.escrow.createAgreement({
  provider: '5Provider...',
  milestoneDescriptions: ['Design', 'Development'],
  milestoneAmounts: [500n * 10n**18n, 1500n * 10n**18n],
  milestoneDeadlines: [Date.now() + 86400000, Date.now() + 172800000],
  disputeTimeout: Date.now() + 259200000,
  value: 2000n * 10n**18n
});
```

### Python

```python
from substrateinterface import SubstrateInterface, Keypair
from glin_sdk.contracts import GlinContracts, CreateAgreementParams

# Connect to GLIN network
substrate = SubstrateInterface(url="wss://rpc.glin.ai")

# Create keypair for signing
keypair = Keypair.create_from_uri('//Alice')

# Initialize contracts
contracts = GlinContracts(
    substrate=substrate,
    keypair=keypair,
    escrow_address="5Escrow...",
    registry_address="5Registry...",
    arbitration_address="5Arbitration..."
)

# Use the contracts
params = CreateAgreementParams(
    provider="5Provider...",
    milestone_descriptions=["Design", "Development"],
    milestone_amounts=["500000000000000000000", "1500000000000000000000"],
    milestone_deadlines=[1234567890, 1234567890],
    dispute_timeout=1234567890,
    value="2000000000000000000000"
)

result = await contracts.escrow.create_agreement(params)
```

### Rust

```rust
use glin_sdk::contracts::{GlinContracts, CreateAgreementParams};
use sp_core::sr25519::Pair;
use sp_core::Pair as PairTrait;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Connect to GLIN network and initialize contracts
    let contracts = GlinContracts::new(
        "wss://rpc.glin.ai",
        Some("5Escrow...".parse()?),
        Some("5Registry...".parse()?),
        Some("5Arbitration...".parse()?),
    ).await?;

    // Create keypair for signing
    let (pair, _) = Pair::from_phrase("//Alice", None)?;

    // Use the contracts
    let params = CreateAgreementParams {
        provider: "5Provider...".parse()?,
        milestone_descriptions: vec!["Design".into(), "Development".into()],
        milestone_amounts: vec![500_000_000_000_000_000_000, 1_500_000_000_000_000_000_000],
        milestone_deadlines: vec![1234567890, 1234567890],
        dispute_timeout: 1234567890,
        oracle: None,
        value: 2_000_000_000_000_000_000_000,
    };

    let result = contracts.escrow.create_agreement(params, &pair).await?;

    Ok(())
}
```

## Contract Addresses

### Testnet

```
GenericEscrow:          5GEscrow... (to be deployed)
ProfessionalRegistry:   5GRegistry... (to be deployed)
ArbitrationDAO:         5GArbitration... (to be deployed)
```

### Mainnet

```
Coming soon...
```

## Common Patterns

### Error Handling

All contract methods return a `ContractResult` type that includes success status and error messages:

**TypeScript:**
```typescript
const result = await contracts.escrow.createAgreement(params);
if (result.success) {
  console.log('Agreement created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

**Python:**
```python
result = await contracts.escrow.create_agreement(params)
if result.success:
    print(f"Agreement created: {result.data}")
else:
    print(f"Error: {result.error}")
```

**Rust:**
```rust
let result = contracts.escrow.create_agreement(params, &pair).await?;
if result.success {
    println!("Agreement created: {:?}", result.data);
} else {
    eprintln!("Error: {:?}", result.error);
}
```

### Gas Estimation

You can customize gas limits for transactions:

**TypeScript:**
```typescript
const result = await contracts.escrow.createAgreement(params, {
  gasLimit: 150000000000n
});
```

**Python:**
```python
result = await contracts.escrow.create_agreement(params, gas_limit=150_000_000_000)
```

### Querying Contract State

All contracts provide read-only query methods:

**TypeScript:**
```typescript
const agreement = await contracts.escrow.getAgreement(agreementId);
const profile = await contracts.registry.getProfile(accountId);
const dispute = await contracts.arbitration.getDispute(disputeId);
```

## Next Steps

- [Escrow Contract Guide](./escrow.md) - Learn about milestone-based payments
- [Registry Contract Guide](./registry.md) - Learn about professional registration
- [Arbitration Contract Guide](./arbitration.md) - Learn about dispute resolution
- [Deployment Guide](./deployment.md) - Deploy contracts to your network

## Resources

- [GLIN Contracts Repository](https://github.com/glin-ai/glin-contracts) - Contract source code
- [GLIN Documentation](https://docs.glin.ai) - Full documentation
- [API Reference](https://docs.glin.ai/api) - Detailed API reference

## Support

- [GitHub Issues](https://github.com/glin-ai/glin-sdk/issues) - Report bugs
- [Discord](https://discord.gg/glin-ai) - Community support
- [Documentation](https://docs.glin.ai) - Official docs
