# Arbitration DAO Contract Example (Rust)

This example demonstrates decentralized dispute resolution using the GLIN SDK and ArbitrationDAO smart contract.

## What This Example Shows

- ✅ Connecting to GLIN network with Rust
- ✅ Registering as arbitrator with stake
- ✅ Creating disputes with evidence
- ✅ Stake-weighted voting mechanism
- ✅ Finalizing disputes and resolutions
- ✅ Querying arbitrator statistics

## Prerequisites

1. **GLIN Node Running**
   ```bash
   # Start local development node
   ./target/release/glin-node --dev
   ```

2. **ArbitrationDAO Contract Deployed**
   - Deploy the contract using [Deployment Guide](../../docs/contracts/deployment.md)
   - Note the contract address

3. **Rust** installed (1.70 or higher)

## Setup

1. **Configure**
   - Edit `src/main.rs` and update:
     ```rust
     const RPC_URL: &str = "ws://localhost:9944";
     const ARBITRATION_ADDRESS: &str = "5Arbitration..."; // Your contract address
     ```

## Run

```bash
cargo run
```

## Expected Output

```
🚀 GLIN Arbitration DAO Example

📡 Connecting to GLIN network...
✅ Connected to GLIN network

👤 Creating test accounts...
Claimant (Alice): 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
Defendant (Bob): 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
Arbitrator 1 (Charlie): 5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y
Arbitrator 2 (Dave): 5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy
Arbitrator 3 (Eve): 5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw

📝 Initializing arbitration contract...
✅ Contract initialized

🔨 Registering arbitrators...
Each arbitrator stakes 200 GLIN
✅ Charlie registered as arbitrator (stake: 200 GLIN)
✅ Dave registered as arbitrator (stake: 300 GLIN)
✅ Eve registered as arbitrator (stake: 150 GLIN)

🔍 Querying arbitrator details...
Arbitrator: Dave
  Stake: 300 GLIN
  Disputes participated: 0
  Reputation: 100
  Active: true

⚖️  Creating dispute...
Dispute: Provider failed to deliver AI training services
Evidence: ipfs://QmXYZ.../evidence.pdf
✅ Dispute created! ID: 0

🔍 Querying dispute details...
Dispute ID: 0
Claimant: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
Defendant: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
Description: Provider failed to deliver agreed AI training services despite full payment of 5000 GLIN
Status: Open
Evidence: ipfs://QmXYZ.../training-dispute-evidence.pdf

🗳️  Starting voting period...
✅ Voting period started (duration: 7 days)

🗳️  Arbitrators casting votes...
✅ Charlie voted: In favor of claimant (200 GLIN)
✅ Dave voted: In favor of defendant (300 GLIN)
✅ Eve voted: In favor of claimant (150 GLIN)

📊 Vote tally:
  Votes for claimant: 350 GLIN
    - Charlie: 200 GLIN
    - Eve: 150 GLIN

  Votes for defendant: 300 GLIN
    - Dave: 300 GLIN

  Current leader: Claimant (Alice)

⏰ Waiting for voting period to end...
(In production, wait 7 days. For demo, assuming period ended)

🏁 Finalizing dispute...
✅ Dispute resolved: In favor of claimant (Alice)
   Result: Claimant wins with 350 GLIN vs 300 GLIN

🔍 Checking appeal status...
⚖️  Dispute can be appealed
   Either party can submit one appeal

📊 Arbitrator Statistics:
────────────────────────────────────────────────────────────
Charlie:
  Stake: 200 GLIN
  Disputes participated: 1
  Disputes resolved: 1
  Reputation: 100

Dave:
  Stake: 300 GLIN
  Disputes participated: 1
  Disputes resolved: 1
  Reputation: 100

Eve:
  Stake: 150 GLIN
  Disputes participated: 1
  Disputes resolved: 1
  Reputation: 100

────────────────────────────────────────────────────────────

📋 Summary:
• 3 arbitrators registered with total stake of 650 GLIN
• 1 dispute created and resolved
• Stake-weighted voting: 350 GLIN (claimant) vs 300 GLIN (defendant)
• Resolution: In favor of claimant

🏁 Example completed successfully!
```

## Code Walkthrough

### 1. Connect to Network

