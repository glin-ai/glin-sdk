# Professional Registry Contract Example (Python)

This example demonstrates professional registration and reputation management using the GLIN SDK and ProfessionalRegistry smart contract.

## What This Example Shows

- ✅ Connecting to GLIN network with Python
- ✅ Registering as a professional (Lawyer)
- ✅ Submitting reviews from clients
- ✅ Querying professional profiles and reputation
- ✅ Increasing stake amount
- ✅ Calculating success rates and average ratings

## Prerequisites

1. **GLIN Node Running**
   ```bash
   # Start local development node
   ./target/release/glin-node --dev
   ```

2. **ProfessionalRegistry Contract Deployed**
   - Deploy the contract using [Deployment Guide](../../docs/contracts/deployment.md)
   - Note the contract address

3. **Python** installed (3.8 or higher)

## Setup

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure**
   - Edit `main.py` and update:
     ```python
     RPC_URL = "ws://localhost:9944"  # Your node URL
     REGISTRY_ADDRESS = "5Registry..."  # Your contract address
     ```

## Run

```bash
python main.py
```

## Expected Output

```
🚀 GLIN Professional Registry Example

📡 Connecting to GLIN network...
✅ Connected to GLIN network

👤 Creating test accounts...
Professional (Alice): 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
Client (Bob): 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
Client (Charlie): 5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y

📝 Initializing contracts...
✅ Contracts initialized

📋 Registering as professional lawyer...
Role: Lawyer
Stake: 100 GLIN
Metadata: ipfs://QmXYZ.../alice-profile.json
✅ Successfully registered as lawyer!

🔍 Querying professional profile...
Account: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
Role: Lawyer
Stake: 100 GLIN
Reputation: 100
Total Jobs: 0
Successful Jobs: 0
Active: True
Metadata: ipfs://QmXYZ.../alice-profile.json

💰 Checking minimum stake requirements...
Minimum stake for Lawyer: 100 GLIN

⭐ Client (Bob) submitting 5-star review...
✅ Review submitted successfully!

⭐ Client (Charlie) submitting 4-star review...
✅ Review submitted successfully!

🔍 Querying all reviews...
Total reviews: 2

Review 1:
  Rating: ⭐⭐⭐⭐⭐ (5/5)
  Reviewer: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
  Comment: Excellent legal services! Very professional and knowledgeable.
  Date: 1234567890

Review 2:
  Rating: ⭐⭐⭐⭐ (4/5)
  Reviewer: 5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y
  Comment: Good work, delivered on time. Minor communication issues.
  Date: 1234567891

📊 Checking updated reputation...
Reputation Score: 90
Total Jobs: 2
Successful Jobs: 2
Success Rate: 100.0%

💎 Professional increasing stake...
✅ Stake increased by 50 GLIN!
New stake: 150 GLIN

✓ Checking professional status...
Is active professional: True

📊 Professional Profile Summary:
────────────────────────────────────────────────────────────
Name: Alice (Lawyer)
Stake: 150 GLIN
Reputation: 90/100
Total Jobs: 2
Successful Jobs: 2
Success Rate: 100.0%
Total Reviews: 2
Average Rating: 4.5/5.0
────────────────────────────────────────────────────────────

🏁 Example completed successfully!
```

## Code Walkthrough

### 1. Connect to Network

```python
substrate = SubstrateInterface(url=RPC_URL)
```

### 2. Initialize Contracts

```python
contracts = GlinContracts(
    substrate=substrate,
    keypair=alice,
    registry_address=REGISTRY_ADDRESS
)
```

### 3. Register as Professional

```python
params = RegisterProfessionalParams(
    role=ProfessionalRole.LAWYER,
    metadata_uri="ipfs://QmXYZ.../profile.json",
    stake_amount="100000000000000000000"  # 100 GLIN
)

result = await contracts.registry.register(params)
```

### 4. Submit Review

```python
params = SubmitReviewParams(
    professional=alice.ss58_address,
    rating=5,
    comment="Excellent legal services!"
)

result = await contracts.registry.submit_review(params)
```

### 5. Query Profile

```python
profile = await contracts.registry.get_profile(alice.ss58_address)
print(f"Reputation: {profile.reputation_score}")
print(f"Total Jobs: {profile.total_jobs}")
```

### 6. Get All Reviews

```python
review_count = await contracts.registry.get_review_count(professional_id)

for i in range(review_count):
    review = await contracts.registry.get_review(professional_id, i)
    print(f"Rating: {review.rating}/5")
    print(f"Comment: {review.comment}")
```

## Professional Roles

The registry supports multiple professional roles:

- `LAWYER`: Legal professionals (min 100 GLIN)
- `DOCTOR`: Medical professionals (min 100 GLIN)
- `ARBITRATOR`: Dispute resolvers (min 200 GLIN)
- `NOTARY`: Document verification (min 50 GLIN)
- `AUDITOR`: Financial/technical auditors (min 150 GLIN)
- `CONSULTANT_OTHER`: Other services (min 50 GLIN)

## Reputation System

Reputation is calculated using a weighted average:

```
new_reputation = (current_reputation * total_jobs + new_rating * 20) / (total_jobs + 1)
```

**Rating to Reputation:**
- 5 stars = 100 reputation
- 4 stars = 80 reputation
- 3 stars = 60 reputation
- 2 stars = 40 reputation
- 1 star = 20 reputation

**Successful Jobs:**
Jobs with 4 or 5 stars count as successful.

## Metadata Format

The `metadata_uri` should point to a JSON file:

```json
{
  "name": "Alice Smith",
  "title": "Senior Corporate Lawyer",
  "bio": "15 years of experience...",
  "credentials": [...],
  "specializations": ["Corporate Law", "M&A"],
  "contact": {
    "email": "alice@lawfirm.com",
    "website": "https://lawfirm.com/alice"
  }
}
```

## Next Steps

- Try different professional roles
- Experiment with various rating combinations
- Build a reputation dashboard
- Integrate into your professional services platform

## Learn More

- [Registry Contract Guide](../../docs/contracts/registry.md)
- [GLIN SDK Python Documentation](../../packages/python/)
- [Contract Source Code](https://github.com/glin-ai/glin-contracts)
