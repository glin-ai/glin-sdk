"""
Unit tests for GlinContracts client
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from glin_sdk.contracts.client import GlinContracts
from glin_sdk.contracts.escrow import EscrowContract
from glin_sdk.contracts.registry import RegistryContract
from glin_sdk.contracts.arbitration import ArbitrationContract


@pytest.fixture
def mock_substrate():
    """Create a mock SubstrateInterface"""
    mock = Mock()
    mock.query = Mock()
    mock.compose_call = Mock()
    mock.create_signed_extrinsic = AsyncMock()
    mock.submit_extrinsic = AsyncMock()
    return mock


@pytest.fixture
def mock_keypair():
    """Create a mock Keypair"""
    keypair = Mock()
    keypair.ss58_address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
    return keypair


@pytest.fixture
def contracts_client(mock_substrate, mock_keypair):
    """Create GlinContracts instance with mocks"""
    return GlinContracts(
        substrate=mock_substrate,
        keypair=mock_keypair,
        escrow_address="5Escrow...",
        registry_address="5Registry...",
        arbitration_address="5Arbitration..."
    )


class TestGlinContractsConstructor:
    """Tests for GlinContracts constructor"""

    def test_initialize_with_all_contracts(self, mock_substrate, mock_keypair):
        """Test initialization with all contract addresses"""
        client = GlinContracts(
            substrate=mock_substrate,
            keypair=mock_keypair,
            escrow_address="5Escrow...",
            registry_address="5Registry...",
            arbitration_address="5Arbitration..."
        )

        assert client.substrate == mock_substrate
        assert client.keypair == mock_keypair
        assert isinstance(client.escrow, EscrowContract)
        assert isinstance(client.registry, RegistryContract)
        assert isinstance(client.arbitration, ArbitrationContract)

    def test_initialize_without_keypair(self, mock_substrate):
        """Test initialization without keypair (read-only mode)"""
        client = GlinContracts(
            substrate=mock_substrate,
            escrow_address="5Escrow..."
        )

        assert client.substrate == mock_substrate
        assert client.keypair is None
        assert client.escrow is not None

    def test_initialize_with_partial_contracts(self, mock_substrate, mock_keypair):
        """Test initialization with only some contract addresses"""
        client = GlinContracts(
            substrate=mock_substrate,
            keypair=mock_keypair,
            escrow_address="5Escrow..."
        )

        assert client.escrow is not None
        assert client.registry is None
        assert client.arbitration is None


class TestSetKeypair:
    """Tests for set_keypair method"""

    def test_set_keypair(self, contracts_client):
        """Test updating keypair"""
        new_keypair = Mock()
        new_keypair.ss58_address = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"

        contracts_client.set_keypair(new_keypair)

        assert contracts_client.keypair == new_keypair
        assert contracts_client.escrow.keypair == new_keypair
        assert contracts_client.registry.keypair == new_keypair
        assert contracts_client.arbitration.keypair == new_keypair

    def test_set_keypair_to_none(self, contracts_client):
        """Test setting keypair to None"""
        contracts_client.set_keypair(None)

        assert contracts_client.keypair is None
        assert contracts_client.escrow.keypair is None


class TestIsContract:
    """Tests for is_contract method"""

    @pytest.mark.asyncio
    async def test_is_contract_returns_true(self, contracts_client, mock_substrate):
        """Test is_contract returns True for valid contract"""
        mock_result = Mock()
        mock_result.value = {"some": "data"}
        mock_substrate.query.return_value = AsyncMock(return_value=mock_result)

        result = await contracts_client.is_contract("5Contract...")

        assert result is True

    @pytest.mark.asyncio
    async def test_is_contract_returns_false(self, contracts_client, mock_substrate):
        """Test is_contract returns False for non-contract address"""
        mock_substrate.query.return_value = AsyncMock(return_value=None)

        result = await contracts_client.is_contract("5NotContract...")

        assert result is False

    @pytest.mark.asyncio
    async def test_is_contract_handles_error(self, contracts_client, mock_substrate):
        """Test is_contract returns False on error"""
        mock_substrate.query.side_effect = Exception("Query failed")

        result = await contracts_client.is_contract("5Error...")

        assert result is False


class TestGetContractBalance:
    """Tests for get_contract_balance method"""

    @pytest.mark.asyncio
    async def test_get_contract_balance(self, contracts_client, mock_substrate):
        """Test getting contract balance"""
        mock_account = Mock()
        mock_account.value = {"data": {"free": 1000000000000000000000}}

        async def mock_query(*args, **kwargs):
            return mock_account

        mock_substrate.query = Mock(return_value=mock_query())

        balance = await contracts_client.get_contract_balance("5Contract...")

        assert balance == "1000000000000000000000"

    @pytest.mark.asyncio
    async def test_get_zero_balance(self, contracts_client, mock_substrate):
        """Test getting zero balance"""
        mock_account = Mock()
        mock_account.value = {"data": {"free": 0}}

        async def mock_query(*args, **kwargs):
            return mock_account

        mock_substrate.query = Mock(return_value=mock_query())

        balance = await contracts_client.get_contract_balance("5Contract...")

        assert balance == "0"

    @pytest.mark.asyncio
    async def test_get_balance_handles_error(self, contracts_client, mock_substrate):
        """Test balance query error handling"""
        mock_substrate.query.side_effect = Exception("Query failed")

        balance = await contracts_client.get_contract_balance("5Error...")

        assert balance == "0"


class TestGetContractInfo:
    """Tests for get_contract_info method"""

    @pytest.mark.asyncio
    async def test_get_contract_info_exists(self, contracts_client, mock_substrate):
        """Test getting contract info when contract exists"""
        mock_info = Mock()
        mock_info.value = {
            "code_hash": "0x123...",
            "storage_deposit": "1000000000000000000"
        }

        async def mock_query(*args, **kwargs):
            return mock_info

        mock_substrate.query = Mock(return_value=mock_query())

        info = await contracts_client.get_contract_info("5Contract...")

        assert info is not None
        assert info["address"] == "5Contract..."
        assert "code_hash" in info

    @pytest.mark.asyncio
    async def test_get_contract_info_not_exists(self, contracts_client, mock_substrate):
        """Test getting contract info when contract does not exist"""
        async def mock_query(*args, **kwargs):
            return None

        mock_substrate.query = Mock(return_value=mock_query())

        info = await contracts_client.get_contract_info("5NotContract...")

        assert info is None

    @pytest.mark.asyncio
    async def test_get_contract_info_handles_error(self, contracts_client, mock_substrate):
        """Test contract info query error handling"""
        mock_substrate.query.side_effect = Exception("Query failed")

        info = await contracts_client.get_contract_info("5Error...")

        assert info is None


class TestEstimateGas:
    """Tests for estimate_gas method"""

    @pytest.mark.asyncio
    async def test_estimate_gas_default(self, contracts_client):
        """Test gas estimation with default values"""
        gas = await contracts_client.estimate_gas(
            contract_address="5Contract...",
            method="test_method",
            args=[]
        )

        assert gas > 0
        assert gas == 100_000_000_000  # Default estimate

    @pytest.mark.asyncio
    async def test_estimate_gas_custom_limit(self, contracts_client):
        """Test gas estimation with custom limit"""
        custom_limit = 5000

        gas = await contracts_client.estimate_gas(
            contract_address="5Contract...",
            method="test_method",
            args=[],
            gas_limit=custom_limit
        )

        assert gas > 0


class TestContractIntegration:
    """Integration tests for contract interaction"""

    def test_all_contracts_use_same_substrate(self, contracts_client, mock_substrate):
        """Test that all contracts share the same substrate instance"""
        assert contracts_client.escrow.substrate == mock_substrate
        assert contracts_client.registry.substrate == mock_substrate
        assert contracts_client.arbitration.substrate == mock_substrate

    def test_all_contracts_use_same_keypair(self, contracts_client, mock_keypair):
        """Test that all contracts share the same keypair"""
        assert contracts_client.escrow.keypair == mock_keypair
        assert contracts_client.registry.keypair == mock_keypair
        assert contracts_client.arbitration.keypair == mock_keypair

    def test_keypair_update_propagates(self, contracts_client):
        """Test that updating keypair propagates to all contracts"""
        new_keypair = Mock()
        new_keypair.ss58_address = "5NewAddress..."

        contracts_client.set_keypair(new_keypair)

        assert contracts_client.escrow.keypair == new_keypair
        assert contracts_client.registry.keypair == new_keypair
        assert contracts_client.arbitration.keypair == new_keypair
