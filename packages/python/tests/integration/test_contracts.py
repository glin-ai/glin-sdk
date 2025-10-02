"""
Integration tests for GLIN contracts

Prerequisites:
- Local GLIN node running (ws://localhost:9944)
- Contracts deployed (GenericEscrow, ProfessionalRegistry, ArbitrationDAO)
- Set contract addresses in environment variables:
  - ESCROW_ADDRESS
  - REGISTRY_ADDRESS
  - ARBITRATION_ADDRESS

Run: pytest tests/integration/test_contracts.py
"""

import os
import pytest
import time
from substrateinterface import SubstrateInterface, Keypair
from glin_sdk.contracts import (
    GlinContracts,
    MilestoneStatus,
    ProfessionalRole,
    VoteChoice,
    CreateAgreementParams,
)


RPC_URL = os.getenv("RPC_URL", "ws://localhost:9944")
ESCROW_ADDRESS = os.getenv("ESCROW_ADDRESS", "")
REGISTRY_ADDRESS = os.getenv("REGISTRY_ADDRESS", "")
ARBITRATION_ADDRESS = os.getenv("ARBITRATION_ADDRESS", "")


@pytest.fixture(scope="module")
async def substrate():
    """Create SubstrateInterface connection"""
    substrate = SubstrateInterface(url=RPC_URL)
    yield substrate
    substrate.close()


@pytest.fixture(scope="module")
def alice():
    """Create Alice test account"""
    return Keypair.create_from_uri("//Alice")


@pytest.fixture(scope="module")
def bob():
    """Create Bob test account"""
    return Keypair.create_from_uri("//Bob")


@pytest.fixture(scope="module")
def contracts(substrate, alice):
    """Create GlinContracts instance"""
    return GlinContracts(
        substrate=substrate,
        keypair=alice,
        escrow_address=ESCROW_ADDRESS,
        registry_address=REGISTRY_ADDRESS,
        arbitration_address=ARBITRATION_ADDRESS,
    )


@pytest.mark.skipif(not ESCROW_ADDRESS, reason="ESCROW_ADDRESS not set")
class TestGenericEscrow:
    """Integration tests for GenericEscrow contract"""

    @pytest.mark.asyncio
    async def test_create_agreement(self, contracts, bob):
        """Test creating an escrow agreement"""
        # Calculate timestamps (in milliseconds)
        now = int(time.time() * 1000)
        one_day = 86400000

        params = CreateAgreementParams(
            provider=bob.ss58_address,
            milestone_descriptions=["Test milestone"],
            milestone_amounts=["1000000000000000000000"],  # 1000 GLIN
            milestone_deadlines=[now + one_day],
            dispute_timeout=now + (3 * one_day),
            value="1000000000000000000000"
        )

        result = await contracts.escrow.create_agreement(params)

        assert result["success"] is True
        assert "data" in result

    @pytest.mark.asyncio
    async def test_query_agreement(self, contracts):
        """Test querying agreement details"""
        agreement = await contracts.escrow.get_agreement(0)

        if agreement:
            assert agreement.agreement_id == 0
            assert agreement.is_active is True
            assert len(agreement.client) > 0
            assert len(agreement.provider) > 0

    @pytest.mark.asyncio
    async def test_get_milestone_count(self, contracts):
        """Test getting milestone count"""
        count = await contracts.escrow.get_milestone_count(0)
        assert count >= 0

    @pytest.mark.asyncio
    async def test_get_milestone(self, contracts):
        """Test getting milestone details"""
        milestone = await contracts.escrow.get_milestone(0, 0)

        if milestone:
            assert len(milestone.description) > 0
            assert int(milestone.amount) > 0
            assert milestone.status in [s for s in MilestoneStatus]


@pytest.mark.skipif(not REGISTRY_ADDRESS, reason="REGISTRY_ADDRESS not set")
class TestProfessionalRegistry:
    """Integration tests for ProfessionalRegistry contract"""

    @pytest.mark.asyncio
    async def test_register_professional(self, contracts):
        """Test registering as professional"""
        result = await contracts.registry.register(
            role=ProfessionalRole.LAWYER,
            metadata_uri="ipfs://test",
            stake_amount="100000000000000000000"  # 100 GLIN
        )

        assert result["success"] is True

    @pytest.mark.asyncio
    async def test_query_profile(self, contracts, alice):
        """Test querying professional profile"""
        profile = await contracts.registry.get_profile(alice.ss58_address)

        if profile:
            assert profile.account == alice.ss58_address
            assert profile.role == ProfessionalRole.LAWYER
            assert profile.is_active is True
            assert int(profile.stake_amount) > 0

    @pytest.mark.asyncio
    async def test_get_min_stake(self, contracts):
        """Test checking minimum stake requirement"""
        min_stake = await contracts.registry.get_min_stake(ProfessionalRole.LAWYER)
        assert int(min_stake) > 0

    @pytest.mark.asyncio
    async def test_is_registered(self, contracts, alice):
        """Test checking if account is registered"""
        is_registered = await contracts.registry.is_registered(alice.ss58_address)
        assert isinstance(is_registered, bool)


