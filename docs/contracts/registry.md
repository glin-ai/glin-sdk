# ProfessionalRegistry Contract Guide

The ProfessionalRegistry contract provides a decentralized professional registration and reputation management system. Professionals can register with a stake, receive reviews, and build on-chain reputation.

## Features

- **Role-based registration**: Support for Lawyers, Doctors, Arbitrators, Notaries, Auditors, and more
- **Stake requirements**: Minimum stake per role to ensure quality
- **Reputation scoring**: Automated reputation calculation based on reviews
- **Review system**: Clients can rate and review professionals
- **Slashing mechanism**: Penalize bad behavior
- **Metadata**: IPFS/HTTP links to detailed professional profiles

## Use Cases

- **Legal marketplace**: Verify lawyer credentials and reputation
- **Healthcare platform**: Find trusted doctors with proven track records
- **Arbitration selection**: Choose arbitrators based on dispute history
- **Professional services**: Any service requiring verified credentials
- **AI training**: Select trusted AI training providers

## Professional Roles

| Role | Default Min Stake | Description |
|------|------------------|-------------|
| `Lawyer` | 100 GLIN | Legal professionals |
| `Doctor` | 100 GLIN | Medical professionals |
| `Arbitrator` | 200 GLIN | Dispute resolution specialists |
| `Notary` | 50 GLIN | Document verification |
| `Auditor` | 150 GLIN | Financial/technical auditors |
| `ConsultantOther` | 50 GLIN | Other professional services |

## Contract Methods

### Register as Professional

Register with a role and stake.

**TypeScript:**
```typescript
import { ProfessionalRole } from '@glin-ai/sdk';

await contracts.registry.register({
  role: ProfessionalRole.Lawyer,
  metadataUri: 'ipfs://QmXYZ.../profile.json',
  stakeAmount: 100n * 10n**18n // 100 GLIN
});
```

**Python:**
```python
from glin_sdk.contracts import RegisterProfessionalParams, ProfessionalRole

params = RegisterProfessionalParams(
    role=ProfessionalRole.LAWYER,
    metadata_uri="ipfs://QmXYZ.../profile.json",
    stake_amount="100000000000000000000"  # 100 GLIN
)

await contracts.registry.register(params)
```

**Rust:**
```rust
use glin_sdk::contracts::{RegisterProfessionalParams, ProfessionalRole};

let params = RegisterProfessionalParams {
    role: ProfessionalRole::Lawyer,
    metadata_uri: "ipfs://QmXYZ.../profile.json".to_string(),
    stake_amount: 100_000_000_000_000_000_000, // 100 GLIN
};

contracts.registry.register(params, &keypair).await?;
```

### Increase Stake

Add more stake to your profile.

**TypeScript:**
```typescript
await contracts.registry.increaseStake(50n * 10n**18n); // Add 50 GLIN
```

**Python:**
```python
await contracts.registry.increase_stake("50000000000000000000")
```

**Rust:**
```rust
contracts.registry.increase_stake(50_000_000_000_000_000_000, &keypair).await?;
```

### Submit Review

Rate and review a professional.

**TypeScript:**
```typescript
await contracts.registry.submitReview({
  professional: '5Professional...',
  rating: 5, // 1-5 stars
  comment: 'Excellent legal services, very professional and responsive!'
});
```

**Python:**
```python
from glin_sdk.contracts import SubmitReviewParams

params = SubmitReviewParams(
    professional="5Professional...",
    rating=5,
    comment="Excellent legal services, very professional and responsive!"
)

await contracts.registry.submit_review(params)
```

**Rust:**
```rust
let params = SubmitReviewParams {
    professional: "5Professional...".parse()?,
    rating: 5,
    comment: "Excellent legal services!".to_string(),
};

contracts.registry.submit_review(params, &keypair).await?;
```

### Withdraw Stake

Deactivate profile and withdraw stake.

**TypeScript:**
```typescript
await contracts.registry.withdrawStake();
```

**Python:**
```python
await contracts.registry.withdraw_stake()
```

**Rust:**
```rust
contracts.registry.withdraw_stake(&keypair).await?;
```

## Query Methods

### Get Profile

**TypeScript:**
```typescript
const profile = await contracts.registry.getProfile(accountId);

console.log('Role:', profile.role);
console.log('Stake:', profile.stakeAmount);
console.log('Reputation:', profile.reputationScore);
console.log('Total Jobs:', profile.totalJobs);
console.log('Success Rate:', (profile.successfulJobs / profile.totalJobs) * 100 + '%');
console.log('Active:', profile.isActive);
console.log('Metadata:', profile.metadataUri);
```

### Get Reviews

**TypeScript:**
```typescript
const reviewCount = await contracts.registry.getReviewCount(professionalId);

for (let i = 0; i < reviewCount; i++) {
  const review = await contracts.registry.getReview(professionalId, i);
  console.log(`Review ${i + 1}:`, review.rating, 'stars -', review.comment);
}

// Or get all at once (convenience method)
const allReviews = await contracts.registry.getAllReviews(professionalId);
```

**Python:**
```python
# Get all reviews
reviews = await contracts.registry.get_all_reviews(professional_id)

for review in reviews:
    print(f"{review.rating} stars: {review.comment}")
```

### Check Active Status

**TypeScript:**
```typescript
const isActive = await contracts.registry.isActiveProfessional(accountId);
```

### Get Minimum Stake

**TypeScript:**
```typescript
import { ProfessionalRole } from '@glin-ai/sdk';

const minStake = await contracts.registry.getMinStake(ProfessionalRole.Lawyer);
console.log('Minimum stake for lawyers:', minStake);
```

## Metadata Format

The `metadataUri` should point to a JSON file with the following structure:

