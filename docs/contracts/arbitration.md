# ArbitrationDAO Contract Guide

The ArbitrationDAO contract provides decentralized dispute resolution through stake-weighted voting. Arbitrators stake tokens to participate in dispute resolution and vote on outcomes.

## Features

- **Stake-weighted voting**: Vote power proportional to stake
- **Arbitrator registry**: Register and manage arbitrator profiles
- **Voting periods**: Time-bound voting for fairness
- **Appeal mechanism**: One appeal allowed per dispute
- **Reputation tracking**: Track arbitrator participation and accuracy
- **DAO governance**: Decentralized decision-making

## Use Cases

- **Escrow disputes**: Resolve payment disputes
- **Marketplace conflicts**: Handle buyer/seller disputes
- **Service disagreements**: Resolve professional service issues
- **Contract violations**: Arbitrate smart contract disputes
- **Any bilateral conflict**: General-purpose dispute resolution

## How It Works

1. **Claimant creates dispute** with evidence
2. **Claimant or defendant starts voting** period
3. **Arbitrators vote** with their stake as weight
4. **Dispute is finalized** after voting period
5. **Optional appeal** triggers new voting round

## Contract Methods

### Register as Arbitrator

Stake tokens to become an arbitrator.

**TypeScript:**
```typescript
await contracts.arbitration.registerArbitrator(200n * 10n**18n); // Stake 200 GLIN
```

**Python:**
```python
await contracts.arbitration.register_arbitrator("200000000000000000000")
```

**Rust:**
```rust
contracts.arbitration.register_arbitrator(200_000_000_000_000_000_000, &keypair).await?;
```

### Increase Arbitrator Stake

Add more stake to increase voting power.

**TypeScript:**
```typescript
await contracts.arbitration.increaseArbitratorStake(100n * 10n**18n);
```

**Python:**
```python
await contracts.arbitration.increase_arbitrator_stake("100000000000000000000")
```

**Rust:**
```rust
contracts.arbitration.increase_arbitrator_stake(100_000_000_000_000_000_000, &keypair).await?;
```

### Create Dispute

File a new dispute against a defendant.

**TypeScript:**
```typescript
import { CreateDisputeParams } from '@glin-ai/sdk';

const result = await contracts.arbitration.createDispute({
  defendant: '5Defendant...',
  description: 'Provider did not deliver agreed services despite full payment',
  evidenceUri: 'ipfs://QmXYZ.../evidence.pdf'
});

console.log('Dispute ID:', result.data);
```

**Python:**
```python
from glin_sdk.contracts import CreateDisputeParams

params = CreateDisputeParams(
    defendant="5Defendant...",
    description="Provider did not deliver agreed services",
    evidence_uri="ipfs://QmXYZ.../evidence.pdf"
)

result = await contracts.arbitration.create_dispute(params)
print(f"Dispute ID: {result.data}")
```

**Rust:**
```rust
let params = CreateDisputeParams {
    defendant: "5Defendant...".parse()?,
    description: "Provider did not deliver agreed services".to_string(),
    evidence_uri: "ipfs://QmXYZ.../evidence.pdf".to_string(),
};

let result = contracts.arbitration.create_dispute(params, &keypair).await?;
```

### Start Voting

Either party can start the voting period.

**TypeScript:**
```typescript
await contracts.arbitration.startVoting(disputeId);
```

**Python:**
```python
await contracts.arbitration.start_voting(dispute_id)
```

**Rust:**
```rust
contracts.arbitration.start_voting(dispute_id, &keypair).await?;
```

### Vote

Cast a vote on a dispute.

**TypeScript:**
```typescript
import { VoteChoice } from '@glin-ai/sdk';

await contracts.arbitration.vote({
  disputeId: '0',
  choice: VoteChoice.InFavorOfClaimant
  // or VoteChoice.InFavorOfDefendant
});
```

**Python:**
```python
from glin_sdk.contracts import VoteParams, VoteChoice

params = VoteParams(
    dispute_id="0",
    choice=VoteChoice.IN_FAVOR_OF_CLAIMANT
)

await contracts.arbitration.vote(params)
```

**Rust:**
```rust
use glin_sdk::contracts::{VoteParams, VoteChoice};

let params = VoteParams {
    dispute_id: 0,
    choice: VoteChoice::InFavorOfClaimant,
};

contracts.arbitration.vote(params, &keypair).await?;
```

### Finalize Dispute

Finalize dispute after voting period ends.