@pytest.mark.skipif(not ARBITRATION_ADDRESS, reason="ARBITRATION_ADDRESS not set")
class TestArbitrationDAO:
    """Integration tests for ArbitrationDAO contract"""

    @pytest.mark.asyncio
    async def test_register_arbitrator(self, contracts):
        """Test registering as arbitrator"""
        result = await contracts.arbitration.register_arbitrator(
            stake_amount="200000000000000000000"  # 200 GLIN
        )

        assert result["success"] is True

    @pytest.mark.asyncio
    async def test_create_dispute(self, contracts, bob):
        """Test creating a dispute"""
        result = await contracts.arbitration.create_dispute(
            defendant=bob.ss58_address,
            description="Test dispute",
            evidence_uri="ipfs://evidence"
        )

        assert result["success"] is True

    @pytest.mark.asyncio
    async def test_query_arbitrator(self, contracts, alice):
        """Test querying arbitrator info"""
        arbitrator = await contracts.arbitration.get_arbitrator(alice.ss58_address)

        if arbitrator:
            assert arbitrator.account == alice.ss58_address
            assert arbitrator.is_active is True
            assert int(arbitrator.stake) > 0

    @pytest.mark.asyncio
    async def test_get_dispute(self, contracts):
        """Test getting dispute details"""
        dispute = await contracts.arbitration.get_dispute(0)

        if dispute:
            assert dispute.dispute_id == 0
            assert len(dispute.claimant) > 0
            assert len(dispute.defendant) > 0
            assert len(dispute.description) > 0

    @pytest.mark.asyncio
    async def test_get_min_arbitrator_stake(self, contracts):
        """Test getting minimum arbitrator stake"""
        min_stake = await contracts.arbitration.get_min_arbitrator_stake()
        assert int(min_stake) > 0


@pytest.mark.skipif(not ESCROW_ADDRESS, reason="Contract addresses not set")
class TestContractUtilities:
    """Integration tests for contract utility methods"""

    @pytest.mark.asyncio
    async def test_is_contract(self, contracts):
        """Test checking if address is a contract"""
        if ESCROW_ADDRESS:
            is_contract = await contracts.is_contract(ESCROW_ADDRESS)
            assert is_contract is True

    @pytest.mark.asyncio
    async def test_get_contract_balance(self, contracts):
        """Test getting contract balance"""
        if ESCROW_ADDRESS:
            balance = await contracts.get_contract_balance(ESCROW_ADDRESS)
            assert int(balance) >= 0

    @pytest.mark.asyncio
    async def test_get_contract_info(self, contracts):
        """Test getting contract info"""
        if ESCROW_ADDRESS:
            info = await contracts.get_contract_info(ESCROW_ADDRESS)
            assert info is not None
            assert info["address"] == ESCROW_ADDRESS
            assert "code_hash" in info or "storage_deposit" in info


@pytest.mark.skipif(not ESCROW_ADDRESS, reason="Contract addresses not set")
class TestCompleteWorkflow:
    """Integration tests for complete contract workflows"""

    @pytest.mark.asyncio
    async def test_escrow_workflow(self, contracts, alice, bob):
        """Test complete escrow workflow"""
        # 1. Create agreement
        now = int(time.time() * 1000)
        params = CreateAgreementParams(
            provider=bob.ss58_address,
            milestone_descriptions=["Design", "Development"],
            milestone_amounts=["1000000000000000000000", "2000000000000000000000"],
            milestone_deadlines=[now + 86400000, now + 172800000],
            dispute_timeout=now + 259200000,
            value="3000000000000000000000"
        )

        create_result = await contracts.escrow.create_agreement(params)
        assert create_result["success"] is True

        agreement_id = create_result.get("data", 0)

        # 2. Query agreement
        agreement = await contracts.escrow.get_agreement(agreement_id)
        assert agreement is not None
        assert agreement.client == alice.ss58_address
        assert agreement.provider == bob.ss58_address

        # 3. Get milestone count
        count = await contracts.escrow.get_milestone_count(agreement_id)
        assert count == 2

        # 4. Get first milestone
        milestone = await contracts.escrow.get_milestone(agreement_id, 0)
        assert milestone is not None
        assert milestone.description == "Design"
        assert milestone.status == MilestoneStatus.PENDING

    @pytest.mark.asyncio
    async def test_registry_workflow(self, contracts, alice, bob):
        """Test complete registry workflow"""
        # 1. Check minimum stake
        min_stake = await contracts.registry.get_min_stake(ProfessionalRole.DOCTOR)
        assert int(min_stake) > 0

        # 2. Register professional
        register_result = await contracts.registry.register(
            role=ProfessionalRole.DOCTOR,
            metadata_uri="ipfs://profile",
            stake_amount="150000000000000000000"
        )
        assert register_result["success"] is True

        # 3. Query profile
        profile = await contracts.registry.get_profile(alice.ss58_address)
        if profile:
            assert profile.role == ProfessionalRole.DOCTOR
            assert profile.is_active is True

        # 4. Check if registered
        is_registered = await contracts.registry.is_registered(alice.ss58_address)
        assert is_registered is True

    @pytest.mark.asyncio
    async def test_arbitration_workflow(self, contracts, alice, bob):
        """Test complete arbitration workflow"""
        # 1. Register as arbitrator
        register_result = await contracts.arbitration.register_arbitrator(
            stake_amount="250000000000000000000"
        )
        assert register_result["success"] is True

        # 2. Check arbitrator info
        arbitrator = await contracts.arbitration.get_arbitrator(alice.ss58_address)
        if arbitrator:
            assert arbitrator.is_active is True
            assert int(arbitrator.stake) >= 250000000000000000000

        # 3. Create dispute
        dispute_result = await contracts.arbitration.create_dispute(
            defendant=bob.ss58_address,
            description="Payment dispute",
            evidence_uri="ipfs://dispute-evidence"
        )
        assert dispute_result["success"] is True

        dispute_id = dispute_result.get("data", 0)

        # 4. Query dispute
        dispute = await contracts.arbitration.get_dispute(dispute_id)
        if dispute:
            assert dispute.claimant == alice.ss58_address
            assert dispute.defendant == bob.ss58_address
            assert dispute.description == "Payment dispute"
