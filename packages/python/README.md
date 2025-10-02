# GLIN SDK - Python

Official Python SDK for the GLIN AI Training Network.

## Installation

```bash
pip install glin-sdk
```

## Quick Start

### Blockchain Client

```python
from glin_sdk import GlinClient

# Connect to GLIN network
client = GlinClient("wss://rpc.glin.ai")
client.connect()

# Get account balance
balance = client.get_balance("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
print(f"Balance: {balance.free} GLIN")

# Get task details
task = client.get_task("task_123")
if task:
    print(f"Task bounty: {task.bounty}")

# Disconnect
client.disconnect()
```

### Context Manager

```python
from glin_sdk import GlinClient

with GlinClient("wss://rpc.glin.ai") as client:
    balance = client.get_balance("5GrwvaEF...")
    print(f"Balance: {balance.free}")
```

### Authentication (Backend)

```python
from glin_sdk import GlinAuth

# Verify signature from frontend
address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
message = "Sign in to MyApp..."
signature = "0x..."

is_valid = GlinAuth.verify_signature(address, message, signature)

if is_valid:
    # Create user session
    print(f"User {address} authenticated successfully")
```

## API Reference

### GlinClient

- `connect()` - Connect to blockchain
- `disconnect()` - Disconnect from blockchain
- `get_balance(address: str) -> Balance` - Get account balance
- `get_task(task_id: str) -> ChainTask` - Get task details
- `get_provider(address: str) -> ChainProvider` - Get provider details
- `get_block_number() -> int` - Get current block number

### GlinAuth

- `verify_signature(address, message, signature) -> bool` - Verify signature
- `generate_auth_message(app_name) -> str` - Generate auth message
- `create_account(address, name) -> GlinAccount` - Create account object

## Development

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Format code
black glin_sdk/
```

## License

Apache-2.0