**TypeScript:**
```typescript
const result = await contracts.arbitration.finalizeDispute(disputeId);
console.log('Resolution:', result.data); // InFavorOfClaimant or InFavorOfDefendant
```

**Python:**
```python
result = await contracts.arbitration.finalize_dispute(dispute_id)
print(f"Resolution: {result.data}")
```

**Rust:**
```rust
let result = contracts.arbitration.finalize_dispute(dispute_id, &keypair).await?;
```

### Appeal Dispute

Appeal a finalized dispute (only once).

**TypeScript:**
```typescript
await contracts.arbitration.appealDispute(disputeId);
```

**Python:**
```python
await contracts.arbitration.appeal_dispute(dispute_id)
```

**Rust:**
```rust
contracts.arbitration.appeal_dispute(dispute_id, &keypair).await?;
```

## Query Methods

### Get Dispute

**TypeScript:**
```typescript
const dispute = await contracts.arbitration.getDispute(disputeId);

console.log('Claimant:', dispute.claimant);
console.log('Defendant:', dispute.defendant);
console.log('Description:', dispute.description);
console.log('Status:', dispute.status);
console.log('Votes for claimant:', dispute.votesForClaimant);
console.log('Votes for defendant:', dispute.votesForDefendant);
console.log('Resolution:', dispute.resolution);
console.log('Can appeal:', dispute.canAppeal);
```

### Get Arbitrator

**TypeScript:**
```typescript
const arbitrator = await contracts.arbitration.getArbitrator(accountId);

console.log('Stake:', arbitrator.stake);
console.log('Disputes participated:', arbitrator.disputesParticipated);
console.log('Disputes resolved:', arbitrator.disputesResolved);
console.log('Reputation:', arbitrator.reputation);
console.log('Active:', arbitrator.isActive);
```

### Get Vote

**TypeScript:**
```typescript
const vote = await contracts.arbitration.getVote(disputeId, arbitratorId);
console.log('Voted:', vote); // InFavorOfClaimant or InFavorOfDefendant
```

### Check Active Arbitrator

**TypeScript:**
```typescript
const isActive = await contracts.arbitration.isActiveArbitrator(accountId);
```

## Dispute States

| State | Description |
|-------|-------------|
| `Open` | Dispute created, voting not started |
| `Voting` | Voting period active |
| `Resolved` | Voting complete, resolution determined |
| `Appealed` | Dispute appealed, new voting round |
| `Cancelled` | Dispute cancelled |

## Voting Mechanism

**Vote Weight**: Your stake determines your vote weight

```
Total votes for claimant = Sum of all claimant voters' stakes
Total votes for defendant = Sum of all defendant voters' stakes

Winner = Side with more total stake
```

**Example:**
```
Arbitrator A (stake: 100 GLIN) votes for claimant
Arbitrator B (stake: 150 GLIN) votes for claimant
Arbitrator C (stake: 200 GLIN) votes for defendant

Votes for claimant: 100 + 150 = 250 GLIN
Votes for defendant: 200 GLIN

Result: In favor of claimant
```

## Voting Period

Default voting period: **7 days** (configurable)

- Voting starts when either party calls `startVoting()`
- Arbitrators can vote until `votingEndsAt` timestamp
- After period ends, anyone can call `finalizeDispute()`
- Early finalization not allowed (prevents manipulation)

## Appeal Process

1. Dispute is resolved
2. Losing party appeals (if `canAppeal` is true)
3. Dispute state becomes `Appealed`
4. New voting round begins
5. Previous votes are cleared
6. Final resolution after second round (no more appeals)

**Limitations:**
- Only **one appeal** allowed per dispute
- Must appeal before appeal window expires

## Evidence Format

The `evidenceUri` should point to a document/folder containing:

```json
{
  "title": "Evidence for Dispute #123",
  "summary": "Provider failed to deliver services as agreed",
  "evidence": [
    {
      "type": "contract",
      "description": "Original service agreement",
      "uri": "ipfs://QmABC.../contract.pdf",
      "timestamp": 1234567890
    },
    {
      "type": "communication",
      "description": "Email thread showing non-delivery",
      "uri": "ipfs://QmDEF.../emails.pdf",
      "timestamp": 1234567891
    },
    {
      "type": "payment_proof",
      "description": "Blockchain transaction showing payment",
      "txHash": "0x123...",
      "timestamp": 1234567892
    }
  ],
  "witnesses": [
    {
      "name": "Jane Doe",
      "statement": "ipfs://QmGHI.../witness-statement.pdf"
    }
  ]
}
```

