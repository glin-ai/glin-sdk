# Smart Contract Deployment Guide

This guide walks you through deploying GLIN smart contracts to your local node, testnet, or mainnet.

## Prerequisites

- **Rust toolchain**: For building contracts
- **cargo-contract**: For compiling and deploying
- **GLIN node**: Running local or access to testnet/mainnet
- **Polkadot.js**: For deployment via UI (optional)
- **Funded account**: For paying deployment gas fees

## Installation

### Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### Install cargo-contract

```bash
cargo install cargo-contract --force
```

### Verify Installation

```bash
cargo-contract --version
```

## Building Contracts

### Clone Repository

```bash
git clone https://github.com/glin-ai/glin-contracts.git
cd glin-contracts
```

### Build All Contracts

```bash
./scripts/build-all.sh
```

Or build individually:

```bash
# Build GenericEscrow
cd escrow
cargo contract build --release

# Build ProfessionalRegistry
cd ../registry
cargo contract build --release

# Build ArbitrationDAO
cd ../arbitration
cargo contract build --release
```

### Build Output

After building, you'll find:

```
escrow/target/ink/generic_escrow.contract
escrow/target/ink/generic_escrow.wasm
escrow/target/ink/metadata.json

registry/target/ink/professional_registry.contract
registry/target/ink/professional_registry.wasm
registry/target/ink/metadata.json

arbitration/target/ink/arbitration_dao.contract
arbitration/target/ink/arbitration_dao.wasm
arbitration/target/ink/metadata.json
```

## Deployment Methods

### Method 1: Using Polkadot.js Apps (Recommended for Testing)

1. **Open Polkadot.js Apps**
   ```
   https://polkadot.js.org/apps/
   ```

2. **Connect to Node**
   - Click top-left dropdown
   - Select "Local Node" or custom endpoint
   - For GLIN testnet: `wss://testnet-rpc.glin.ai`

3. **Navigate to Contracts**
   - Developer → Contracts

4. **Upload Contract**
   - Click "Upload & Deploy Code"
   - Upload `.contract` file
   - Fill in constructor parameters
   - Click "Next"

5. **Deploy**
   - Set deployment gas limit (use max button)
   - Click "Deploy"
   - Sign transaction

6. **Save Contract Address**
   - Copy the contract address from the deployment success message

### Method 2: Using cargo-contract CLI

```bash
# Deploy GenericEscrow
cd escrow
cargo contract instantiate \
  --constructor new \
  --args "5PlatformAccount..." 200 \
  --suri //Alice \
  --url ws://localhost:9944 \
  --execute

# Deploy ProfessionalRegistry
cd ../registry
cargo contract instantiate \
  --constructor new \
  --args "5Owner..." "5Treasury..." 1000 \
  --suri //Alice \
  --url ws://localhost:9944 \
  --execute

# Deploy ArbitrationDAO
cd ../arbitration
cargo contract instantiate \
  --constructor new \
  --args "5Owner..." 100000000000000000000 604800000 5000 \
  --suri //Alice \
  --url ws://localhost:9944 \
  --execute
```

### Method 3: Using Script

Use the provided deployment script:

```bash
./scripts/deploy-testnet.sh
```

The script will:
1. Prompt for constructor parameters
2. Deploy all three contracts
3. Save addresses to `deployed-contracts.json`

### Method 4: Programmatic Deployment (JavaScript)

```typescript
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { CodePromise } from '@polkadot/api-contract';
import fs from 'fs';

async function deployContracts() {
  // Connect to node
  const provider = new WsProvider('ws://localhost:9944');
  const api = await ApiPromise.create({ provider });

  // Create account
  const keyring = new Keyring({ type: 'sr25519' });
  const deployer = keyring.addFromUri('//Alice');

  // Load contract metadata
  const escrowWasm = fs.readFileSync('escrow/target/ink/generic_escrow.wasm');
  const escrowMetadata = JSON.parse(fs.readFileSync('escrow/target/ink/metadata.json', 'utf8'));

  // Upload code
  const code = new CodePromise(api, escrowMetadata, escrowWasm);

  // Deploy
  const tx = code.tx.new(
    { gasLimit: api.registry.createType('WeightV2', { refTime: 100000000000n, proofSize: 100000n }) },
    deployer.address, // platform_account
    200 // platform_fee_bps (2%)
  );

  await new Promise((resolve, reject) => {
    tx.signAndSend(deployer, (result) => {
      if (result.status.isInBlock || result.status.isFinalized) {
        console.log('Contract deployed!');
        console.log('Address:', result.contract.address.toString());
        resolve(result);
      }
    });
  });
}

deployContracts();
```

## Constructor Parameters

### GenericEscrow

```rust
pub fn new(platform_account: AccountId, platform_fee_bps: u16) -> Self
```

**Parameters:**
- `platform_account`: Address to receive platform fees
- `platform_fee_bps`: Platform fee in basis points (200 = 2%)

**Example:**
```bash
--args "5PlatformAccount..." 200
```

### ProfessionalRegistry

```rust
pub fn new(
    owner: AccountId,
    slash_treasury: AccountId,
    slash_percentage_bps: u16
) -> Self
```

**Parameters:**
- `owner`: Contract owner (can slash professionals)
- `slash_treasury`: Address to receive slashed funds
- `slash_percentage_bps`: Slash percentage (1000 = 10%)

**Example:**
```bash
--args "5Owner..." "5Treasury..." 1000
```

