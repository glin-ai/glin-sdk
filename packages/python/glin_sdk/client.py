"""Blockchain client for GLIN network"""

from typing import Optional
from substrateinterface import SubstrateInterface
from .types import Balance, ChainTask, ChainProvider


class GlinClient:
    """Client for interacting with GLIN blockchain"""

    def __init__(self, rpc_url: str = "wss://rpc.glin.ai"):
        self.rpc_url = rpc_url
        self.substrate: Optional[SubstrateInterface] = None

    def connect(self):
        """Connect to GLIN blockchain"""
        if not self.substrate:
            self.substrate = SubstrateInterface(url=self.rpc_url)

    def disconnect(self):
        """Disconnect from blockchain"""
        if self.substrate:
            self.substrate.close()
            self.substrate = None

    def get_balance(self, address: str) -> Balance:
        """Get account balance"""
        self._ensure_connected()

        result = self.substrate.query("System", "Account", [address])
        data = result.value["data"]

        return Balance(
            free=str(data["free"]),
            reserved=str(data["reserved"]),
            frozen=str(data.get("frozen", data.get("miscFrozen", 0))),
            total=str(data["free"] + data["reserved"])
        )

    def get_task(self, task_id: str) -> Optional[ChainTask]:
        """Get task details"""
        self._ensure_connected()

        try:
            result = self.substrate.query("TaskRegistry", "Tasks", [task_id])

            if result.value is None:
                return None

            task_data = result.value

            return ChainTask(
                id=task_id,
                creator=str(task_data["creator"]),
                bounty=str(task_data["bounty"]),
                min_providers=int(task_data["minProviders"]),
                max_providers=int(task_data["maxProviders"]),
                ipfs_hash=str(task_data["ipfsHash"]),
                status=str(task_data["status"])
            )
        except Exception as e:
            print(f"Error fetching task: {e}")
            return None

    def get_provider(self, address: str) -> Optional[ChainProvider]:
        """Get provider details"""
        self._ensure_connected()

        try:
            result = self.substrate.query("ProviderStaking", "Providers", [address])

            if result.value is None:
                return None

            provider_data = result.value

            return ChainProvider(
                account=address,
                stake=str(provider_data["stake"]),
                reputation_score=int(provider_data["reputationScore"]),
                hardware_tier=str(provider_data["hardwareTier"]),
                status=str(provider_data["status"]),
                is_slashed=bool(provider_data["isSlashed"])
            )
        except Exception as e:
            print(f"Error fetching provider: {e}")
            return None

    def get_block_number(self) -> int:
        """Get current block number"""
        self._ensure_connected()
        header = self.substrate.get_block_header()
        return header["header"]["number"]

    def _ensure_connected(self):
        """Ensure client is connected"""
        if not self.substrate:
            self.connect()

    def __enter__(self):
        """Context manager entry"""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.disconnect()
