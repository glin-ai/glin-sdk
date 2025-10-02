//! # GLIN SDK
//!
//! Official Rust SDK for the GLIN AI Training Network.
//!
//! ## Features
//!
//! - Blockchain client for querying GLIN network
//! - Authentication and signature verification
//! - Smart contract interactions (GenericEscrow, ProfessionalRegistry, ArbitrationDAO)
//! - Type-safe API using subxt
//!
//! ## Example
//!
//! ```no_run
//! use glin_sdk::{GlinClient, GlinAuth};
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     // Create client
//!     let client = GlinClient::new("wss://rpc.glin.ai").await?;
//!
//!     // Get balance
//!     let balance = client.get_balance("5GrwvaEF...").await?;
//!     println!("Balance: {}", balance.free);
//!
//!     Ok(())
//! }
//! ```
//!
//! ## Smart Contracts
//!
//! ```no_run
//! use glin_sdk::contracts::{GlinContracts, CreateAgreementParams};
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     // Initialize contracts
//!     let contracts = GlinContracts::new(
//!         "wss://rpc.glin.ai",
//!         Some("5Escrow...".parse()?),
//!         Some("5Registry...".parse()?),
//!         Some("5Arbitration...".parse()?),
//!     ).await?;
//!
//!     // Create escrow agreement
//!     let params = CreateAgreementParams {
//!         provider: "5Provider...".parse()?,
//!         milestone_descriptions: vec!["Design".into(), "Development".into()],
//!         milestone_amounts: vec![500_000_000_000_000_000_000, 1_500_000_000_000_000_000_000],
//!         milestone_deadlines: vec![1234567890, 1234567890],
//!         dispute_timeout: 1234567890,
//!         oracle: None,
//!         value: 2_000_000_000_000_000_000_000,
//!     };
//!
//!     // let result = contracts.escrow.create_agreement(params, &keypair).await?;
//!
//!     Ok(())
//! }
//! ```

pub mod client;
pub mod auth;
pub mod types;

// Smart Contracts
pub mod contracts;

pub use client::GlinClient;
pub use auth::GlinAuth;
pub use types::*;

// Re-export contracts module
pub use contracts::GlinContracts;

/// SDK version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