```json
{
  "name": "Alice Smith",
  "title": "Senior Corporate Lawyer",
  "bio": "15 years of experience in corporate law...",
  "credentials": [
    {
      "type": "degree",
      "institution": "Harvard Law School",
      "year": 2008
    },
    {
      "type": "license",
      "number": "BAR123456",
      "jurisdiction": "California",
      "year": 2009
    }
  ],
  "specializations": ["Corporate Law", "M&A", "Securities"],
  "contact": {
    "email": "alice@lawfirm.com",
    "website": "https://lawfirm.com/alice"
  },
  "portfolio": [
    {
      "title": "Acme Corp Acquisition",
      "description": "Led legal team for $100M acquisition",
      "year": 2022
    }
  ],
  "verification": {
    "method": "signed",
    "signature": "0x...",
    "timestamp": 1234567890
  }
}
```

## Reputation System

The reputation score is calculated using a weighted average:

```
new_reputation = (current_reputation * total_jobs + new_rating * 20) / (total_jobs + 1)
```

**Initial reputation**: 100

**Rating to reputation**:
- 5 stars = 100 reputation
- 4 stars = 80 reputation
- 3 stars = 60 reputation
- 2 stars = 40 reputation
- 1 star = 20 reputation

**Example:**
```
Current: 100 reputation, 0 jobs
After 5-star review: (100*0 + 5*20) / 1 = 100 reputation
After 4-star review: (100*1 + 4*20) / 2 = 90 reputation
After 5-star review: (90*2 + 5*20) / 3 = 93.3 reputation
```

## Successful Jobs

A job is marked as "successful" if the rating is 4 or 5 stars:

```typescript
const profile = await contracts.registry.getProfile(professionalId);
const successRate = (profile.successfulJobs / profile.totalJobs) * 100;
console.log(`Success rate: ${successRate.toFixed(1)}%`);
```

## Slashing

Contract owner can slash professionals for misbehavior:

**Slash amount**: `stake * slash_percentage / 10000` (default 10% = 1000 bps)

**Effects:**
- Reduces stake by slash percentage
- Lowers reputation score by 20 points
- If stake falls below minimum, profile is deactivated
- Slashed funds go to treasury

**Example:**
```
Stake: 100 GLIN
Slash: 10% = 10 GLIN
New stake: 90 GLIN
Reputation: reduced by 20
```

## Complete Workflow Example

```typescript
import { GlinContracts, ProfessionalRole } from '@glin-ai/sdk';

async function professionalWorkflow() {
  // 1. Register as a lawyer
  await contracts.registry.register({
    role: ProfessionalRole.Lawyer,
    metadataUri: 'ipfs://QmXYZ.../alice-profile.json',
    stakeAmount: 100n * 10n**18n
  });

  // 2. Check registration
  const profile = await contracts.registry.getProfile(myAddress);
  console.log('Registered as:', profile.role);
  console.log('Initial reputation:', profile.reputationScore);

  // 3. Complete some jobs (off-chain)

  // 4. Client submits review
  await contracts.registry.submitReview({
    professional: myAddress,
    rating: 5,
    comment: 'Great work on the contract review!'
  });

  // 5. Check updated profile
  const updated = await contracts.registry.getProfile(myAddress);
  console.log('Total jobs:', updated.totalJobs);
  console.log('New reputation:', updated.reputationScore);

  // 6. View all reviews
  const reviews = await contracts.registry.getAllReviews(myAddress);
  reviews.forEach((r, i) => {
    console.log(`Review ${i + 1}: ${r.rating} stars - ${r.comment}`);
  });

  // 7. Increase stake for better visibility
  await contracts.registry.increaseStake(50n * 10n**18n);

  // 8. Later, when retiring, withdraw stake
  // await contracts.registry.withdrawStake();
}
```

## Best Practices

1. **Complete Metadata**: Provide comprehensive professional information
2. **Verify Credentials**: Include verifiable credential information
3. **Maintain Stake**: Keep stake above minimum to stay active
4. **Build Reputation**: Consistently deliver quality work
5. **IPFS Storage**: Use IPFS for decentralized metadata storage
6. **Regular Updates**: Keep metadata current with new credentials

## Gas Costs

Approximate gas costs for operations:

| Operation | Estimated Gas |
|-----------|--------------|
| Register | 50,000,000,000 |
| Increase Stake | 30,000,000,000 |
| Submit Review | 50,000,000,000 |
| Withdraw Stake | 40,000,000,000 |

## Events

The contract emits the following events:

- `ProfessionalRegistered`: When a new professional registers
- `StakeIncreased`: When stake is increased
- `ProfessionalSlashed`: When a professional is slashed
- `ReviewSubmitted`: When a review is submitted
- `ProfessionalDeactivated`: When profile is deactivated

## Integration with Escrow

Use the registry to select qualified providers:

```typescript
// Find active lawyers with good reputation
async function findQualifiedLawyer(minReputation: number) {
  // Off-chain: Query all professionals via indexer
  // Filter by role, reputation, and active status

  const profile = await contracts.registry.getProfile(lawyerId);

  if (profile.isActive &&
      profile.role === ProfessionalRole.Lawyer &&
      profile.reputationScore >= minReputation) {
    // Create escrow with this professional
    await contracts.escrow.createAgreement({
      provider: lawyerId,
      // ... milestone details
    });
  }
}
```

## Related Contracts

- [GenericEscrow](./escrow.md) - For milestone-based payments
- [ArbitrationDAO](./arbitration.md) - For selecting arbitrators

## Resources

- [Contract Source Code](https://github.com/glin-ai/glin-contracts/tree/main/registry)
- [Getting Started Guide](./getting-started.md)
- [API Reference](https://docs.glin.ai/contracts/registry)
