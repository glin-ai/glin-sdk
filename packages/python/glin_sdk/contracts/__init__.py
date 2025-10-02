"""
GLIN Smart Contracts Module

Provides Python interfaces for interacting with GLIN smart contracts:
- GenericEscrow: Milestone-based payments
- ProfessionalRegistry: Reputation system
- ArbitrationDAO: Dispute resolution
"""

from .client import GlinContracts
from .escrow import EscrowContract
from .registry import RegistryContract
from .arbitration import ArbitrationContract

from .types import (
    # Enums
    MilestoneStatus,
    ProfessionalRole,
    DisputeStatus,
    VoteChoice,
    # Escrow types
    Milestone,
    Agreement,
    CreateAgreementParams,
    # Registry types
    ProfessionalProfile,
    Review,
    RegisterProfessionalParams,
    SubmitReviewParams,
    # Arbitration types
    Dispute,
    Arbitrator,
    CreateDisputeParams,
    VoteParams,
    # Common types
    ContractResult,
)

__all__ = [
    # Main client
    "GlinContracts",
    # Contract wrappers
    "EscrowContract",
    "RegistryContract",
    "ArbitrationContract",
    # Enums
    "MilestoneStatus",
    "ProfessionalRole",
    "DisputeStatus",
    "VoteChoice",
    # Escrow types
    "Milestone",
    "Agreement",
    "CreateAgreementParams",
    # Registry types
    "ProfessionalProfile",
    "Review",
    "RegisterProfessionalParams",
    "SubmitReviewParams",
    # Arbitration types
    "Dispute",
    "Arbitrator",
    "CreateDisputeParams",
    "VoteParams",
    # Common types
    "ContractResult",
]
