//! # GLIN Smart Contracts Module
//!
//! This module provides Rust clients for interacting with GLIN smart contracts:
//!
//! - **GenericEscrow**: Milestone-based payment escrow with dispute resolution
//! - **ProfessionalRegistry**: Professional registration and reputation system
//! - **ArbitrationDAO**: Decentralized dispute resolution through stake-weighted voting
//!
//! ## Example
//!
//! ```no_run
//! use glin_sdk::contracts::{EscrowContract, CreateAgreementParams};
//! use subxt::OnlineClient;
//!
//! # async fn example() -> Result<(), Box<dyn std::error::Error>> {
//! // Connect to GLIN network
//! let client = OnlineClient::new().await?;
//!
//! // Initialize escrow contract
//! let escrow = EscrowContract::new(client, "5Escrow...".parse()?);
//!
//! // Create an agreement
//! let params = CreateAgreementParams {
//!     provider: "5Provider...".parse()?,
//!     milestone_descriptions: vec!["Design".to_string(), "Development".to_string()],
//!     milestone_amounts: vec![500_000_000_000_000_000_000, 1_500_000_000_000_000_000_000],
//!     milestone_deadlines: vec![1234567890, 1234567890],
//!     dispute_timeout: 1234567890,
//!     oracle: None,
//!     value: 2_000_000_000_000_000_000_000,
//! };
//!
//! // let result = escrow.create_agreement(params, &keypair).await?;
//! # Ok(())
//! # }
//! ```
//!
//! ## Features
//!
//! - **Type-safe**: All contract interactions use strongly-typed Rust structs
//! - **Async**: Built on tokio for asynchronous execution
//! - **subxt integration**: Uses subxt for Substrate blockchain interaction
//! - **Event streaming**: Subscribe to contract events
//! - **Gas estimation**: Automatic gas estimation for transactions
//!
//! ## Contract Types
//!
//! The module exports all contract-related types including:
//!
//! - Enums: `MilestoneStatus`, `ProfessionalRole`, `DisputeStatus`, `VoteChoice`
//! - Structs: `Agreement`, `Milestone`, `ProfessionalProfile`, `Review`, `Dispute`, `Arbitrator`
//! - Parameter types: `CreateAgreementParams`, `RegisterProfessionalParams`, etc.
//! - Result type: `ContractResult<T>`

pub mod types;
pub mod escrow;
pub mod registry;
pub mod arbitration;

// Re-export main types
pub use types::*;
pub use escrow::EscrowContract;
pub use registry::RegistryContract;
pub use arbitration::ArbitrationContract;

use anyhow::Result;
use subxt::{OnlineClient, PolkadotConfig};

/// Main client for interacting with all GLIN smart contracts
///
/// This is a convenience wrapper that provides access to all three
/// contract clients: escrow, registry, and arbitration.
///
/// # Example
///
/// ```no_run
/// use glin_sdk::contracts::GlinContracts;
///
/// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
/// let contracts = GlinContracts::new(
///     "wss://rpc.glin.ai",
///     Some("5Escrow...".parse()?),
///     Some("5Registry...".parse()?),
///     Some("5Arbitration...".parse()?),
/// ).await?;
///
/// // Access individual contracts
/// // let agreement_id = contracts.escrow.create_agreement(...).await?;
/// // let profile = contracts.registry.get_profile(&account).await?;
/// // let dispute = contracts.arbitration.get_dispute(0).await?;
/// # Ok(())
/// # }
/// ```
pub struct GlinContracts {
    client: OnlineClient<PolkadotConfig>,
    pub escrow: EscrowContract,
    pub registry: RegistryContract,
    pub arbitration: ArbitrationContract,
}

impl GlinContracts {
    /// Create a new contracts client
    ///
    /// # Arguments
    ///
    /// * `rpc_url` - RPC endpoint URL (e.g., "wss://rpc.glin.ai")
    /// * `escrow_address` - Optional GenericEscrow contract address
    /// * `registry_address` - Optional ProfessionalRegistry contract address
    /// * `arbitration_address` - Optional ArbitrationDAO contract address
    pub async fn new(
        rpc_url: &str,
        escrow_address: Option<AccountId>,
        registry_address: Option<AccountId>,
        arbitration_address: Option<AccountId>,
    ) -> Result<Self> {
        let client = OnlineClient::<PolkadotConfig>::from_url(rpc_url).await?;

        // Use zero address as placeholder if not provided
        let zero_address = AccountId::from([0u8; 32]);

        Ok(Self {
            escrow: EscrowContract::new(
                client.clone(),
                escrow_address.unwrap_or(zero_address.clone()),
            ),
            registry: RegistryContract::new(
                client.clone(),
                registry_address.unwrap_or(zero_address.clone()),
            ),
            arbitration: ArbitrationContract::new(
                client.clone(),
                arbitration_address.unwrap_or(zero_address),
            ),
            client,
        })
    }

    /// Create from existing client
    ///
    /// # Arguments
    ///
    /// * `client` - Connected OnlineClient
    /// * `escrow_address` - Optional GenericEscrow contract address
    /// * `registry_address` - Optional ProfessionalRegistry contract address
    /// * `arbitration_address` - Optional ArbitrationDAO contract address
    pub fn from_client(
        client: OnlineClient<PolkadotConfig>,
        escrow_address: Option<AccountId>,
        registry_address: Option<AccountId>,
        arbitration_address: Option<AccountId>,
    ) -> Self {
        let zero_address = AccountId::from([0u8; 32]);

        Self {
            escrow: EscrowContract::new(
                client.clone(),
                escrow_address.unwrap_or(zero_address.clone()),
            ),
            registry: RegistryContract::new(
                client.clone(),
                registry_address.unwrap_or(zero_address.clone()),
            ),
            arbitration: ArbitrationContract::new(
                client.clone(),
                arbitration_address.unwrap_or(zero_address),
            ),
            client,
        }
    }

    /// Get reference to the underlying client
    pub fn client(&self) -> &OnlineClient<PolkadotConfig> {
        &self.client
    }
}