### ArbitrationDAO

```rust
pub fn new(
    owner: AccountId,
    min_arbitrator_stake: Balance,
    voting_period_ms: u64,
    quorum_bps: u16
) -> Self
```

**Parameters:**
- `owner`: Contract owner
- `min_arbitrator_stake`: Minimum stake to be arbitrator (e.g., `100000000000000000000` = 100 GLIN)
- `voting_period_ms`: Voting period in milliseconds (e.g., `604800000` = 7 days)
- `quorum_bps`: Quorum percentage (5000 = 50%)

**Example:**
```bash
--args "5Owner..." 100000000000000000000 604800000 5000
```

## Verification

After deployment, verify contracts work:

```bash
# Test escrow
cargo contract call \
  --contract 5EscrowAddress... \
  --message get_agreement \
  --args 0 \
  --suri //Alice \
  --dry-run

# Test registry
cargo contract call \
  --contract 5RegistryAddress... \
  --message get_min_stake \
  --args Lawyer \
  --suri //Alice \
  --dry-run

# Test arbitration
cargo contract call \
  --contract 5ArbitrationAddress... \
  --message is_active_arbitrator \
  --args "5SomeAddress..." \
  --suri //Alice \
  --dry-run
```

## Deployment Checklist

- [ ] Contracts built successfully
- [ ] Node is running and synced
- [ ] Deployer account has sufficient funds
- [ ] Constructor parameters prepared
- [ ] Deployment transaction submitted
- [ ] Contract addresses saved
- [ ] Contracts verified with test calls
- [ ] Addresses shared with frontend/SDK
- [ ] Addresses added to documentation

## Gas Estimates

Approximate gas costs for deployment:

| Contract | Estimated Gas |
|----------|--------------|
| GenericEscrow | ~200,000,000,000 |
| ProfessionalRegistry | ~180,000,000,000 |
| ArbitrationDAO | ~200,000,000,000 |

**Total for all three**: ~580,000,000,000 gas units

## Network-Specific Deployments

### Local Development Node

```bash
# Start local node
./target/release/glin-node --dev --tmp

# Deploy with Alice account
cargo contract instantiate ... --suri //Alice --url ws://localhost:9944
```

### GLIN Testnet

```bash
# Use testnet endpoint
cargo contract instantiate ... --suri "your seed phrase" --url wss://testnet-rpc.glin.ai
```

### GLIN Mainnet

```bash
# Use mainnet endpoint (when available)
cargo contract instantiate ... --suri "your seed phrase" --url wss://rpc.glin.ai
```

## Post-Deployment Configuration

### Update SDK Configuration

After deployment, update your application configuration:

**TypeScript:**
```typescript
// config.ts
export const CONTRACT_ADDRESSES = {
  escrow: '5EscrowAddress...',
  registry: '5RegistryAddress...',
  arbitration: '5ArbitrationAddress...'
};
```

**Python:**
```python
# config.py
CONTRACT_ADDRESSES = {
    "escrow": "5EscrowAddress...",
    "registry": "5RegistryAddress...",
    "arbitration": "5ArbitrationAddress..."
}
```

**Rust:**
```rust
// config.rs
pub const ESCROW_ADDRESS: &str = "5EscrowAddress...";
pub const REGISTRY_ADDRESS: &str = "5RegistryAddress...";
pub const ARBITRATION_ADDRESS: &str = "5ArbitrationAddress...";
```

## Upgradeability

GLIN contracts are **not upgradeable** by design for security and immutability. To update:

1. Deploy new contract version
2. Migrate data (if possible)
3. Update frontend to use new address
4. Deprecate old contract

## Monitoring

After deployment, monitor contracts:

```bash
# Watch events
polkadot-js-api --ws ws://localhost:9944 --subscribe chain.newHeads

# Query contract storage
cargo contract call --contract 5Address... --message get_... --dry-run

# Check contract balance
polkadot-js-api --ws ws://localhost:9944 query.system.account 5ContractAddress...
```

## Troubleshooting

### "OutOfGas" Error

Increase gas limit:
```bash
--gas-limit 200000000000
```

### "CodeNotFound" Error

Ensure code was uploaded:
```bash
cargo contract upload --url ws://localhost:9944
```

### "ContractReverted" Error

Check constructor parameters match expected types.

### Deployment Hangs

- Check node is running: `curl -H "Content-Type: application/json" -d '{"id":1, "jsonrpc":"2.0", "method": "system_health"}' http://localhost:9944`
- Verify account has funds
- Try with higher gas limit

## Security Best Practices

1. **Audit Contracts**: Get professional audit before mainnet
2. **Test Thoroughly**: Deploy to testnet first
3. **Secure Keys**: Use hardware wallet for mainnet deployment
4. **Save Addresses**: Backup contract addresses securely
5. **Verify Code**: Verify deployed bytecode matches source
6. **Monitor Activity**: Set up alerts for unusual activity

## Resources

- [cargo-contract Documentation](https://github.com/paritytech/cargo-contract)
- [ink! Documentation](https://use.ink/)
- [Polkadot.js Apps](https://polkadot.js.org/apps/)
- [GLIN Contracts Repository](https://github.com/glin-ai/glin-contracts)

## Support

- [GitHub Issues](https://github.com/glin-ai/glin-contracts/issues)
- [Discord](https://discord.gg/glin-ai)
- [Documentation](https://docs.glin.ai)
