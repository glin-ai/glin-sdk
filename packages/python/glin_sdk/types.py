"""Type definitions for GLIN SDK"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class GlinAccount:
    """GLIN account representation"""
    address: str
    name: Optional[str] = None


@dataclass
class Balance:
    """Account balance"""
    free: str
    reserved: str
    frozen: str
    total: str


@dataclass
class ChainTask:
    """On-chain task representation"""
    id: str
    creator: str
    bounty: str
    min_providers: int
    max_providers: int
    ipfs_hash: str
    status: str


@dataclass
class ChainProvider:
    """On-chain provider representation"""
    account: str
    stake: str
    reputation_score: int
    hardware_tier: str
    status: str
    is_slashed: bool
