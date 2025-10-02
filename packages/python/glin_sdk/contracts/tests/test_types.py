"""
Unit tests for contract types
"""

import pytest
from glin_sdk.contracts.types import (
    MilestoneStatus,
    ProfessionalRole,
    DisputeStatus,
    VoteChoice,
    CreateAgreementParams,
    Milestone,
    Agreement,
    ProfessionalProfile,
    Dispute,
)


class TestMilestoneStatus:
    """Tests for MilestoneStatus enum"""

    def test_enum_values(self):
        """Test that MilestoneStatus has correct enum values"""
        assert MilestoneStatus.PENDING.value == "Pending"
        assert MilestoneStatus.COMPLETED.value == "Completed"
        assert MilestoneStatus.DISPUTED.value == "Disputed"
        assert MilestoneStatus.RESOLVED.value == "Resolved"
        assert MilestoneStatus.CANCELLED.value == "Cancelled"

    def test_enum_members(self):
        """Test that all expected enum members exist"""
        statuses = [e.value for e in MilestoneStatus]
        assert "Pending" in statuses
        assert "Completed" in statuses
        assert "Disputed" in statuses
        assert "Resolved" in statuses
        assert "Cancelled" in statuses


class TestProfessionalRole:
    """Tests for ProfessionalRole enum"""

    def test_enum_values(self):
        """Test that ProfessionalRole has correct enum values"""
        assert ProfessionalRole.LAWYER.value == "Lawyer"
        assert ProfessionalRole.DOCTOR.value == "Doctor"
        assert ProfessionalRole.ARBITRATOR.value == "Arbitrator"
        assert ProfessionalRole.NOTARY.value == "Notary"
        assert ProfessionalRole.AUDITOR.value == "Auditor"
        assert ProfessionalRole.CONSULTANT_OTHER.value == "ConsultantOther"

    def test_enum_members(self):
        """Test that all expected enum members exist"""
        roles = [e.value for e in ProfessionalRole]
        assert len(roles) == 6
        assert "Lawyer" in roles
        assert "Doctor" in roles


class TestDisputeStatus:
    """Tests for DisputeStatus enum"""

    def test_enum_values(self):
        """Test that DisputeStatus has correct enum values"""
        assert DisputeStatus.OPEN.value == "Open"
        assert DisputeStatus.VOTING.value == "Voting"
        assert DisputeStatus.RESOLVED.value == "Resolved"
        assert DisputeStatus.APPEALED.value == "Appealed"
        assert DisputeStatus.CANCELLED.value == "Cancelled"


class TestVoteChoice:
    """Tests for VoteChoice enum"""

    def test_enum_values(self):
        """Test that VoteChoice has correct enum values"""
        assert VoteChoice.IN_FAVOR_OF_CLAIMANT.value == "InFavorOfClaimant"
        assert VoteChoice.IN_FAVOR_OF_DEFENDANT.value == "InFavorOfDefendant"


class TestTypeConversions:
    """Tests for type conversions and formatting"""

    def test_balance_to_int(self):
        """Test converting balance string to int"""
        balance = "1000000000000000000000"  # 1000 GLIN
        int_balance = int(balance)
        assert int_balance == 1000000000000000000000

    def test_timestamp_conversion(self):
        """Test timestamp is integer"""
        import time
        timestamp = int(time.time() * 1000)
        assert isinstance(timestamp, int)
        assert timestamp > 0

    def test_glin_token_decimals(self):
        """Test GLIN token decimal calculations"""
        amount = 100  # 100 GLIN
        decimals = 18
        wei = amount * (10 ** decimals)
        assert wei == 100000000000000000000

        # Convert back
        glin_amount = wei / (10 ** decimals)
        assert glin_amount == 100.0


class TestDataClasses:
    """Tests for dataclass structures"""

    def test_create_agreement_params(self):
        """Test CreateAgreementParams dataclass"""
        params = CreateAgreementParams(
            provider="5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
            milestone_descriptions=["Milestone 1", "Milestone 2"],
            milestone_amounts=["1000000000000000000000", "2000000000000000000000"],
            milestone_deadlines=[1700000000000, 1700086400000],
            dispute_timeout=1700172800000,
            oracle=None,
            value="3000000000000000000000"
        )

        assert params.provider == "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
        assert len(params.milestone_descriptions) == 2
        assert len(params.milestone_amounts) == 2
        assert params.oracle is None
        assert params.value == "3000000000000000000000"

    def test_milestone_dataclass(self):
        """Test Milestone dataclass"""
        milestone = Milestone(
            description="Complete design phase",
            amount="1000000000000000000000",
            deadline=1700000000000,
            completed=False,
            status=MilestoneStatus.PENDING
        )

        assert milestone.description == "Complete design phase"
        assert milestone.amount == "1000000000000000000000"
        assert milestone.completed is False
        assert milestone.status == MilestoneStatus.PENDING

    def test_agreement_dataclass(self):
        """Test Agreement dataclass"""
        agreement = Agreement(
            agreement_id=0,
            client="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
            provider="5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
            total_amount="5000000000000000000000",
            is_active=True,
            dispute_timeout=1700172800000,
            oracle=None
        )

        assert agreement.agreement_id == 0
        assert agreement.is_active is True
        assert agreement.oracle is None

    def test_professional_profile_dataclass(self):
        """Test ProfessionalProfile dataclass"""
        profile = ProfessionalProfile(
            account="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
            role=ProfessionalRole.LAWYER,
            metadata_uri="ipfs://QmTest",
            stake_amount="100000000000000000000",
            is_active=True,
            reputation=100,
            total_jobs=0,
            registration_time=1700000000000
        )

        assert profile.role == ProfessionalRole.LAWYER
        assert profile.is_active is True
        assert profile.reputation == 100
        assert profile.total_jobs == 0

    def test_dispute_dataclass(self):
        """Test Dispute dataclass"""
        dispute = Dispute(
            dispute_id=0,
            claimant="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
            defendant="5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
            description="Service not delivered",
            evidence_uri="ipfs://QmEvidence",
            status=DisputeStatus.OPEN,
            created_at=1700000000000,
            voting_ends_at=None,
            resolution=None,
            can_appeal=False,
            appeal_count=0
        )

        assert dispute.dispute_id == 0
        assert dispute.status == DisputeStatus.OPEN
        assert dispute.resolution is None
        assert dispute.can_appeal is False
        assert dispute.appeal_count == 0


class TestBalanceFormatting:
    """Tests for balance formatting and conversion"""

    def test_format_balance_to_glin(self):
        """Test converting wei balance to GLIN"""
        wei_balance = "5000000000000000000000"
        glin = int(wei_balance) / (10 ** 18)
        assert glin == 5000.0

    def test_format_glin_to_wei(self):
        """Test converting GLIN to wei"""
        glin_amount = 1000
        wei = str(glin_amount * (10 ** 18))
        assert wei == "1000000000000000000000"

    def test_small_amounts(self):
        """Test handling small amounts"""
        # 0.001 GLIN
        wei = "1000000000000000"
        glin = int(wei) / (10 ** 18)
        assert glin == 0.001

    def test_large_amounts(self):
        """Test handling large amounts"""
        # 1 million GLIN
        glin = 1_000_000
        wei = glin * (10 ** 18)
        assert wei == 1_000_000_000_000_000_000_000_000