## Complete Workflow Example

```typescript
import { GlinContracts, VoteChoice, DisputeStatus } from '@glin-ai/sdk';

async function disputeWorkflow() {
  // 1. Register as arbitrator
  await contracts.arbitration.registerArbitrator(200n * 10n**18n);

  // 2. Claimant creates dispute
  const result = await contracts.arbitration.createDispute({
    defendant: defendantAddress,
    description: 'Service not delivered',
    evidenceUri: 'ipfs://QmXYZ.../evidence.json'
  });
  const disputeId = result.data;

  // 3. Start voting (either party can call this)
  await contracts.arbitration.startVoting(disputeId);

  // 4. Arbitrators vote
  await contracts.arbitration.vote({
    disputeId,
    choice: VoteChoice.InFavorOfClaimant
  });

  // 5. Wait for voting period to end
  // ... 7 days later ...

  // 6. Finalize dispute
  const resolution = await contracts.arbitration.finalizeDispute(disputeId);
  console.log('Resolution:', resolution.data);

  // 7. If losing party disagrees, they can appeal
  const dispute = await contracts.arbitration.getDispute(disputeId);
  if (dispute.canAppeal) {
    await contracts.arbitration.appealDispute(disputeId);
    // New voting round begins
  }
}
```

## Arbitrator Reputation

Arbitrators build reputation through participation:

```typescript
const arbitrator = await contracts.arbitration.getArbitrator(accountId);

const participationRate = (arbitrator.disputesResolved / arbitrator.disputesParticipated) * 100;
console.log(`Participation rate: ${participationRate.toFixed(1)}%`);
```

**Initial reputation**: 100

Reputation can increase/decrease based on:
- Voting with majority (increases reputation)
- Voting against majority (decreases reputation)
- Not voting when active (decreases reputation)

## Integration with Escrow

Use ArbitrationDAO to resolve escrow disputes:

```typescript
// In escrow contract
await escrowContract.raiseDispute(agreementId, milestoneIndex);

// Create corresponding arbitration case
await contracts.arbitration.createDispute({
  defendant: providerAddress,
  description: `Escrow dispute for agreement ${agreementId}, milestone ${milestoneIndex}`,
  evidenceUri: 'ipfs://...'
});

// After arbitration resolves
const dispute = await contracts.arbitration.getDispute(disputeId);
if (dispute.resolution === VoteChoice.InFavorOfClaimant) {
  // Refund client in escrow
  await escrowContract.resolveDispute(agreementId, milestoneIndex, false);
} else {
  // Pay provider in escrow
  await escrowContract.resolveDispute(agreementId, milestoneIndex, true);
}
```

## Best Practices

1. **Clear Evidence**: Provide comprehensive, organized evidence
2. **Neutral Arbitrators**: Select arbitrators with no conflicts of interest
3. **Adequate Stake**: Higher stake = more influence, more risk
4. **Timely Voting**: Vote before period ends
5. **Fair Decisions**: Vote based on evidence, not bias
6. **Appeal Wisely**: Only appeal if genuinely unfair

## Gas Costs

Approximate gas costs for operations:

| Operation | Estimated Gas |
|-----------|--------------|
| Register Arbitrator | 50,000,000,000 |
| Create Dispute | 60,000,000,000 |
| Start Voting | 40,000,000,000 |
| Vote | 50,000,000,000 |
| Finalize Dispute | 50,000,000,000 |
| Appeal Dispute | 50,000,000,000 |

## Events

The contract emits the following events:

- `ArbitratorRegistered`: When new arbitrator registers
- `DisputeCreated`: When dispute is created
- `VoteCast`: When arbitrator casts vote
- `DisputeResolved`: When dispute is resolved
- `DisputeAppealed`: When dispute is appealed

## Security Considerations

- **Sybil Resistance**: Stake requirement prevents spam
- **Vote Buying**: Transparent on-chain voting deters collusion
- **Timing Attacks**: Fixed voting periods prevent manipulation
- **Appeal Limits**: One appeal prevents infinite loops

## Related Contracts

- [GenericEscrow](./escrow.md) - For payment disputes
- [ProfessionalRegistry](./registry.md) - For finding arbitrators

## Resources

- [Contract Source Code](https://github.com/glin-ai/glin-contracts/tree/main/arbitration)
- [Getting Started Guide](./getting-started.md)
- [API Reference](https://docs.glin.ai/contracts/arbitration)
