//! Contract types for GLIN smart contracts

use parity_scale_codec::{Decode, Encode};
use serde::{Deserialize, Serialize};

pub type AccountId = sp_core::crypto::AccountId32;
pub type Balance = u128;
pub type Timestamp = u64;

// ============================================================================
// Escrow Types
// ============================================================================

/// Milestone status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Encode, Decode, Serialize, Deserialize)]
pub enum MilestoneStatus {
    Pending,
    Completed,
    Disputed,
    Resolved,
    Cancelled,
}

/// Milestone information
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub struct Milestone {
    pub description: String,
    pub amount: Balance,
    pub status: MilestoneStatus,
    pub deadline: Timestamp,
    pub oracle_verification: bool,
}

/// Escrow agreement
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub struct Agreement {
    pub client: AccountId,
    pub provider: AccountId,
    pub total_amount: Balance,
    pub deposited_amount: Balance,
    pub created_at: Timestamp,
    pub dispute_timeout: Timestamp,
    pub oracle: Option<AccountId>,
    pub is_active: bool,
}

/// Parameters for creating an agreement
#[derive(Debug, Clone)]
pub struct CreateAgreementParams {
    pub provider: AccountId,
    pub milestone_descriptions: Vec<String>,
    pub milestone_amounts: Vec<Balance>,
    pub milestone_deadlines: Vec<Timestamp>,
    pub dispute_timeout: Timestamp,
    pub oracle: Option<AccountId>,
    pub value: Balance,
}

// ============================================================================
// Registry Types
// ============================================================================

/// Professional role types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Encode, Decode, Serialize, Deserialize)]
pub enum ProfessionalRole {
    Lawyer,
    Doctor,
    Arbitrator,
    Notary,
    Auditor,
    ConsultantOther,
}

/// Professional profile
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub struct ProfessionalProfile {
    pub account: AccountId,
    pub role: ProfessionalRole,
    pub stake_amount: Balance,
    pub reputation_score: u32,
    pub total_jobs: u32,
    pub successful_jobs: u32,
    pub registered_at: Timestamp,
    pub is_active: bool,
    pub metadata_uri: String,
}

/// Review information
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub struct Review {
    pub reviewer: AccountId,
    pub rating: u8, // 1-5
    pub comment: String,
    pub timestamp: Timestamp,
}

/// Parameters for registering as a professional
#[derive(Debug, Clone)]
pub struct RegisterProfessionalParams {
    pub role: ProfessionalRole,
    pub metadata_uri: String,
    pub stake_amount: Balance,
}

/// Parameters for submitting a review
#[derive(Debug, Clone)]
pub struct SubmitReviewParams {
    pub professional: AccountId,
    pub rating: u8,
    pub comment: String,
}

// ============================================================================
// Arbitration Types
// ============================================================================

/// Dispute status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Encode, Decode, Serialize, Deserialize)]
pub enum DisputeStatus {
    Open,
    Voting,
    Resolved,
    Appealed,
    Cancelled,
}

/// Vote choice for disputes
#[derive(Debug, Clone, Copy, PartialEq, Eq, Encode, Decode, Serialize, Deserialize)]
pub enum VoteChoice {
    InFavorOfClaimant,
    InFavorOfDefendant,
}

/// Dispute information
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub struct Dispute {
    pub dispute_id: u128,
    pub claimant: AccountId,
    pub defendant: AccountId,
    pub description: String,
    pub evidence_uri: String,
    pub status: DisputeStatus,
    pub created_at: Timestamp,
    pub voting_ends_at: Timestamp,
    pub votes_for_claimant: Balance,
    pub votes_for_defendant: Balance,
    pub resolution: Option<VoteChoice>,
    pub can_appeal: bool,
}

/// Arbitrator information
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub struct Arbitrator {
    pub account: AccountId,
    pub stake: Balance,
    pub disputes_participated: u32,
    pub disputes_resolved: u32,
    pub reputation: u32,
    pub is_active: bool,
}

/// Parameters for creating a dispute
#[derive(Debug, Clone)]
pub struct CreateDisputeParams {
    pub defendant: AccountId,
    pub description: String,
    pub evidence_uri: String,
}

/// Parameters for voting on a dispute
#[derive(Debug, Clone)]
pub struct VoteParams {
    pub dispute_id: u128,
    pub choice: VoteChoice,
}

// ============================================================================
// Common Types
// ============================================================================

/// Result from a contract call
#[derive(Debug, Clone)]
pub struct ContractResult<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub gas_consumed: Option<u64>,
}

