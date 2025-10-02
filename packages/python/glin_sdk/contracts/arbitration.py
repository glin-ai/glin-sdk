"""ArbitrationDAO contract wrapper"""

from typing import Optional
from substrateinterface import SubstrateInterface, Keypair, ContractInstance
from .types import (
    Dispute,
    Arbitrator,
    CreateDisputeParams,
    VoteParams,
    VoteChoice,
    DisputeStatus,
    ContractResult
)


class ArbitrationContract:
    """
    Wrapper for ArbitrationDAO smart contract interactions

    Provides methods to interact with the ArbitrationDAO contract
    for decentralized dispute resolution through stake-weighted voting.
    """

    def __init__(
        self,
        substrate: SubstrateInterface,
        contract_address: Optional[str] = None,
        keypair: Optional[Keypair] = None
    ):
        """
        Initialize arbitration contract wrapper

        Args:
            substrate: Connected SubstrateInterface instance
            contract_address: ArbitrationDAO contract address
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
        self.contract_address = address

    def set_contract_address(self, address: str) -> None:
        """Set or update contract address"""
        self.contract_address = address
        self._load_contract(address)

    def set_keypair(self, keypair: Keypair) -> None:
        """Update the keypair for transactions"""
        self.keypair = keypair

    async def register_arbitrator(
        self,
        stake_amount: str,
        gas_limit: Optional[int] = None
    ) -> ContractResult:
        """
        Register as an arbitrator

        Args:
            stake_amount: Stake amount as string
            gas_limit: Optional gas limit override

        Returns:
            ContractResult

        Example:
            >>> result = await arbitration.register_arbitrator("200000000000000000000")
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
                    'value': int(stake_amount),
                    'gas_limit': {'ref_time': gas_limit or 50_000_000_000, 'proof_size': 50_000},
                    'storage_deposit_limit': None,
                    'data': self._encode_call('register_arbitrator')
                }
            )

            extrinsic = self.substrate.create_signed_extrinsic(call=call, keypair=self.keypair)
            receipt = self.substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)

            return ContractResult(success=receipt.is_success, error=None if receipt.is_success else "Transaction failed")

        except Exception as e:
            return ContractResult(success=False, error=str(e))

    async def increase_arbitrator_stake(
        self,
        additional_stake: str,
        gas_limit: Optional[int] = None
    ) -> ContractResult:
        """
        Increase arbitrator stake

        Args:
            additional_stake: Additional stake amount as string
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
                    'value': int(additional_stake),
                    'gas_limit': {'ref_time': gas_limit or 30_000_000_000, 'proof_size': 30_000},
                    'storage_deposit_limit': None,
                    'data': self._encode_call('increase_arbitrator_stake')
                }
            )

            extrinsic = self.substrate.create_signed_extrinsic(call=call, keypair=self.keypair)
            receipt = self.substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)

            return ContractResult(success=receipt.is_success, error=None if receipt.is_success else "Transaction failed")

        except Exception as e:
            return ContractResult(success=False, error=str(e))

    async def create_dispute(
        self,
        params: CreateDisputeParams,
        gas_limit: Optional[int] = None
    ) -> ContractResult:
        """
        Create a new dispute

        Args:
            params: Dispute parameters
            gas_limit: Optional gas limit override

        Returns:
            ContractResult with dispute_id on success

        Example:
            >>> params = CreateDisputeParams(
            ...     defendant="5Defendant...",
            ...     description="Contract not fulfilled",
            ...     evidence_uri="ipfs://evidence"
            ... )
            >>> result = await arbitration.create_dispute(params)
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
                    'gas_limit': {'ref_time': gas_limit or 60_000_000_000, 'proof_size': 60_000},
                    'storage_deposit_limit': None,
                    'data': self._encode_call('create_dispute', params.defendant, params.description, params.evidence_uri)
                }
            )

            extrinsic = self.substrate.create_signed_extrinsic(call=call, keypair=self.keypair)
            receipt = self.substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)

            if receipt.is_success:
                dispute_id = self._extract_dispute_id(receipt)
                return ContractResult(success=True, data=dispute_id)
            else:
                return ContractResult(success=False, error="Transaction failed")

        except Exception as e:
            return ContractResult(success=False, error=str(e))

    async def start_voting(
        self,
        dispute_id: str,
        gas_limit: Optional[int] = None
    ) -> ContractResult:
        """
        Start voting period for a dispute

        Args:
            dispute_id: Dispute ID
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
                    'gas_limit': {'ref_time': gas_limit or 40_000_000_000, 'proof_size': 40_000},
                    'storage_deposit_limit': None,
                    'data': self._encode_call('start_voting', dispute_id)
                }
            )

            extrinsic = self.substrate.create_signed_extrinsic(call=call, keypair=self.keypair)
            receipt = self.substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)

            return ContractResult(success=receipt.is_success, error=None if receipt.is_success else "Transaction failed")

        except Exception as e:
            return ContractResult(success=False, error=str(e))

    async def vote(
        self,
        params: VoteParams,
        gas_limit: Optional[int] = None
    ) -> ContractResult:
        """
        Cast a vote on a dispute

        Args:
            params: Vote parameters
            gas_limit: Optional gas limit override

        Returns:
            ContractResult

        Example:
            >>> params = VoteParams(
            ...     dispute_id="0",
            ...     choice=VoteChoice.IN_FAVOR_OF_CLAIMANT
            ... )
            >>> result = await arbitration.vote(params)
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
                    'data': self._encode_call('vote', params.dispute_id, params.choice.value)
                }
            )

            extrinsic = self.substrate.create_signed_extrinsic(call=call, keypair=self.keypair)
            receipt = self.substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)

            return ContractResult(success=receipt.is_success, error=None if receipt.is_success else "Transaction failed")

        except Exception as e:
            return ContractResult(success=False, error=str(e))

    async def finalize_dispute(
        self,
        dispute_id: str,
        gas_limit: Optional[int] = None
    ) -> ContractResult:
        """
        Finalize a dispute after voting period

        Args:
            dispute_id: Dispute ID
            gas_limit: Optional gas limit override

        Returns:
            ContractResult with resolution on success
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
                    'data': self._encode_call('finalize_dispute', dispute_id)
                }
            )

            extrinsic = self.substrate.create_signed_extrinsic(call=call, keypair=self.keypair)
            receipt = self.substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)

            if receipt.is_success:
                resolution = self._extract_resolution(receipt)
                return ContractResult(success=True, data=resolution)
            else:
                return ContractResult(success=False, error="Transaction failed")

        except Exception as e:
            return ContractResult(success=False, error=str(e))

    async def appeal_dispute(
        self,
        dispute_id: str,
        gas_limit: Optional[int] = None
    ) -> ContractResult:
        """
        Appeal a dispute decision

        Args:
            dispute_id: Dispute ID
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
                    'data': self._encode_call('appeal_dispute', dispute_id)
                }
            )

            extrinsic = self.substrate.create_signed_extrinsic(call=call, keypair=self.keypair)
            receipt = self.substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)

            return ContractResult(success=receipt.is_success, error=None if receipt.is_success else "Transaction failed")

        except Exception as e:
            return ContractResult(success=False, error=str(e))

    async def get_dispute(self, dispute_id: str) -> Optional[Dispute]:
        """
        Get dispute details

        Args:
            dispute_id: Dispute ID

        Returns:
            Dispute or None if not found
        """
        if not self.contract_address:
            return None

        try:
            # Query contract storage
            return None
        except Exception as e:
            print(f"Error getting dispute: {e}")
            return None

    async def get_arbitrator(self, account: str) -> Optional[Arbitrator]:
        """
        Get arbitrator information

        Args:
            account: Account address

        Returns:
            Arbitrator or None if not found
        """
        if not self.contract_address:
            return None

        try:
            # Query contract storage
            return None
        except Exception as e:
            print(f"Error getting arbitrator: {e}")
            return None

    async def get_vote(
        self,
        dispute_id: str,
        arbitrator: str
    ) -> Optional[VoteChoice]:
        """
        Get vote for a specific arbitrator on a dispute

        Args:
            dispute_id: Dispute ID
            arbitrator: Arbitrator account address

        Returns:
            VoteChoice or None if not found
        """
        if not self.contract_address:
            return None

        try:
            # Query contract storage
            return None
        except Exception as e:
            print(f"Error getting vote: {e}")
            return None

    async def is_active_arbitrator(self, account: str) -> bool:
        """
        Check if account is an active arbitrator

        Args:
            account: Account address

        Returns:
            True if active arbitrator, False otherwise
        """
        if not self.contract_address:
            return False

        try:
            # Query contract storage
            return False
        except Exception as e:
            print(f"Error checking active arbitrator: {e}")
            return False

    def _encode_call(self, method: str, *args) -> bytes:
        """Encode contract call data"""
        # TODO: Implement proper encoding using contract metadata
        return b''

    def _extract_dispute_id(self, receipt) -> Optional[str]:
        """Extract dispute ID from transaction receipt events"""
        # TODO: Implement event parsing
        return None

    def _extract_resolution(self, receipt) -> Optional[VoteChoice]:
        """Extract resolution from transaction receipt events"""
        # TODO: Implement event parsing
        return None
