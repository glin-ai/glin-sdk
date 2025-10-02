"""Contract types for GLIN smart contracts"""

from dataclasses import dataclass
from typing import Optional, List
from enum import Enum


# ============================================================================
# Enums
# ============================================================================

class MilestoneStatus(Enum):
    """Milestone status"""
    PENDING = "Pending"
    COMPLETED = "Completed"
    DISPUTED = "Disputed"
    RESOLVED = "Resolved"
    CANCELLED = "Cancelled"


class ProfessionalRole(Enum):
    """Professional role types"""
    LAWYER = "Lawyer"
    DOCTOR = "Doctor"
    ARBITRATOR = "Arbitrator"
    NOTARY = "Notary"
    AUDITOR = "Auditor"
    CONSULTANT_OTHER = "ConsultantOther"


class DisputeStatus(Enum):
    """Dispute status"""
    OPEN = "Open"
    VOTING = "Voting"
    RESOLVED = "Resolved"
    APPEALED = "Appealed"
    CANCELLED = "Cancelled"


class VoteChoice(Enum):
    """Vote choice for disputes"""
    IN_FAVOR_OF_CLAIMANT = "InFavorOfClaimant"
    IN_FAVOR_OF_DEFENDANT = "InFavorOfDefendant"


# ============================================================================
# Escrow Types
# ============================================================================

@dataclass
class Milestone:
    """Milestone information"""
    description: str
    amount: str  # Balance as string
    status: MilestoneStatus
    deadline: int  # Timestamp
    oracle_verification: bool


@dataclass
class Agreement:
    """Escrow agreement information"""
    client: str  # AccountId
    provider: str  # AccountId
    total_amount: str  # Balance as string
    deposited_amount: str  # Balance as string
    created_at: int  # Timestamp
    dispute_timeout: int  # Timestamp
    oracle: Optional[str]  # AccountId
    is_active: bool


@dataclass
class CreateAgreementParams:
    """Parameters for creating an agreement"""
    provider: str
    milestone_descriptions: List[str]
    milestone_amounts: List[str]
    milestone_deadlines: List[int]
    dispute_timeout: int
    oracle: Optional[str] = None
    value: str = "0"  # Amount to deposit


# ============================================================================
# Registry Types
# ============================================================================

@dataclass
class ProfessionalProfile:
    """Professional profile information"""
    account: str  # AccountId
    role: ProfessionalRole
    stake_amount: str  # Balance as string
    reputation_score: int
    total_jobs: int
    successful_jobs: int
    registered_at: int  # Timestamp
    is_active: bool
    metadata_uri: str


@dataclass
class Review:
    """Review information"""
    reviewer: str  # AccountId
    rating: int  # 1-5
    comment: str
    timestamp: int


@dataclass
class RegisterProfessionalParams:
    """Parameters for registering as a professional"""
    role: ProfessionalRole
    metadata_uri: str
    stake_amount: str


@dataclass
class SubmitReviewParams:
    """Parameters for submitting a review"""
    professional: str
    rating: int
    comment: str


# ============================================================================
# Arbitration Types
# ============================================================================

@dataclass
class Dispute:
    """Dispute information"""
    dispute_id: str
    claimant: str  # AccountId
    defendant: str  # AccountId
    description: str
    evidence_uri: str
    status: DisputeStatus
    created_at: int  # Timestamp
    voting_ends_at: int  # Timestamp
    votes_for_claimant: str  # Balance as string
    votes_for_defendant: str  # Balance as string
    resolution: Optional[VoteChoice]
    can_appeal: bool


@dataclass
class Arbitrator:
    """Arbitrator information"""
    account: str  # AccountId
    stake: str  # Balance as string
    disputes_participated: int
    disputes_resolved: int
    reputation: int
    is_active: bool


@dataclass
class CreateDisputeParams:
    """Parameters for creating a dispute"""
    defendant: str
    description: str
    evidence_uri: str


@dataclass
class VoteParams:
    """Parameters for voting on a dispute"""
    dispute_id: str
    choice: VoteChoice


# ============================================================================
# Contract Result
# ============================================================================

@dataclass
class ContractResult:
    """Result from a contract call"""
    success: bool
    data: Optional[any] = None
    error: Optional[str] = None
    gas_consumed: Optional[int] = None
    storage_deposit: Optional[str] = None