impl<T> ContractResult<T> {
    pub fn ok(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            gas_consumed: None,
        }
    }

    pub fn err(error: impl Into<String>) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(error.into()),
            gas_consumed: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_milestone_status_enum() {
        let status = MilestoneStatus::Pending;
        assert_eq!(status, MilestoneStatus::Pending);

        let status2 = MilestoneStatus::Completed;
        assert_ne!(status, status2);
    }

    #[test]
    fn test_professional_role_enum() {
        let role = ProfessionalRole::Lawyer;
        assert_eq!(role, ProfessionalRole::Lawyer);

        let role2 = ProfessionalRole::Doctor;
        assert_ne!(role, role2);

        // Test all variants exist
        let _all = [
            ProfessionalRole::Lawyer,
            ProfessionalRole::Doctor,
            ProfessionalRole::Arbitrator,
            ProfessionalRole::Notary,
            ProfessionalRole::Auditor,
            ProfessionalRole::ConsultantOther,
        ];
    }

    #[test]
    fn test_dispute_status_enum() {
        let status = DisputeStatus::Open;
        assert_eq!(status, DisputeStatus::Open);

        let status2 = DisputeStatus::Voting;
        assert_ne!(status, status2);
    }

    #[test]
    fn test_vote_choice_enum() {
        let choice = VoteChoice::InFavorOfClaimant;
        assert_eq!(choice, VoteChoice::InFavorOfClaimant);

        let choice2 = VoteChoice::InFavorOfDefendant;
        assert_ne!(choice, choice2);
    }

    #[test]
    fn test_balance_conversions() {
        // 1000 GLIN with 18 decimals
        let glin: u128 = 1000;
        let decimals: u32 = 18;
        let wei: Balance = glin * 10_u128.pow(decimals);

        assert_eq!(wei, 1_000_000_000_000_000_000_000);

        // Convert back
        let glin_back = wei / 10_u128.pow(decimals);
        assert_eq!(glin_back, 1000);
    }

    #[test]
    fn test_contract_result_ok() {
        let result = ContractResult::ok(42u64);

        assert!(result.success);
        assert_eq!(result.data, Some(42));
        assert!(result.error.is_none());
    }

    #[test]
    fn test_contract_result_err() {
        let result: ContractResult<u64> = ContractResult::err("Test error");

        assert!(!result.success);
        assert!(result.data.is_none());
        assert_eq!(result.error, Some("Test error".to_string()));
    }

    #[test]
    fn test_milestone_struct() {
        let milestone = Milestone {
            description: "Test milestone".to_string(),
            amount: 1_000_000_000_000_000_000_000,
            status: MilestoneStatus::Pending,
            deadline: 1700000000000,
            oracle_verification: false,
        };

        assert_eq!(milestone.description, "Test milestone");
        assert_eq!(milestone.amount, 1_000_000_000_000_000_000_000);
        assert_eq!(milestone.status, MilestoneStatus::Pending);
        assert!(!milestone.oracle_verification);
    }

    #[test]
    fn test_create_agreement_params() {
        use sp_core::crypto::AccountId32;

        let provider = AccountId32::new([1u8; 32]);
        let params = CreateAgreementParams {
            provider: provider.clone(),
            milestone_descriptions: vec!["M1".to_string(), "M2".to_string()],
            milestone_amounts: vec![1000, 2000],
            milestone_deadlines: vec![1700000000, 1700086400],
            dispute_timeout: 1700172800,
            oracle: None,
            value: 3000,
        };

        assert_eq!(params.provider, provider);
        assert_eq!(params.milestone_descriptions.len(), 2);
        assert_eq!(params.milestone_amounts.len(), 2);
        assert!(params.oracle.is_none());
    }

    #[test]
    fn test_professional_profile_struct() {
        use sp_core::crypto::AccountId32;

        let account = AccountId32::new([2u8; 32]);
        let profile = ProfessionalProfile {
            account: account.clone(),
            role: ProfessionalRole::Lawyer,
            stake_amount: 100_000_000_000_000_000_000,
            reputation_score: 100,
            total_jobs: 0,
            successful_jobs: 0,
            registered_at: 1700000000,
            is_active: true,
            metadata_uri: "ipfs://test".to_string(),
        };

        assert_eq!(profile.account, account);
        assert_eq!(profile.role, ProfessionalRole::Lawyer);
        assert!(profile.is_active);
        assert_eq!(profile.total_jobs, 0);
    }

    #[test]
    fn test_review_struct() {
        use sp_core::crypto::AccountId32;

        let reviewer = AccountId32::new([3u8; 32]);
        let review = Review {
            reviewer: reviewer.clone(),
            rating: 5,
            comment: "Excellent service".to_string(),
            timestamp: 1700000000,
        };

        assert_eq!(review.reviewer, reviewer);
        assert_eq!(review.rating, 5);
        assert_eq!(review.comment, "Excellent service");
    }

    #[test]
    fn test_dispute_struct() {
        use sp_core::crypto::AccountId32;

        let claimant = AccountId32::new([4u8; 32]);
        let defendant = AccountId32::new([5u8; 32]);

        let dispute = Dispute {
            dispute_id: 0,
            claimant: claimant.clone(),
            defendant: defendant.clone(),
            description: "Service not delivered".to_string(),
            evidence_uri: "ipfs://evidence".to_string(),
            status: DisputeStatus::Open,
            created_at: 1700000000,
            voting_ends_at: 1700604800,
            votes_for_claimant: 0,
            votes_for_defendant: 0,
            resolution: None,
            can_appeal: false,
        };

        assert_eq!(dispute.dispute_id, 0);
        assert_eq!(dispute.claimant, claimant);
        assert_eq!(dispute.defendant, defendant);
        assert_eq!(dispute.status, DisputeStatus::Open);
        assert!(dispute.resolution.is_none());
    }

    #[test]
    fn test_arbitrator_struct() {
        use sp_core::crypto::AccountId32;

        let account = AccountId32::new([6u8; 32]);
        let arbitrator = Arbitrator {
            account: account.clone(),
            stake: 200_000_000_000_000_000_000,
            disputes_participated: 0,
            disputes_resolved: 0,
            reputation: 100,
            is_active: true,
        };

        assert_eq!(arbitrator.account, account);
        assert_eq!(arbitrator.stake, 200_000_000_000_000_000_000);
        assert!(arbitrator.is_active);
        assert_eq!(arbitrator.reputation, 100);
    }
}
