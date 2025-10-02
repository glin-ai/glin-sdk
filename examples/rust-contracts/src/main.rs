//! GLIN Smart Contracts - Arbitration DAO Example
//!
//! This example demonstrates decentralized dispute resolution:
//! 1. Connect to GLIN network
//! 2. Register as arbitrator
//! 3. Create dispute
//! 4. Cast votes
//! 5. Finalize and resolve dispute

use glin_sdk::contracts::{
    ArbitrationContract, CreateDisputeParams, VoteChoice, VoteParams,
};
use sp_core::{sr25519::Pair, Pair as PairTrait};
use sp_keyring::AccountKeyring;
use subxt::{OnlineClient, PolkadotConfig};

// Configuration
const RPC_URL: &str = "ws://localhost:9944";
const ARBITRATION_ADDRESS: &str = "5Arbitration..."; // Replace with deployed contract address

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🚀 GLIN Arbitration DAO Example\n");

    // Step 1: Connect to GLIN network
    println!("📡 Connecting to GLIN network...");
    let client = OnlineClient::<PolkadotConfig>::from_url(RPC_URL).await?;
    println!("✅ Connected to GLIN network\n");

    // Step 2: Create accounts
    println!("👤 Creating test accounts...");
    let alice = AccountKeyring::Alice.pair(); // Claimant
    let bob = AccountKeyring::Bob.pair(); // Defendant
    let charlie = AccountKeyring::Charlie.pair(); // Arbitrator 1
    let dave = AccountKeyring::Dave.pair(); // Arbitrator 2
    let eve = AccountKeyring::Eve.pair(); // Arbitrator 3

    println!("Claimant (Alice): {:?}", AccountKeyring::Alice.to_account_id());
    println!("Defendant (Bob): {:?}", AccountKeyring::Bob.to_account_id());
    println!(
        "Arbitrator 1 (Charlie): {:?}",
        AccountKeyring::Charlie.to_account_id()
    );
    println!(
        "Arbitrator 2 (Dave): {:?}",
        AccountKeyring::Dave.to_account_id()
    );
    println!("Arbitrator 3 (Eve): {:?}", AccountKeyring::Eve.to_account_id());
    println!();

    // Step 3: Initialize contract
    println!("📝 Initializing arbitration contract...");
    let contract = ArbitrationContract::new(
        client.clone(),
        ARBITRATION_ADDRESS.parse().unwrap(),
    );
    println!("✅ Contract initialized\n");

    // Step 4: Register arbitrators
    println!("🔨 Registering arbitrators...");
    println!("Each arbitrator stakes 200 GLIN");

    // Register Charlie as arbitrator
    let result1 = contract
        .register_arbitrator(200_000_000_000_000_000_000, &charlie)
        .await?;
    if result1.success {
        println!("✅ Charlie registered as arbitrator (stake: 200 GLIN)");
    } else {
        println!("❌ Failed: {:?}", result1.error);
    }

    // Register Dave as arbitrator
    let result2 = contract
        .register_arbitrator(300_000_000_000_000_000_000, &dave)
        .await?;
    if result2.success {
        println!("✅ Dave registered as arbitrator (stake: 300 GLIN)");
    } else {
        println!("❌ Failed: {:?}", result2.error);
    }

    // Register Eve as arbitrator
    let result3 = contract
        .register_arbitrator(150_000_000_000_000_000_000, &eve)
        .await?;
    if result3.success {
        println!("✅ Eve registered as arbitrator (stake: 150 GLIN)");
    } else {
        println!("❌ Failed: {:?}", result3.error);
    }
    println!();

    // Step 5: Query arbitrator info
    println!("🔍 Querying arbitrator details...");
    if let Some(arbitrator) = contract
        .get_arbitrator(&AccountKeyring::Dave.to_account_id())
        .await?
    {
        println!("Arbitrator: Dave");
        println!("  Stake: {} GLIN", arbitrator.stake / 1_000_000_000_000_000_000);
        println!("  Disputes participated: {}", arbitrator.disputes_participated);
        println!("  Reputation: {}", arbitrator.reputation);
        println!("  Active: {}", arbitrator.is_active);
    }
    println!();

    // Step 6: Create dispute
    println!("⚖️  Creating dispute...");
    println!("Dispute: Provider failed to deliver AI training services");
    println!("Evidence: ipfs://QmXYZ.../evidence.pdf");

    let dispute_params = CreateDisputeParams {
        defendant: AccountKeyring::Bob.to_account_id(),
        description: "Provider failed to deliver agreed AI training services despite full payment of 5000 GLIN".to_string(),
        evidence_uri: "ipfs://QmXYZ.../training-dispute-evidence.pdf".to_string(),
    };

    let dispute_result = contract.create_dispute(dispute_params, &alice).await?;
    if dispute_result.success {
        println!("✅ Dispute created! ID: 0");
    } else {
        println!("❌ Failed to create dispute: {:?}", dispute_result.error);
        return Ok(());
    }
    println!();

    let dispute_id = 0u128; // In production, extract from events

    // Step 7: Query dispute details
    println!("🔍 Querying dispute details...");
    if let Some(dispute) = contract.get_dispute(dispute_id).await? {
        println!("Dispute ID: {}", dispute.dispute_id);
        println!("Claimant: {:?}", dispute.claimant);
        println!("Defendant: {:?}", dispute.defendant);
        println!("Description: {}", dispute.description);
        println!("Status: {:?}", dispute.status);
        println!("Evidence: {}", dispute.evidence_uri);
    }
    println!();

    // Step 8: Start voting
    println!("🗳️  Starting voting period...");
    let start_result = contract.start_voting(dispute_id, &alice).await?;
    if start_result.success {
        println!("✅ Voting period started (duration: 7 days)");
    } else {
        println!("❌ Failed: {:?}", start_result.error);
    }
    println!();

    // Step 9: Arbitrators cast votes
    println!("🗳️  Arbitrators casting votes...");

    // Charlie votes in favor of claimant (200 GLIN voting power)
    let vote1 = VoteParams {
        dispute_id,
        choice: VoteChoice::InFavorOfClaimant,
    };
    let vote_result1 = contract.vote(vote1, &charlie).await?;
    if vote_result1.success {
        println!("✅ Charlie voted: In favor of claimant (200 GLIN)");
    }

    // Dave votes in favor of defendant (300 GLIN voting power)
    let vote2 = VoteParams {
        dispute_id,
        choice: VoteChoice::InFavorOfDefendant,
    };
    let vote_result2 = contract.vote(vote2, &dave).await?;
    if vote_result2.success {
        println!("✅ Dave voted: In favor of defendant (300 GLIN)");
    }

    // Eve votes in favor of claimant (150 GLIN voting power)
    let vote3 = VoteParams {
        dispute_id,
        choice: VoteChoice::InFavorOfClaimant,
    };
    let vote_result3 = contract.vote(vote3, &eve).await?;
    if vote_result3.success {
        println!("✅ Eve voted: In favor of claimant (150 GLIN)");
    }
    println!();

    // Step 10: Calculate vote results
    println!("📊 Vote tally:");
    if let Some(dispute) = contract.get_dispute(dispute_id).await? {
        let claimant_votes = dispute.votes_for_claimant / 1_000_000_000_000_000_000;
        let defendant_votes = dispute.votes_for_defendant / 1_000_000_000_000_000_000;

        println!("  Votes for claimant: {} GLIN", claimant_votes);
        println!("    - Charlie: 200 GLIN");
        println!("    - Eve: 150 GLIN");
        println!();
        println!("  Votes for defendant: {} GLIN", defendant_votes);
        println!("    - Dave: 300 GLIN");
        println!();

        if claimant_votes > defendant_votes {
            println!("  Current leader: Claimant (Alice)");
        } else {
            println!("  Current leader: Defendant (Bob)");
        }
    }
    println!();

    // Step 11: Finalize dispute (after voting period)
    println!("⏰ Waiting for voting period to end...");
    println!("(In production, wait 7 days. For demo, assuming period ended)");
    println!();

    println!("🏁 Finalizing dispute...");
    let finalize_result = contract.finalize_dispute(dispute_id, &alice).await?;
    if finalize_result.success {
        if let Some(resolution) = finalize_result.data {
            match resolution {
                VoteChoice::InFavorOfClaimant => {
                    println!("✅ Dispute resolved: In favor of claimant (Alice)");
                    println!("   Result: Claimant wins with 350 GLIN vs 300 GLIN");
                }
                VoteChoice::InFavorOfDefendant => {
                    println!("✅ Dispute resolved: In favor of defendant (Bob)");
                }
            }
        }
    } else {
        println!("❌ Failed to finalize: {:?}", finalize_result.error);
    }
    println!();

    // Step 12: Check if dispute can be appealed
    println!("🔍 Checking appeal status...");
    if let Some(dispute) = contract.get_dispute(dispute_id).await? {
        if dispute.can_appeal {
            println!("⚖️  Dispute can be appealed");
            println!("   Either party can submit one appeal");
        } else {
            println!("✓ No appeals allowed - decision is final");
        }
    }
    println!();

    // Step 13: Updated arbitrator stats
    println!("📊 Arbitrator Statistics:");
    println!("─".repeat(60));

    for (name, keyring) in [
        ("Charlie", AccountKeyring::Charlie),
        ("Dave", AccountKeyring::Dave),
        ("Eve", AccountKeyring::Eve),
    ] {
        if let Some(arb) = contract.get_arbitrator(&keyring.to_account_id()).await? {
            let stake_glin = arb.stake / 1_000_000_000_000_000_000;
            println!("{name}:");
            println!("  Stake: {stake_glin} GLIN");
            println!("  Disputes participated: {}", arb.disputes_participated);
            println!("  Disputes resolved: {}", arb.disputes_resolved);
            println!("  Reputation: {}", arb.reputation);
            println!();
        }
    }
    println!("─".repeat(60));
    println!();

    // Summary
    println!("📋 Summary:");
    println!("• 3 arbitrators registered with total stake of 650 GLIN");
    println!("• 1 dispute created and resolved");
    println!("• Stake-weighted voting: 350 GLIN (claimant) vs 300 GLIN (defendant)");
    println!("• Resolution: In favor of claimant");
    println!();

    println!("🏁 Example completed successfully!");

    Ok(())
}
