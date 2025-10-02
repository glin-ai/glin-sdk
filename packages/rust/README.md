# GLIN SDK - Rust

Official Rust SDK for the GLIN AI Training Network.

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
glin-sdk = "0.1"
tokio = { version = "1", features = ["full"] }
```

## Quick Start

### Blockchain Client

```rust
use glin_sdk::GlinClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Connect to GLIN network
    let client = GlinClient::new("wss://rpc.glin.ai").await?;

    // Get account balance
    let balance = client.get_balance("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY").await?;
    println!("Balance: {} GLIN", balance.free);

    // Get current block number
    let block_number = client.get_block_number().await?;
    println!("Current block: {}", block_number);

    Ok(())
}
```

### Authentication (Backend)

```rust
use glin_sdk::GlinAuth;

fn verify_user(address: &str, message: &str, signature: &str) -> bool {
    // Verify signature from frontend
    let is_valid = GlinAuth::verify_signature(address, message, signature);

    if is_valid {
        // Create user session
        println!("User {} authenticated successfully", address);
    }

    is_valid
}

fn main() {
    let address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
    let message = GlinAuth::generate_auth_message("MyApp");
    let signature = "0x...";

    verify_user(address, &message, signature);
}
```

## API Reference

### GlinClient

- `new(rpc_url: &str) -> Result<GlinClient>` - Create new client
- `get_balance(address: &str) -> Result<Balance>` - Get account balance
- `get_block_number() -> Result<u32>` - Get current block number
- `subxt_client() -> &OnlineClient<PolkadotConfig>` - Get underlying subxt client

### GlinAuth

- `verify_signature(address, message, signature) -> bool` - Verify signature
- `generate_auth_message(app_name) -> String` - Generate auth message

## Features

- **Type-safe**: Built on subxt for compile-time guarantees
- **Async**: Uses Tokio for async/await support
- **Lightweight**: Minimal dependencies
- **Production-ready**: Based on battle-tested Substrate libraries

## Development

```bash
# Build
cargo build

# Run tests
cargo test

# Build documentation
cargo doc --open
```

## License

Apache-2.0
