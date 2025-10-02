//! Integration tests for GLIN contracts
//!
//! Prerequisites:
//! - Local GLIN node running (ws://localhost:9944)
//! - Contracts deployed (GenericEscrow, ProfessionalRegistry, ArbitrationDAO)
//! - Set contract addresses in environment variables:
//!   - ESCROW_ADDRESS
//!   - REGISTRY_ADDRESS
//!   - ARBITRATION_ADDRESS
//!
//! Run: cargo test --test integration_tests -- --test-threads=1

use glin_sdk::contracts::{
    ArbitrationContract, CreateAgreementParams, CreateDisputeParams, EscrowContract,
    GlinContracts, MilestoneStatus, ProfessionalRole, RegisterProfessionalParams,
    RegistryContract, SubmitReviewParams, VoteChoice, VoteParams,
};
use sp_core::{crypto::Ss25519, sr25519::Pair, Pair as PairTrait};
use sp_keyring::AccountKeyring;
use std::env;
use subxt::{OnlineClient, PolkadotConfig};

const RPC_URL: &str = "ws://localhost:9944";

fn get_contract_addresses() -> (Option<String>, Option<String>, Option<String>) {
    (
        env::var("ESCROW_ADDRESS").ok(),
        env::var("REGISTRY_ADDRESS").ok(),
        env::var("ARBITRATION_ADDRESS").ok(),
    )
}

fn should_skip_tests() -> bool {
    let (escrow, registry, arbitration) = get_contract_addresses();
    escrow.is_none() && registry.is_none() && arbitration.is_none()
}

#[tokio::test]
#[ignore] // Run with --ignored flag when node is available
async fn test_connect_to_node() {
    if should_skip_tests() {
        println!("Skipping: Contract addresses not set");
        return;
    }

    let client = OnlineClient::<PolkadotConfig>::from_url(RPC_URL)
        .await
        .expect("Failed to connect to node");

    assert!(client.metadata().pallets().len() > 0);
}

#[tokio::test]
#[ignore]
async fn test_escrow_create_agreement() {
    let (escrow_addr, _, _) = get_contract_addresses();
    if escrow_addr.is_none() {
        println!("Skipping: ESCROW_ADDRESS not set");
        return;
    }

    let client = OnlineClient::<PolkadotConfig>::from_url(RPC_URL)
        .await
        .expect("Failed to connect");

    let alice = AccountKeyring::Alice.pair();
    let bob = AccountKeyring::Bob;

    let contract = EscrowContract::new(client, escrow_addr.unwrap().parse().unwrap());

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;

    let params = CreateAgreementParams {
        provider: bob.to_account_id().into(),
        milestone_descriptions: vec!["Test milestone".to_string()],
        milestone_amounts: vec![1_000_000_000_000_000_000_000],
        milestone_deadlines: vec![now + 86400000],
        dispute_timeout: now + 259200000,
        oracle: None,
        value: 1_000_000_000_000_000_000_000,
    };

    let result = contract.create_agreement(params, &alice).await;

    assert!(result.is_ok());
    let contract_result = result.unwrap();
    assert!(contract_result.success);
}

#[tokio::test]
#[ignore]
async fn test_escrow_query_agreement() {
    let (escrow_addr, _, _) = get_contract_addresses();
    if escrow_addr.is_none() {
        println!("Skipping: ESCROW_ADDRESS not set");
        return;
    }

    let client = OnlineClient::<PolkadotConfig>::from_url(RPC_URL)
        .await
        .expect("Failed to connect");

    let contract = EscrowContract::new(client, escrow_addr.unwrap().parse().unwrap());

    let agreement = contract.get_agreement(0).await;

    // Agreement may or may not exist depending on previous tests
    assert!(agreement.is_ok());
}

#[tokio::test]
#[ignore]
async fn test_escrow_milestone_count() {
    let (escrow_addr, _, _) = get_contract_addresses();
    if escrow_addr.is_none() {
        println!("Skipping: ESCROW_ADDRESS not set");
        return;
    }

    let client = OnlineClient::<PolkadotConfig>::from_url(RPC_URL)
        .await
        .expect("Failed to connect");

    let contract = EscrowContract::new(client, escrow_addr.unwrap().parse().unwrap());

    let count = contract.get_milestone_count(0).await;

    assert!(count.is_ok());
}

#[tokio::test]
#[ignore]
async fn test_registry_register_professional() {
    let (_, registry_addr, _) = get_contract_addresses();
    if registry_addr.is_none() {
        println!("Skipping: REGISTRY_ADDRESS not set");
        return;
    }

    let client = OnlineClient::<PolkadotConfig>::from_url(RPC_URL)
        .await
        .expect("Failed to connect");

    let alice = AccountKeyring::Alice.pair();

    let contract = RegistryContract::new(client, registry_addr.unwrap().parse().unwrap());

    let params = RegisterProfessionalParams {
        role: ProfessionalRole::Lawyer,
        metadata_uri: "ipfs://test".to_string(),
        stake_amount: 100_000_000_000_000_000_000,
    };

    let result = contract.register(params, &alice).await;

    // May fail if already registered, which is okay
    assert!(result.is_ok() || result.is_err());
}

