# Escrow Contract Interaction Example

This example demonstrates a complete escrow workflow using the GLIN SDK and GenericEscrow smart contract.

## What This Example Shows

- ✅ Connecting to GLIN network
- ✅ Creating escrow agreement with multiple milestones
- ✅ Provider completing milestones
- ✅ Client approving and releasing funds
- ✅ Raising and resolving disputes
- ✅ Querying contract state

## Prerequisites

1. **GLIN Node Running**
   ```bash
   # Start local development node
   ./target/release/glin-node --dev
   ```

2. **GenericEscrow Contract Deployed**
   - Deploy the contract using [Deployment Guide](../../docs/contracts/deployment.md)
   - Note the contract address

3. **Node.js** installed (v18 or higher)

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure**
   - Edit `index.ts` and update:
     ```typescript
     const RPC_URL = 'ws://localhost:9944'; // Your node URL
     const ESCROW_ADDRESS = '5Escrow...';   // Your contract address
     ```

## Run

```bash
npm start
```

## Expected Output

```
🚀 GLIN Escrow Contract Example

📡 Connecting to GLIN network...
✅ Connected to GLIN network

👤 Creating test accounts...
Client (Alice): 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
Provider (Bob): 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty

📝 Initializing contracts...
✅ Contracts initialized

📋 Creating escrow agreement...
Project: Web Development with 3 milestones
Total: 3000 GLIN (500 + 1500 + 1000)
✅ Agreement created! ID: 0

🔍 Querying agreement details...
Client: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
Provider: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
Total Amount: 3000 GLIN
Active: true

🔨 Provider completing milestone 0...
✅ Milestone 0 marked as completed

🔍 Checking milestone status...
Description: Design mockups and wireframes
Amount: 500 GLIN
Status: Completed
Deadline: Wed Jan 10 2024 12:00:00 GMT+0000

✅ Client approving milestone 0...
✅ Milestone 0 approved! Funds released to provider
   Provider receives: 490 GLIN (after 2% platform fee)
   Platform receives: 10 GLIN

⚠️  Demonstrating dispute workflow...
Provider completed milestone 1
⚠️  Client raised dispute on milestone 1
Milestone 1 status: Disputed
✅ Dispute resolved: Funds refunded to client

📊 Workflow Summary:
──────────────────────────────────────────────────
Total milestones: 3

Milestone 0: Design mockups and wireframes
  Amount: 500 GLIN
  Status: Resolved

Milestone 1: Frontend implementation
  Amount: 1500 GLIN
  Status: Resolved

Milestone 2: Backend API development
  Amount: 1000 GLIN
  Status: Pending
──────────────────────────────────────────────────

🏁 Example completed successfully!
```

## Code Walkthrough

### 1. Connect to Network

```typescript
const provider = new WsProvider(RPC_URL);
const api = await ApiPromise.create({ provider });
```

### 2. Initialize Contracts

```typescript
const contracts = new GlinContracts({
  api,
  signer: alice,
  escrowAddress: ESCROW_ADDRESS
});
```

### 3. Create Agreement

```typescript
const result = await contracts.escrow.createAgreement({
  provider: bob.address,
  milestoneDescriptions: ['Design', 'Frontend', 'Backend'],
  milestoneAmounts: [500n * 10n**18n, 1500n * 10n**18n, 1000n * 10n**18n],
  milestoneDeadlines: [deadline1, deadline2, deadline3],
  disputeTimeout: finalDeadline,
  value: 3000n * 10n**18n
});
```

### 4. Complete Milestone (Provider)

```typescript
contracts.setSigner(bob); // Switch to provider
await contracts.escrow.completeMilestone(agreementId, 0);
```

### 5. Approve and Release (Client)

```typescript
contracts.setSigner(alice); // Switch to client
await contracts.escrow.approveAndRelease(agreementId, 0);
```

### 6. Raise Dispute

```typescript
await contracts.escrow.raiseDispute(agreementId, 1);
```

### 7. Resolve Dispute

```typescript
await contracts.escrow.resolveDispute(
  agreementId,
  1,
  false // false = refund client, true = pay provider
);
```

## Milestone States

- **Pending**: Initial state, work not started/completed
- **Completed**: Provider marked as done, awaiting client approval
- **Disputed**: Client raised dispute, needs resolution
- **Resolved**: Dispute resolved or milestone approved
- **Cancelled**: Milestone cancelled

## Platform Fees

The contract charges a 2% platform fee on milestone payments:

```
Provider receives: milestone_amount × 98%
Platform receives: milestone_amount × 2%
```

## Next Steps

- Try modifying milestone amounts and deadlines
- Add an oracle to the agreement
- Experiment with different dispute scenarios
- Integrate into your own application

## Learn More

- [Escrow Contract Guide](../../docs/contracts/escrow.md)
- [GLIN SDK Documentation](../../README.md)
- [Contract Source Code](https://github.com/glin-ai/glin-contracts)
