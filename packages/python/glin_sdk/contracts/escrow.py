"""GenericEscrow contract wrapper"""

from typing import Optional, List
from substrateinterface import SubstrateInterface, Keypair, ContractInstance, ContractCode
from .types import (
    Agreement,
    Milestone,
    MilestoneStatus,
    CreateAgreementParams,
    ContractResult
)


class EscrowContract:
    """
    Wrapper for GenericEscrow smart contract interactions

    Provides methods to interact with the GenericEscrow contract
    for milestone-based payment escrow with dispute resolution.
    """

    def __init__(
        self,
        substrate: SubstrateInterface,
        contract_address: Optional[str] = None,
        keypair: Optional[Keypair] = None
    ):
        """
        Initialize escrow contract wrapper

        Args:
            substrate: Connected SubstrateInterface instance
            contract_address: GenericEscrow contract address
            keypair: Keypair for signing transactions
        """
        self.substrate = substrate
        self.contract_address = contract_address
        self.keypair = keypair
        self.contract: Optional[ContractInstance] = None

        if contract_address:
            self._load_contract(contract_address)

    def _load_contract(self, address: str) -> None:
        """Load contract instance with metadata"""
        # In production, load metadata from file or URL
        # For now, we'll handle contract calls manually
        self.contract_address = address

    def set_contract_address(self, address: str) -> None:
        """Set or update contract address"""
        self.contract_address = address
        self._load_contract(address)

    def set_keypair(self, keypair: Keypair) -> None:
        """Update the keypair for transactions"""
        self.keypair = keypair

    async def create_agreement(
        self,
        params: CreateAgreementParams,
        gas_limit: Optional[int] = None
    ) -> ContractResult:
        """
        Create a new escrow agreement

        Args:
            params: Agreement parameters
            gas_limit: Optional gas limit override

        Returns:
            ContractResult with agreement_id on success

        Example:
            >>> params = CreateAgreementParams(
            ...     provider="5Provider...",
            ...     milestone_descriptions=["Design", "Development"],
            ...     milestone_amounts=["500000000000000000000", "1500000000000000000000"],
            ...     milestone_deadlines=[1234567890, 1234567890],
            ...     dispute_timeout=1234567890,
            ...     value="2000000000000000000000"
            ... )
            >>> result = await escrow.create_agreement(params)
        """
        if not self.contract_address:
            return ContractResult(success=False, error="Contract not initialized")
        if not self.keypair:
            return ContractResult(success=False, error="Keypair not set")

        try:
            # Build contract call
            call = self.substrate.compose_call(
                call_module='Contracts',
                call_function='call',
                call_params={
                    'dest': self.contract_address,
                    'value': int(params.value),
                    'gas_limit': {'ref_time': gas_limit or 100_000_000_000, 'proof_size': 100_000},
                    'storage_deposit_limit': None,
                    'data': self._encode_call(
                        'create_agreement',
                        params.provider,
                        params.milestone_descriptions,
                        params.milestone_amounts,
                        params.milestone_deadlines,
                        params.dispute_timeout,
                        params.oracle
                    )
                }
            )

            # Create and submit extrinsic
            extrinsic = self.substrate.create_signed_extrinsic(
                call=call,
                keypair=self.keypair
            )

            receipt = self.substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)

            if receipt.is_success:
                # Extract agreement_id from events
                agreement_id = self._extract_agreement_id(receipt)
                return ContractResult(success=True, data=agreement_id)
            else:
                return ContractResult(success=False, error="Transaction failed")

        except Exception as e:
            return ContractResult(success=False, error=str(e))

    async def complete_milestone(
        self,
        agreement_id: str,
        milestone_index: int,
        gas_limit: Optional[int] = None
    ) -> ContractResult:
        """
        Mark a milestone as completed (by provider)

        Args:
            agreement_id: Agreement ID
            milestone_index: Index of the milestone
            gas_limit: Optional gas limit override

        Returns:
            ContractResult
        """
        if not self.contract_address:
            return ContractResult(success=False, error="Contract not initialized")
        if not self.keypair:
            return ContractResult(success=False, error="Keypair not set")

        try:
            call = self.substrate.compose_call(
                call_module='Contracts',
                call_function='call',
                call_params={
                    'dest': self.contract_address,
                    'value': 0,
                    'gas_limit': {'ref_time': gas_limit or 50_000_000_000, 'proof_size': 50_000},
                    'storage_deposit_limit': None,
                    'data': self._encode_call('complete_milestone', agreement_id, milestone_index)
                }
            )

            extrinsic = self.substrate.create_signed_extrinsic(call=call, keypair=self.keypair)
            receipt = self.substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)

            return ContractResult(success=receipt.is_success, error=None if receipt.is_success else "Transaction failed")

        except Exception as e:
            return ContractResult(success=False, error=str(e))

    async def approve_and_release(
        self,
        agreement_id: str,
        milestone_index: int,
        gas_limit: Optional[int] = None
    ) -> ContractResult:
        """
        Approve milestone and release funds (by client or oracle)

        Args:
            agreement_id: Agreement ID
            milestone_index: Index of the milestone
            gas_limit: Optional gas limit override

        Returns:
            ContractResult
        """
        if not self.contract_address:
            return ContractResult(success=False, error="Contract not initialized")
        if not self.keypair:
            return ContractResult(success=False, error="Keypair not set")

        try:
            call = self.substrate.compose_call(
                call_module='Contracts',
                call_function='call',
                call_params={
                    'dest': self.contract_address,
                    'value': 0,
                    'gas_limit': {'ref_time': gas_limit or 50_000_000_000, 'proof_size': 50_000},
                    'storage_deposit_limit': None,
                    'data': self._encode_call('approve_and_release', agreement_id, milestone_index)
                }
            )

            extrinsic = self.substrate.create_signed_extrinsic(call=call, keypair=self.keypair)
            receipt = self.substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)

            return ContractResult(success=receipt.is_success, error=None if receipt.is_success else "Transaction failed")

        except Exception as e:
            return ContractResult(success=False, error=str(e))

    async def raise_dispute(
        self,
        agreement_id: str,
        milestone_index: int,
        gas_limit: Optional[int] = None
    ) -> ContractResult:
        """
        Raise a dispute for a milestone

        Args:
            agreement_id: Agreement ID
            milestone_index: Index of the milestone
            gas_limit: Optional gas limit override

        Returns:
            ContractResult
        """
        if not self.contract_address:
            return ContractResult(success=False, error="Contract not initialized")
        if not self.keypair:
            return ContractResult(success=False, error="Keypair not set")

        try:
            call = self.substrate.compose_call(
                call_module='Contracts',
                call_function='call',
                call_params={
                    'dest': self.contract_address,
                    'value': 0,
                    'gas_limit': {'ref_time': gas_limit or 50_000_000_000, 'proof_size': 50_000},
                    'storage_deposit_limit': None,
                    'data': self._encode_call('raise_dispute', agreement_id, milestone_index)
                }
            )

            extrinsic = self.substrate.create_signed_extrinsic(call=call, keypair=self.keypair)
            receipt = self.substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)

            return ContractResult(success=receipt.is_success, error=None if receipt.is_success else "Transaction failed")

        except Exception as e:
            return ContractResult(success=False, error=str(e))

    async def resolve_dispute(
        self,
        agreement_id: str,
        milestone_index: int,
        release_to_provider: bool,
        gas_limit: Optional[int] = None
    ) -> ContractResult:
        """
        Resolve a dispute (by oracle or after timeout)

        Args:
            agreement_id: Agreement ID
            milestone_index: Index of the milestone
            release_to_provider: Whether to release funds to provider
            gas_limit: Optional gas limit override

        Returns:
            ContractResult
        """
        if not self.contract_address:
            return ContractResult(success=False, error="Contract not initialized")
        if not self.keypair:
            return ContractResult(success=False, error="Keypair not set")

        try:
            call = self.substrate.compose_call(
                call_module='Contracts',
                call_function='call',
                call_params={
                    'dest': self.contract_address,
                    'value': 0,
                    'gas_limit': {'ref_time': gas_limit or 50_000_000_000, 'proof_size': 50_000},
                    'storage_deposit_limit': None,
                    'data': self._encode_call('resolve_dispute', agreement_id, milestone_index, release_to_provider)
                }
            )

            extrinsic = self.substrate.create_signed_extrinsic(call=call, keypair=self.keypair)
            receipt = self.substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)

            return ContractResult(success=receipt.is_success, error=None if receipt.is_success else "Transaction failed")

        except Exception as e:
            return ContractResult(success=False, error=str(e))

    async def get_agreement(self, agreement_id: str) -> Optional[Agreement]:
        """
        Get agreement details

        Args:
            agreement_id: Agreement ID

        Returns:
            Agreement object or None if not found
        """
        if not self.contract_address:
            return None

        try:
            # Query contract storage
            # In production, use proper contract query mechanism
            # This is a simplified version
            return None  # Would implement with proper metadata
        except Exception as e:
            print(f"Error getting agreement: {e}")
            return None

    async def get_milestone(
        self,
        agreement_id: str,
        milestone_index: int
    ) -> Optional[Milestone]:
        """
        Get milestone details

        Args:
            agreement_id: Agreement ID
            milestone_index: Index of the milestone

        Returns:
            Milestone object or None if not found
        """
        if not self.contract_address:
            return None

        try:
            # Query contract storage
            return None  # Would implement with proper metadata
        except Exception as e:
            print(f"Error getting milestone: {e}")
            return None

    async def get_milestone_count(self, agreement_id: str) -> int:
        """
        Get milestone count for an agreement

        Args:
            agreement_id: Agreement ID

        Returns:
            Number of milestones
        """
        if not self.contract_address:
            return 0

        try:
            # Query contract storage
            return 0  # Would implement with proper metadata
        except Exception as e:
            print(f"Error getting milestone count: {e}")
            return 0

    def _encode_call(self, method: str, *args) -> bytes:
        """
        Encode contract call data

        In production, this would use the contract metadata to properly encode the call.
        For now, returns a placeholder.
        """
        # TODO: Implement proper encoding using contract metadata
        return b''

    def _extract_agreement_id(self, receipt) -> Optional[str]:
        """Extract agreement ID from transaction receipt events"""
        # TODO: Implement event parsing
        return None
