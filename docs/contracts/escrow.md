# GenericEscrow Contract Guide

The GenericEscrow contract provides milestone-based payment escrow with built-in dispute resolution. It allows clients to create agreements with service providers where payment is released incrementally as milestones are completed.

## Features

- **Milestone-based payments**: Break large projects into smaller, verifiable milestones
- **Dispute resolution**: Built-in dispute mechanism with optional oracle support
- **Platform fees**: Configurable platform fee (default 2%)
- **Oracle integration**: Optional third-party verification for milestones
- **Refund protection**: Funds returned to client if milestones aren't completed

## Use Cases

- **Freelance work**: Pay developers, designers, writers in milestones
- **Legal services**: Pay lawyers based on case progress
- **Construction**: Pay contractors as project phases complete
- **Consulting**: Pay consultants for deliverables
- **AI training jobs**: Pay providers for model training milestones

## Contract Methods

### Create Agreement

Create a new escrow agreement with milestones.

**TypeScript:**
```typescript
const result = await contracts.escrow.createAgreement({
  provider: '5Provider...',
  milestoneDescriptions: ['Design mockups', 'Frontend implementation', 'Backend API'],
  milestoneAmounts: [500n * 10n**18n, 1000n * 10n**18n, 1500n * 10n**18n],
  milestoneDeadlines: [
    Date.now() + 7 * 24 * 60 * 60 * 1000,  // 7 days
    Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days
    Date.now() + 21 * 24 * 60 * 60 * 1000  // 21 days
  ],
  disputeTimeout: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  oracle: undefined, // Optional oracle address
  value: 3000n * 10n**18n // Total deposit (3000 GLIN)
});

console.log('Agreement ID:', result.data);
```

**Python:**
```python
from glin_sdk.contracts import CreateAgreementParams

params = CreateAgreementParams(
    provider="5Provider...",
    milestone_descriptions=["Design mockups", "Frontend implementation", "Backend API"],
    milestone_amounts=[
        "500000000000000000000",   # 500 GLIN
        "1000000000000000000000",  # 1000 GLIN
        "1500000000000000000000"   # 1500 GLIN
    ],
    milestone_deadlines=[
        1234567890,  # 7 days from now
        1234567890,  # 14 days from now
        1234567890   # 21 days from now
    ],
    dispute_timeout=1234567890,  # 30 days from now
    oracle=None,  # Optional
    value="3000000000000000000000"  # 3000 GLIN
)

result = await contracts.escrow.create_agreement(params)
print(f"Agreement ID: {result.data}")
```

**Rust:**
```rust
let params = CreateAgreementParams {
    provider: "5Provider...".parse()?,
    milestone_descriptions: vec![
        "Design mockups".into(),
        "Frontend implementation".into(),
        "Backend API".into()
    ],
    milestone_amounts: vec![
        500_000_000_000_000_000_000,   // 500 GLIN
        1_000_000_000_000_000_000_000, // 1000 GLIN
        1_500_000_000_000_000_000_000  // 1500 GLIN
    ],
    milestone_deadlines: vec![1234567890, 1234567890, 1234567890],
    dispute_timeout: 1234567890,
    oracle: None,
    value: 3_000_000_000_000_000_000_000, // 3000 GLIN
};

let result = contracts.escrow.create_agreement(params, &keypair).await?;
```

### Complete Milestone

Provider marks a milestone as completed.

**TypeScript:**
```typescript
await contracts.escrow.completeMilestone(agreementId, milestoneIndex);
```

**Python:**
```python
await contracts.escrow.complete_milestone(agreement_id, milestone_index)
```

**Rust:**
```rust
contracts.escrow.complete_milestone(agreement_id, milestone_index, &keypair).await?;
```

### Approve and Release Funds

Client approves milestone completion and releases payment.

**TypeScript:**
```typescript
await contracts.escrow.approveAndRelease(agreementId, milestoneIndex);
```

**Python:**
```python
await contracts.escrow.approve_and_release(agreement_id, milestone_index)
```

**Rust:**
```rust
contracts.escrow.approve_and_release(agreement_id, milestone_index, &keypair).await?;
```

### Raise Dispute

Either party can raise a dispute on a milestone.

**TypeScript:**
```typescript
await contracts.escrow.raiseDispute(agreementId, milestoneIndex);
```

**Python:**
```python
await contracts.escrow.raise_dispute(agreement_id, milestone_index)
```

**Rust:**
```rust
contracts.escrow.raise_dispute(agreement_id, milestone_index, &keypair).await?;
```

### Resolve Dispute

Oracle or client (after timeout) resolves the dispute.

**TypeScript:**
```typescript
await contracts.escrow.resolveDispute(
  agreementId,
  milestoneIndex,
  releaseToProvider // true = pay provider, false = refund client
);
```

**Python:**
```python
await contracts.escrow.resolve_dispute(agreement_id, milestone_index, release_to_provider)
```

**Rust:**
```rust
contracts.escrow.resolve_dispute(
    agreement_id,
    milestone_index,
    release_to_provider,
    &keypair
).await?;
```

