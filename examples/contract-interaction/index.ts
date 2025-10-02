/**
 * GLIN Smart Contracts - Escrow Example
 *
 * This example demonstrates a complete escrow workflow:
 * 1. Connect to GLIN network
 * 2. Create escrow agreement with milestones
 * 3. Provider completes milestones
 * 4. Client approves and releases funds
 * 5. Handle disputes
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { GlinContracts, MilestoneStatus } from '@glin-ai/sdk';

// Configuration
const RPC_URL = 'ws://localhost:9944'; // Change to your node
const ESCROW_ADDRESS = '5Escrow...'; // Replace with deployed contract address

async function main() {
  console.log('🚀 GLIN Escrow Contract Example\n');

  // Step 1: Connect to GLIN network
  console.log('📡 Connecting to GLIN network...');
  const provider = new WsProvider(RPC_URL);
  const api = await ApiPromise.create({ provider });
  console.log('✅ Connected to GLIN network\n');

  // Step 2: Create accounts (Alice = Client, Bob = Provider)
  console.log('👤 Creating test accounts...');
  const keyring = new Keyring({ type: 'sr25519' });
  const alice = keyring.addFromUri('//Alice'); // Client
  const bob = keyring.addFromUri('//Bob');     // Provider
  console.log('Client (Alice):', alice.address);
  console.log('Provider (Bob):', bob.address);
  console.log('');

  // Step 3: Initialize contracts
  console.log('📝 Initializing contracts...');
  const contracts = new GlinContracts({
    api,
    signer: alice,
    escrowAddress: ESCROW_ADDRESS
  });
  console.log('✅ Contracts initialized\n');

  // Step 4: Create escrow agreement
  console.log('📋 Creating escrow agreement...');
  console.log('Project: Web Development with 3 milestones');
  console.log('Total: 3000 GLIN (500 + 1500 + 1000)');

  const now = Date.now();
  const result = await contracts.escrow.createAgreement({
    provider: bob.address,
    milestoneDescriptions: [
      'Design mockups and wireframes',
      'Frontend implementation',
      'Backend API development'
    ],
    milestoneAmounts: [
      500n * 10n**18n,   // 500 GLIN
      1500n * 10n**18n,  // 1500 GLIN
      1000n * 10n**18n   // 1000 GLIN
    ],
    milestoneDeadlines: [
      now + 7 * 24 * 60 * 60 * 1000,   // 7 days
      now + 14 * 24 * 60 * 60 * 1000,  // 14 days
      now + 21 * 24 * 60 * 60 * 1000   // 21 days
    ],
    disputeTimeout: now + 30 * 24 * 60 * 60 * 1000, // 30 days
    value: 3000n * 10n**18n // Total deposit
  });

  if (!result.success) {
    console.error('❌ Failed to create agreement:', result.error);
    process.exit(1);
  }

  const agreementId = result.data || 0n;
  console.log('✅ Agreement created! ID:', agreementId.toString());
  console.log('');

  // Step 5: Query agreement details
  console.log('🔍 Querying agreement details...');
  const agreement = await contracts.escrow.getAgreement(agreementId);
  if (agreement) {
    console.log('Client:', agreement.client);
    console.log('Provider:', agreement.provider);
    console.log('Total Amount:', (BigInt(agreement.totalAmount) / 10n**18n).toString(), 'GLIN');
    console.log('Active:', agreement.isActive);
  }
  console.log('');

  // Step 6: Provider completes first milestone
  console.log('🔨 Provider completing milestone 0...');
  contracts.setSigner(bob); // Switch to provider account

  const completeResult = await contracts.escrow.completeMilestone(agreementId, 0);
  if (completeResult.success) {
    console.log('✅ Milestone 0 marked as completed');
  } else {
    console.error('❌ Failed to complete milestone:', completeResult.error);
  }
  console.log('');

  // Step 7: Check milestone status
  console.log('🔍 Checking milestone status...');
  const milestone = await contracts.escrow.getMilestone(agreementId, 0);
  if (milestone) {
    console.log('Description:', milestone.description);
    console.log('Amount:', (BigInt(milestone.amount) / 10n**18n).toString(), 'GLIN');
    console.log('Status:', milestone.status);
    console.log('Deadline:', new Date(milestone.deadline));
  }
  console.log('');

  // Step 8: Client approves and releases funds
  console.log('✅ Client approving milestone 0...');
  contracts.setSigner(alice); // Switch back to client

  const approveResult = await contracts.escrow.approveAndRelease(agreementId, 0);
  if (approveResult.success) {
    console.log('✅ Milestone 0 approved! Funds released to provider');
    console.log('   Provider receives: 490 GLIN (after 2% platform fee)');
    console.log('   Platform receives: 10 GLIN');
  } else {
    console.error('❌ Failed to approve milestone:', approveResult.error);
  }
  console.log('');

  // Step 9: Demonstrate dispute workflow
  console.log('⚠️  Demonstrating dispute workflow...');

  // Provider completes milestone 1
  contracts.setSigner(bob);
  await contracts.escrow.completeMilestone(agreementId, 1);
  console.log('Provider completed milestone 1');

  // Client raises dispute
  contracts.setSigner(alice);
  const disputeResult = await contracts.escrow.raiseDispute(agreementId, 1);
  if (disputeResult.success) {
    console.log('⚠️  Client raised dispute on milestone 1');
  }

  // Check disputed milestone
  const disputedMilestone = await contracts.escrow.getMilestone(agreementId, 1);
  if (disputedMilestone) {
    console.log('Milestone 1 status:', disputedMilestone.status);
  }

  // Resolve dispute (in favor of client - refund)
  const resolveResult = await contracts.escrow.resolveDispute(
    agreementId,
    1,
    false // false = refund to client, true = pay provider
  );
  if (resolveResult.success) {
    console.log('✅ Dispute resolved: Funds refunded to client');
  }
  console.log('');

  // Step 10: Complete workflow summary
  console.log('📊 Workflow Summary:');
  console.log('─'.repeat(50));
  const milestoneCount = await contracts.escrow.getMilestoneCount(agreementId);
  console.log(`Total milestones: ${milestoneCount}`);

  for (let i = 0; i < milestoneCount; i++) {
    const m = await contracts.escrow.getMilestone(agreementId, i);
    if (m) {
      const amount = (BigInt(m.amount) / 10n**18n).toString();
      console.log(`\nMilestone ${i}: ${m.description}`);
      console.log(`  Amount: ${amount} GLIN`);
      console.log(`  Status: ${m.status}`);
    }
  }
  console.log('─'.repeat(50));
  console.log('');

  // Cleanup
  console.log('🏁 Example completed successfully!');
  await api.disconnect();
}

// Run example
main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
