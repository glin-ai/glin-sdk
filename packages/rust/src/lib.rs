//! # GLIN SDK
//!
//! Official Rust SDK for the GLIN AI Training Network.
//!
//! ## Features
//!
//! - Blockchain client for querying GLIN network
//! - Authentication and signature verification
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

pub mod client;
pub mod auth;
pub mod types;

pub use client::GlinClient;
pub use auth::GlinAuth;
pub use types::*;

/// SDK version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
