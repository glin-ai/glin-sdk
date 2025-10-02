"""ProfessionalRegistry contract wrapper"""

from typing import Optional, List
from substrateinterface import SubstrateInterface, Keypair, ContractInstance
from .types import (
    ProfessionalProfile,
    ProfessionalRole,
    Review,
    RegisterProfessionalParams,
    SubmitReviewParams,
    ContractResult
)


class RegistryContract:
    """
    Wrapper for ProfessionalRegistry smart contract interactions

    Provides methods to interact with the ProfessionalRegistry contract
    for professional registration, reputation management, and reviews.
    """

    def __init__(
        self,
        substrate: SubstrateInterface,
        contract_address: Optional[str] = None,
        keypair: Optional[Keypair] = None
    ):
        """
        Initialize registry contract wrapper

        Args:
            substrate: Connected SubstrateInterface instance
            contract_address: ProfessionalRegistry contract address
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

    async def register(
        self,
        params: RegisterProfessionalParams,
        gas_limit: Optional[int] = None
    ) -> ContractResult:
        """
        Register as a professional

        Args:
            params: Registration parameters
            gas_limit: Optional gas limit override

        Returns:
            ContractResult

        Example:
            >>> params = RegisterProfessionalParams(
            ...     role=ProfessionalRole.LAWYER,
            ...     metadata_uri="ipfs://metadata",
            ...     stake_amount="100000000000000000000"
            ... )
            >>> result = await registry.register(params)
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
                    'value': int(params.stake_amount),
                    'gas_limit': {'ref_time': gas_limit or 50_000_000_000, 'proof_size': 50_000},
                    'storage_deposit_limit': None,
                    'data': self._encode_call('register', params.role.value, params.metadata_uri)
                }
            )

            extrinsic = self.substrate.create_signed_extrinsic(call=call, keypair=self.keypair)
            receipt = self.substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)

            return ContractResult(success=receipt.is_success, error=None if receipt.is_success else "Transaction failed")

        except Exception as e:
            return ContractResult(success=False, error=str(e))

    async def increase_stake(
        self,
        additional_stake: str,
        gas_limit: Optional[int] = None
    ) -> ContractResult:
        """
        Increase stake amount

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
                    'data': self._encode_call('increase_stake')
                }
            )

            extrinsic = self.substrate.create_signed_extrinsic(call=call, keypair=self.keypair)
            receipt = self.substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)

            return ContractResult(success=receipt.is_success, error=None if receipt.is_success else "Transaction failed")

        except Exception as e:
            return ContractResult(success=False, error=str(e))

    async def submit_review(
        self,
        params: SubmitReviewParams,
        gas_limit: Optional[int] = None
    ) -> ContractResult:
        """
        Submit a review for a professional

        Args:
            params: Review parameters
            gas_limit: Optional gas limit override

        Returns:
            ContractResult

        Example:
            >>> params = SubmitReviewParams(
            ...     professional="5Professional...",
            ...     rating=5,
            ...     comment="Excellent service!"
            ... )
            >>> result = await registry.submit_review(params)
        """
        if not self.contract_address:
            return ContractResult(success=False, error="Contract not initialized")
        if not self.keypair:
            return ContractResult(success=False, error="Keypair not set")

        if params.rating < 1 or params.rating > 5:
            return ContractResult(success=False, error="Rating must be between 1 and 5")

        try:
            call = self.substrate.compose_call(
                call_module='Contracts',
                call_function='call',
                call_params={
                    'dest': self.contract_address,
                    'value': 0,
                    'gas_limit': {'ref_time': gas_limit or 50_000_000_000, 'proof_size': 50_000},
                    'storage_deposit_limit': None,
                    'data': self._encode_call('submit_review', params.professional, params.rating, params.comment)
                }
            )

            extrinsic = self.substrate.create_signed_extrinsic(call=call, keypair=self.keypair)
            receipt = self.substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)

            return ContractResult(success=receipt.is_success, error=None if receipt.is_success else "Transaction failed")

        except Exception as e:
            return ContractResult(success=False, error=str(e))

    async def withdraw_stake(self, gas_limit: Optional[int] = None) -> ContractResult:
        """
        Withdraw stake (deactivates profile)

        Args:
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
                    'data': self._encode_call('withdraw_stake')
                }
            )

            extrinsic = self.substrate.create_signed_extrinsic(call=call, keypair=self.keypair)
            receipt = self.substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)

            return ContractResult(success=receipt.is_success, error=None if receipt.is_success else "Transaction failed")

        except Exception as e:
            return ContractResult(success=False, error=str(e))

    async def get_profile(self, account: str) -> Optional[ProfessionalProfile]:
        """
        Get professional profile

        Args:
            account: Account address

        Returns:
            ProfessionalProfile or None if not found
        """
        if not self.contract_address:
            return None

        try:
            # Query contract storage
            # Would implement with proper metadata
            return None
        except Exception as e:
            print(f"Error getting profile: {e}")
            return None

    async def get_review(
        self,
        professional: str,
        review_index: int
    ) -> Optional[Review]:
        """
        Get review by index

        Args:
            professional: Professional account address
            review_index: Review index

        Returns:
            Review or None if not found
        """
        if not self.contract_address:
            return None

        try:
            # Query contract storage
            return None
        except Exception as e:
            print(f"Error getting review: {e}")
            return None

    async def get_review_count(self, professional: str) -> int:
        """
        Get review count for a professional

        Args:
            professional: Professional account address

        Returns:
            Number of reviews
        """
        if not self.contract_address:
            return 0

        try:
            # Query contract storage
            return 0
        except Exception as e:
            print(f"Error getting review count: {e}")
            return 0

    async def get_min_stake(self, role: ProfessionalRole) -> str:
        """
        Get minimum stake required for a role

        Args:
            role: Professional role

        Returns:
            Minimum stake as string
        """
        if not self.contract_address:
            return "0"

        try:
            # Query contract storage
            return "0"
        except Exception as e:
            print(f"Error getting min stake: {e}")
            return "0"

    async def is_active_professional(self, account: str) -> bool:
        """
        Check if account is an active professional

        Args:
            account: Account address

        Returns:
            True if active professional, False otherwise
        """
        if not self.contract_address:
            return False

        try:
            # Query contract storage
            return False
        except Exception as e:
            print(f"Error checking active professional: {e}")
            return False

    async def get_all_reviews(self, professional: str) -> List[Review]:
        """
        Get all reviews for a professional (convenience method)

        Args:
            professional: Professional account address

        Returns:
            List of reviews
        """
        count = await self.get_review_count(professional)
        reviews: List[Review] = []

        for i in range(count):
            review = await self.get_review(professional, i)
            if review:
                reviews.append(review)

        return reviews

    def _encode_call(self, method: str, *args) -> bytes:
        """Encode contract call data"""
        # TODO: Implement proper encoding using contract metadata
        return b''