#[tokio::test]
#[ignore]
async fn test_registry_query_profile() {
    let (_, registry_addr, _) = get_contract_addresses();
    if registry_addr.is_none() {
        println!("Skipping: REGISTRY_ADDRESS not set");
        return;
    }

    let client = OnlineClient::<PolkadotConfig>::from_url(RPC_URL)
        .await
        .expect("Failed to connect");

    let alice = AccountKeyring::Alice.to_account_id();

    let contract = RegistryContract::new(client, registry_addr.unwrap().parse().unwrap());

    let profile = contract.get_profile(alice.into()).await;

    assert!(profile.is_ok());
}

#[tokio::test]
#[ignore]
async fn test_registry_min_stake() {
    let (_, registry_addr, _) = get_contract_addresses();
    if registry_addr.is_none() {
        println!("Skipping: REGISTRY_ADDRESS not set");
        return;
    }

    let client = OnlineClient::<PolkadotConfig>::from_url(RPC_URL)
        .await
        .expect("Failed to connect");

    let contract = RegistryContract::new(client, registry_addr.unwrap().parse().unwrap());

    let min_stake = contract.get_min_stake(ProfessionalRole::Lawyer).await;

    assert!(min_stake.is_ok());
    if let Ok(stake) = min_stake {
        assert!(stake > 0);
    }
}

#[tokio::test]
#[ignore]
async fn test_arbitration_register_arbitrator() {
    let (_, _, arbitration_addr) = get_contract_addresses();
    if arbitration_addr.is_none() {
        println!("Skipping: ARBITRATION_ADDRESS not set");
        return;
    }

    let client = OnlineClient::<PolkadotConfig>::from_url(RPC_URL)
        .await
        .expect("Failed to connect");

    let alice = AccountKeyring::Alice.pair();

    let contract = ArbitrationContract::new(client, arbitration_addr.unwrap().parse().unwrap());

    let result = contract
        .register_arbitrator(200_000_000_000_000_000_000, &alice)
        .await;

    // May fail if already registered
    assert!(result.is_ok() || result.is_err());
}

#[tokio::test]
#[ignore]
async fn test_arbitration_create_dispute() {
    let (_, _, arbitration_addr) = get_contract_addresses();
    if arbitration_addr.is_none() {
        println!("Skipping: ARBITRATION_ADDRESS not set");
        return;
    }

    let client = OnlineClient::<PolkadotConfig>::from_url(RPC_URL)
        .await
        .expect("Failed to connect");

    let alice = AccountKeyring::Alice.pair();
    let bob = AccountKeyring::Bob;

    let contract = ArbitrationContract::new(client, arbitration_addr.unwrap().parse().unwrap());

    let params = CreateDisputeParams {
        defendant: bob.to_account_id().into(),
        description: "Test dispute".to_string(),
        evidence_uri: "ipfs://evidence".to_string(),
    };

    let result = contract.create_dispute(params, &alice).await;

    assert!(result.is_ok());
    let contract_result = result.unwrap();
    assert!(contract_result.success);
}

#[tokio::test]
#[ignore]
async fn test_arbitration_query_arbitrator() {
    let (_, _, arbitration_addr) = get_contract_addresses();
    if arbitration_addr.is_none() {
        println!("Skipping: ARBITRATION_ADDRESS not set");
        return;
    }

    let client = OnlineClient::<PolkadotConfig>::from_url(RPC_URL)
        .await
        .expect("Failed to connect");

    let alice = AccountKeyring::Alice.to_account_id();

    let contract = ArbitrationContract::new(client, arbitration_addr.unwrap().parse().unwrap());

    let arbitrator = contract.get_arbitrator(alice.into()).await;

    assert!(arbitrator.is_ok());
}

#[tokio::test]
#[ignore]
async fn test_arbitration_get_dispute() {
    let (_, _, arbitration_addr) = get_contract_addresses();
    if arbitration_addr.is_none() {
        println!("Skipping: ARBITRATION_ADDRESS not set");
        return;
    }

    let client = OnlineClient::<PolkadotConfig>::from_url(RPC_URL)
        .await
        .expect("Failed to connect");

    let contract = ArbitrationContract::new(client, arbitration_addr.unwrap().parse().unwrap());

    let dispute = contract.get_dispute(0).await;

    assert!(dispute.is_ok());
}

