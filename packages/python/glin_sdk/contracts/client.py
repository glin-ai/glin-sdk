"""Main contracts client for GLIN smart contracts"""

from typing import Optional
from substrateinterface import SubstrateInterface, Keypair, ContractInstance


class GlinContracts:
    """
    Main entry point for interacting with GLIN smart contracts

    Example:
        >>> from glin_sdk.contracts import GlinContracts
        >>>
        >>> contracts = GlinContracts(
        ...     substrate=substrate_interface,
        ...     escrow_address="5Escrow...",
        ...     registry_address="5Registry...",
        ...     arbitration_address="5Arbitration..."
        ... )
        >>>
        >>> # Create escrow agreement
        >>> agreement_id = await contracts.escrow.create_agreement(
        ...     provider="5Provider...",
        ...     milestone_descriptions=["Design", "Development"],
        ...     milestone_amounts=["500000000000000000000", "1500000000000000000000"],
        ...     milestone_deadlines=[1234567890, 1234567890],
        ...     dispute_timeout=1234567890,
        ...     value="2000000000000000000000"
        ... )
    """

    def __init__(
        self,
        substrate: SubstrateInterface,
        keypair: Optional[Keypair] = None,
        escrow_address: Optional[str] = None,
        registry_address: Optional[str] = None,
        arbitration_address: Optional[str] = None
    ):
        """
        Initialize contracts client

        Args:
            substrate: Connected SubstrateInterface instance
            keypair: Keypair for signing transactions (optional)
            escrow_address: GenericEscrow contract address
            registry_address: ProfessionalRegistry contract address
            arbitration_address: ArbitrationDAO contract address
        """
        self.substrate = substrate
        self.keypair = keypair

        # Import contract classes here to avoid circular imports
        from .escrow import EscrowContract
        from .registry import RegistryContract
        from .arbitration import ArbitrationContract

        # Initialize contract wrappers
        self.escrow = EscrowContract(
            substrate=substrate,
            contract_address=escrow_address,
            keypair=keypair
        )

        self.registry = RegistryContract(
            substrate=substrate,
            contract_address=registry_address,
            keypair=keypair
        )

        self.arbitration = ArbitrationContract(
            substrate=substrate,
            contract_address=arbitration_address,
            keypair=keypair
        )

    def set_keypair(self, keypair: Keypair) -> None:
        """
        Update the keypair for all contracts

        Args:
            keypair: New keypair for signing transactions
        """
        self.keypair = keypair
        self.escrow.set_keypair(keypair)
        self.registry.set_keypair(keypair)
        self.arbitration.set_keypair(keypair)

    async def is_contract(self, address: str) -> bool:
        """
        Check if an address is a valid contract

        Args:
            address: Contract address to check

        Returns:
            True if address is a contract, False otherwise
        """
        try:
            result = self.substrate.query("Contracts", "ContractInfoOf", [address])
            return result.value is not None
        except Exception:
            return False

    async def get_contract_balance(self, address: str) -> str:
        """
        Get the balance of a contract

        Args:
            address: Contract address

        Returns:
            Balance as string
        """
        result = self.substrate.query("System", "Account", [address])
        return str(result.value["data"]["free"])
