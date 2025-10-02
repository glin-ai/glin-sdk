"""Authentication module for GLIN SDK"""

from datetime import datetime
from typing import Optional
from substrateinterface import Keypair
from .types import GlinAccount


class GlinAuth:
    """Authentication client for GLIN"""

    @staticmethod
    def verify_signature(address: str, message: str, signature: str) -> bool:
        """
        Verify a signature (typically used on backend)

        Args:
            address: Substrate address
            message: Original message that was signed
            signature: Hex signature

        Returns:
            True if signature is valid
        """
        try:
            keypair = Keypair(ss58_address=address)
            # Note: For production, use proper signature verification with sr25519
            # This is a simplified version
            return keypair.verify(message, signature)
        except Exception as e:
            print(f"Signature verification failed: {e}")
            return False

    @staticmethod
    def generate_auth_message(app_name: str = "GLIN Application") -> str:
        """
        Generate authentication message

        Args:
            app_name: Name of the application

        Returns:
            Authentication message to be signed
        """
        timestamp = datetime.utcnow().isoformat()
        return (
            f"Sign in to {app_name}\n\n"
            f"Timestamp: {timestamp}\n\n"
            "This signature will not trigger a blockchain transaction or cost any fees."
        )

    @staticmethod
    def create_account(address: str, name: Optional[str] = None) -> GlinAccount:
        """
        Create a GlinAccount instance

        Args:
            address: Substrate address
            name: Optional account name

        Returns:
            GlinAccount instance
        """
        return GlinAccount(address=address, name=name)