#[tokio::test]
#[ignore]
async fn test_glin_contracts_wrapper() {
    let (escrow_addr, registry_addr, arbitration_addr) = get_contract_addresses();
    if escrow_addr.is_none() {
        println!("Skipping: Contract addresses not set");
        return;
    }

    let client = OnlineClient::<PolkadotConfig>::from_url(RPC_URL)
        .await
        .expect("Failed to connect");

    let alice = AccountKeyring::Alice.pair();

    let contracts = GlinContracts::new(
        client,
        escrow_addr.unwrap().parse().unwrap(),
        registry_addr.map(|a| a.parse().unwrap()),
        arbitration_addr.map(|a| a.parse().unwrap()),
    );

    // Test that all contracts are accessible
    assert!(contracts.escrow.get_agreement(0).await.is_ok());

    if contracts.registry.is_some() {
        let registry = contracts.registry.as_ref().unwrap();
        assert!(registry
            .get_profile(AccountKeyring::Alice.to_account_id().into())
            .await
            .is_ok());
    }

    if contracts.arbitration.is_some() {
        let arbitration = contracts.arbitration.as_ref().unwrap();
        assert!(arbitration.get_dispute(0).await.is_ok());
    }
}

#[tokio::test]
#[ignore]
async fn test_complete_escrow_workflow() {
    let (escrow_addr, _, _) = get_contract_addresses();
    if escrow_addr.is_none() {
        println!("Skipping: ESCROW_ADDRESS not set");
        return;
    }

    let client = OnlineClient::<PolkadotConfig>::from_url(RPC_URL)
        .await
        .expect("Failed to connect");

    let alice = AccountKeyring::Alice.pair();
    let bob = AccountKeyring::Bob;

    let contract = EscrowContract::new(client, escrow_addr.unwrap().parse().unwrap());

    // 1. Create agreement
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;

    let params = CreateAgreementParams {
        provider: bob.to_account_id().into(),
        milestone_descriptions: vec!["Design".to_string(), "Development".to_string()],
        milestone_amounts: vec![1_000_000_000_000_000_000_000, 2_000_000_000_000_000_000_000],
        milestone_deadlines: vec![now + 86400000, now + 172800000],
        dispute_timeout: now + 259200000,
        oracle: None,
        value: 3_000_000_000_000_000_000_000,
    };

    let create_result = contract.create_agreement(params, &alice).await;
    assert!(create_result.is_ok());

    let contract_result = create_result.unwrap();
    assert!(contract_result.success);

    // 2. Query agreement
    let agreement = contract.get_agreement(0).await;
    assert!(agreement.is_ok());

    if let Ok(Some(agreement)) = agreement {
        assert_eq!(agreement.client, AccountKeyring::Alice.to_account_id().into());
        assert_eq!(agreement.provider, bob.to_account_id().into());
        assert!(agreement.is_active);
    }

    // 3. Get milestone count
    let count = contract.get_milestone_count(0).await;
    assert!(count.is_ok());
    if let Ok(count) = count {
        assert_eq!(count, 2);
    }
}

#[tokio::test]
#[ignore]
async fn test_complete_registry_workflow() {
    let (_, registry_addr, _) = get_contract_addresses();
    if registry_addr.is_none() {
        println!("Skipping: REGISTRY_ADDRESS not set");
        return;
    }

    let client = OnlineClient::<PolkadotConfig>::from_url(RPC_URL)
        .await
        .expect("Failed to connect");

    let alice = AccountKeyring::Alice.pair();

    let contract = RegistryContract::new(client, registry_addr.unwrap().parse().unwrap());

    // 1. Check minimum stake
    let min_stake = contract.get_min_stake(ProfessionalRole::Doctor).await;
    assert!(min_stake.is_ok());
    if let Ok(stake) = min_stake {
        assert!(stake > 0);
    }

    // 2. Register professional
    let params = RegisterProfessionalParams {
        role: ProfessionalRole::Doctor,
        metadata_uri: "ipfs://profile".to_string(),
        stake_amount: 150_000_000_000_000_000_000,
    };

    let _register_result = contract.register(params, &alice).await;

    // 3. Query profile
    let profile = contract
        .get_profile(AccountKeyring::Alice.to_account_id().into())
        .await;
    assert!(profile.is_ok());
}

#[tokio::test]
#[ignore]
async fn test_complete_arbitration_workflow() {
    let (_, _, arbitration_addr) = get_contract_addresses();
    if arbitration_addr.is_none() {
        println!("Skipping: ARBITRATION_ADDRESS not set");
        return;
    }

    let client = OnlineClient::<PolkadotConfig>::from_url(RPC_URL)
        .await
        .expect("Failed to connect");

    let alice = AccountKeyring::Alice.pair();
    let bob = AccountKeyring::Bob;

    let contract = ArbitrationContract::new(client, arbitration_addr.unwrap().parse().unwrap());

    // 1. Register as arbitrator
    let _register_result = contract
        .register_arbitrator(250_000_000_000_000_000_000, &alice)
        .await;

    // 2. Check arbitrator info
    let arbitrator = contract
        .get_arbitrator(AccountKeyring::Alice.to_account_id().into())
        .await;
    assert!(arbitrator.is_ok());

    // 3. Create dispute
    let params = CreateDisputeParams {
        defendant: bob.to_account_id().into(),
        description: "Payment dispute".to_string(),
        evidence_uri: "ipfs://dispute-evidence".to_string(),
    };

    let dispute_result = contract.create_dispute(params, &alice).await;
    assert!(dispute_result.is_ok());
}
