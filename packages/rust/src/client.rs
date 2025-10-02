//! Blockchain client for GLIN network

use anyhow::Result;
use subxt::{OnlineClient, PolkadotConfig};
use crate::types::Balance;

/// GLIN blockchain client
pub struct GlinClient {
    client: OnlineClient<PolkadotConfig>,
    rpc_url: String,
}

impl GlinClient {
    /// Create a new GLIN client
    ///
    /// # Example
    ///
    /// ```no_run
    /// use glin_sdk::GlinClient;
    ///
    /// #[tokio::main]
    /// async fn main() -> Result<(), Box<dyn std::error::Error>> {
    ///     let client = GlinClient::new("wss://rpc.glin.ai").await?;
    ///     Ok(())
    /// }
    /// ```
    pub async fn new(rpc_url: impl Into<String>) -> Result<Self> {
        let rpc_url = rpc_url.into();
        let client = OnlineClient::<PolkadotConfig>::from_url(&rpc_url).await?;

        Ok(Self { client, rpc_url })
    }

    /// Get account balance
    ///
    /// # Example
    ///
    /// ```no_run
    /// # use glin_sdk::GlinClient;
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let client = GlinClient::new("wss://rpc.glin.ai").await?;
    /// let balance = client.get_balance("5GrwvaEF...").await?;
    /// println!("Free balance: {}", balance.free);
    /// # Ok(())
    /// # }
    /// ```
    pub async fn get_balance(&self, _address: &str) -> Result<Balance> {
        // Note: This is a simplified implementation
        // In production, use proper subxt storage queries with generated metadata

        // For now, return a mock balance
        // TODO: Implement actual balance query using subxt
        Ok(Balance {
            free: 0,
            reserved: 0,
            frozen: 0,
            total: 0,
        })
    }

    /// Get current block number
    pub async fn get_block_number(&self) -> Result<u32> {
        let header = self.client.blocks().at_latest().await?;
        Ok(header.number())
    }

    /// Get the RPC URL
    pub fn rpc_url(&self) -> &str {
        &self.rpc_url
    }

    /// Get the underlying subxt client for advanced usage
    pub fn subxt_client(&self) -> &OnlineClient<PolkadotConfig> {
        &self.client
    }
}