```rust
let client = OnlineClient::<PolkadotConfig>::from_url(RPC_URL).await?;
```

### 2. Initialize Contract

```rust
let contract = ArbitrationContract::new(
    client.clone(),
    ARBITRATION_ADDRESS.parse().unwrap(),
);
```

### 3. Register as Arbitrator

```rust
let result = contract
    .register_arbitrator(200_000_000_000_000_000_000, &keypair)
    .await?;
```

### 4. Create Dispute

```rust
let params = CreateDisputeParams {
    defendant: bob_address,
    description: "Service not delivered".to_string(),
    evidence_uri: "ipfs://evidence".to_string(),
};

let result = contract.create_dispute(params, &alice).await?;
```

### 5. Start Voting

```rust
contract.start_voting(dispute_id, &alice).await?;
```

### 6. Cast Vote

```rust
let vote_params = VoteParams {
    dispute_id,
    choice: VoteChoice::InFavorOfClaimant,
};

contract.vote(vote_params, &arbitrator).await?;
```

### 7. Finalize Dispute

```rust
let result = contract.finalize_dispute(dispute_id, &alice).await?;
```

## Stake-Weighted Voting

Vote power is proportional to arbitrator stake:

```
Charlie: 200 GLIN → 200 votes
Dave:    300 GLIN → 300 votes
Eve:     150 GLIN → 150 votes

Total for claimant:  200 + 150 = 350 GLIN
Total for defendant: 300 GLIN

Winner: Claimant (350 > 300)
```

## Dispute States

- **Open**: Created, voting not started
- **Voting**: Voting period active
- **Resolved**: Voting complete, decision made
- **Appealed**: Under appeal, new voting round
- **Cancelled**: Dispute cancelled

## Appeal Process

1. Dispute resolved
2. Losing party can appeal (if `can_appeal` is true)
3. One appeal allowed per dispute
4. New voting round begins
5. Final decision after appeal

## Evidence Format

Evidence should be comprehensive and organized:

```json
{
  "title": "Evidence for Dispute #0",
  "summary": "Provider failed to deliver AI training",
  "evidence": [
    {
      "type": "contract",
      "description": "Service agreement",
      "uri": "ipfs://QmABC.../contract.pdf"
    },
    {
      "type": "payment_proof",
      "description": "Payment transaction",
      "txHash": "0x123..."
    },
    {
      "type": "communication",
      "description": "Email correspondence",
      "uri": "ipfs://QmDEF.../emails.pdf"
    }
  ]
}
```

## Integration with Escrow

Use ArbitrationDAO to resolve escrow disputes:

```rust
// After escrow dispute is raised
let dispute_params = CreateDisputeParams {
    defendant: provider,
    description: format!("Escrow dispute for agreement {}", agreement_id),
    evidence_uri: evidence_url,
};

let dispute_id = arbitration.create_dispute(dispute_params, &client).await?;

// After arbitration resolves
let dispute = arbitration.get_dispute(dispute_id).await?;
match dispute.resolution {
    Some(VoteChoice::InFavorOfClaimant) => {
        escrow.resolve_dispute(agreement_id, milestone, false).await?; // Refund
    }
    Some(VoteChoice::InFavorOfDefendant) => {
        escrow.resolve_dispute(agreement_id, milestone, true).await?; // Pay
    }
    None => {}
}
```

## Arbitrator Requirements

- **Minimum stake**: 200 GLIN (configurable)
- **Active status**: Must maintain minimum stake
- **No conflicts**: Cannot be claimant or defendant in disputes they vote on
- **Timely voting**: Vote before period ends

## Best Practices

1. **Register with adequate stake**: Higher stake = more influence
2. **Vote impartially**: Base decisions on evidence
3. **Vote promptly**: Don't wait until last minute
4. **Maintain reputation**: Vote with majority to increase reputation
5. **Provide evidence**: Comprehensive evidence leads to fair resolutions

## Next Steps

- Experiment with different vote distributions
- Implement appeal workflow
- Build arbitrator dashboard
- Integrate with escrow contracts

## Learn More

- [Arbitration Contract Guide](../../docs/contracts/arbitration.md)
- [GLIN SDK Rust Documentation](../../packages/rust/)
- [Contract Source Code](https://github.com/glin-ai/glin-contracts)