## Query Methods

### Get Agreement

**TypeScript:**
```typescript
const agreement = await contracts.escrow.getAgreement(agreementId);
console.log('Client:', agreement.client);
console.log('Provider:', agreement.provider);
console.log('Total Amount:', agreement.totalAmount);
console.log('Is Active:', agreement.isActive);
```

### Get Milestone

**TypeScript:**
```typescript
const milestone = await contracts.escrow.getMilestone(agreementId, milestoneIndex);
console.log('Description:', milestone.description);
console.log('Amount:', milestone.amount);
console.log('Status:', milestone.status); // Pending, Completed, Disputed, Resolved, Cancelled
console.log('Deadline:', new Date(milestone.deadline));
```

### Get Milestone Count

**TypeScript:**
```typescript
const count = await contracts.escrow.getMilestoneCount(agreementId);
console.log('Total milestones:', count);
```

## Workflow Example

### Complete Agreement Workflow

```typescript
import { GlinContracts, MilestoneStatus } from '@glin-ai/sdk';

async function completeWorkflow() {
  // 1. Client creates agreement
  const agreementId = await contracts.escrow.createAgreement({
    provider: providerAddress,
    milestoneDescriptions: ['Design', 'Development', 'Testing'],
    milestoneAmounts: [1000n, 2000n, 1000n],
    milestoneDeadlines: [deadline1, deadline2, deadline3],
    disputeTimeout: finalDeadline,
    value: 4000n
  });

  // 2. Provider completes first milestone
  await contracts.escrow.completeMilestone(agreementId, 0);

  // 3. Client reviews and approves
  const milestone = await contracts.escrow.getMilestone(agreementId, 0);
  if (milestone.status === MilestoneStatus.Completed) {
    await contracts.escrow.approveAndRelease(agreementId, 0);
  }

  // 4. If there's an issue, client raises dispute
  await contracts.escrow.raiseDispute(agreementId, 0);

  // 5. Oracle or client (after timeout) resolves
  await contracts.escrow.resolveDispute(agreementId, 0, false); // Refund to client

  // 6. Check final status
  const agreement = await contracts.escrow.getAgreement(agreementId);
  console.log('Agreement active:', agreement.isActive);
}
```

## Milestone States

| State | Description |
|-------|-------------|
| `Pending` | Milestone created, work not yet completed |
| `Completed` | Provider marked as complete, awaiting approval |
| `Disputed` | Dispute raised, awaiting resolution |
| `Resolved` | Dispute resolved, funds distributed |
| `Cancelled` | Milestone cancelled |

## Platform Fees

The contract charges a platform fee on each milestone payment (default 2%):

```
Provider receives: milestone_amount * 98%
Platform receives: milestone_amount * 2%
```

**Example:**
- Milestone amount: 1000 GLIN
- Provider gets: 980 GLIN
- Platform gets: 20 GLIN

## Oracle Integration

Optionally specify an oracle address for milestone verification:

```typescript
const result = await contracts.escrow.createAgreement({
  // ... other params
  oracle: '5Oracle...',
  value: totalAmount
});
```

The oracle can:
- Approve milestone completions
- Resolve disputes at any time (no timeout required)

## Best Practices

1. **Clear Milestones**: Define milestones with specific, verifiable deliverables
2. **Reasonable Deadlines**: Set realistic deadlines with buffer time
3. **Communication**: Agree on milestone criteria before starting
4. **Oracle Usage**: Use oracles for objective verification (e.g., code review, legal review)
5. **Dispute Resolution**: Try to resolve disputes off-chain before raising on-chain
6. **Gas Estimation**: Always estimate gas before submitting transactions

## Gas Costs

Approximate gas costs for operations:

| Operation | Estimated Gas |
|-----------|--------------|
| Create Agreement | 100,000,000,000 |
| Complete Milestone | 50,000,000,000 |
| Approve & Release | 50,000,000,000 |
| Raise Dispute | 50,000,000,000 |
| Resolve Dispute | 50,000,000,000 |

## Events

The contract emits the following events:

- `AgreementCreated`: When a new agreement is created
- `MilestoneCompleted`: When provider marks milestone complete
- `DisputeRaised`: When a dispute is raised
- `FundsReleased`: When funds are released to provider or refunded

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `InsufficientFunds` | Deposited amount < total milestones | Increase deposit amount |
| `NotAuthorized` | Wrong signer | Use correct client/provider/oracle account |
| `MilestoneAlreadyCompleted` | Milestone already done | Check milestone status first |
| `AgreementNotActive` | Agreement cancelled/finished | Create new agreement |

## Related Contracts

- [ArbitrationDAO](./arbitration.md) - For complex dispute resolution
- [ProfessionalRegistry](./registry.md) - For provider reputation

## Resources

- [Contract Source Code](https://github.com/glin-ai/glin-contracts/tree/main/escrow)
- [Getting Started Guide](./getting-started.md)
- [API Reference](https://docs.glin.ai/contracts/escrow)
