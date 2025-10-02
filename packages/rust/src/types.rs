//! Type definitions for GLIN SDK

use parity_scale_codec::{Decode, Encode};
use serde::{Deserialize, Serialize};

/// Account balance information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Balance {
    pub free: u128,
    pub reserved: u128,
    pub frozen: u128,
    pub total: u128,
}

/// On-chain task representation
#[derive(Debug, Clone, Serialize, Deserialize, Encode, Decode)]
pub struct ChainTask {
    pub id: Vec<u8>,
    pub creator: String,
    pub bounty: u128,
    pub min_providers: u32,
    pub max_providers: u32,
    pub ipfs_hash: Vec<u8>,
    pub status: TaskStatus,
}

/// Task status enum
#[derive(Debug, Clone, Serialize, Deserialize, Encode, Decode)]
pub enum TaskStatus {
    Pending,
    Recruiting,
    Running,
    Validating,
    Completed,
    Failed,
    Cancelled,
}

/// On-chain provider representation
#[derive(Debug, Clone, Serialize, Deserialize, Encode, Decode)]
pub struct ChainProvider {
    pub account: String,
    pub stake: u128,
    pub reputation_score: u32,
    pub hardware_tier: HardwareTier,
    pub status: ProviderStatus,
    pub is_slashed: bool,
}

/// Hardware tier enum
#[derive(Debug, Clone, Serialize, Deserialize, Encode, Decode)]
pub enum HardwareTier {
    Consumer,
    Prosumer,
    Professional,
}

/// Provider status enum
#[derive(Debug, Clone, Serialize, Deserialize, Encode, Decode)]
pub enum ProviderStatus {
    Active,
    Idle,
    Busy,
    Offline,
    Suspended,
    Unbonding,
}

/// Authentication result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResult {
    pub address: String,
    pub signature: String,
    pub message: String,
    pub timestamp: u64,
}
