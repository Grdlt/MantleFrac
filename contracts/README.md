# MantleFrac Smart Contracts

Solidity smart contracts for the MantleFrac RWA fractionalization platform on Mantle Network.

## Overview

MantleFrac enables fractionalization of NFTs and RWA (Real World Assets) into tradeable ERC-20 share tokens.

## Contracts

| Contract | Description |
|----------|-------------|
| `MantleFracVault.sol` | Core vault management for NFT custody and fractionalization |
| `VaultShareToken.sol` | ERC-20 share tokens with transfer mode controls |
| `Marketplace.sol` | P2P marketplace for trading share tokens |
| `ConstantProductAMM.sol` | AMM liquidity pools (x * y = k) |
| `Distributor.sol` | Dividend/revenue distribution to share holders |

## Development

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### Install Dependencies

```bash
# Install Foundry (if not installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std
```

### Build

```bash
forge build
```

### Test

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test test_ERC20_transfer

# Run fuzz tests with more runs
forge test --fuzz-runs 1000
```

### Deploy

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export MANTLE_TESTNET_RPC_URL=https://rpc.sepolia.mantle.xyz

# Deploy to Mantle Testnet
forge script script/Deploy.s.sol --rpc-url $MANTLE_TESTNET_RPC_URL --broadcast --verify

# Deploy to Mantle Mainnet
export MANTLE_MAINNET_RPC_URL=https://rpc.mantle.xyz
forge script script/Deploy.s.sol --rpc-url $MANTLE_MAINNET_RPC_URL --broadcast --verify
```

### Verify Contracts

```bash
forge verify-contract <CONTRACT_ADDRESS> src/VaultShareToken.sol:VaultShareToken \
  --chain-id 5003 \
  --verifier-url https://explorer.sepolia.mantle.xyz/api \
  --constructor-args $(cast abi-encode "constructor(string,string,bytes32,uint256,address)" "Name" "SYM" 0x... 1000000 0x...)
```

## Network Configuration

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Mantle Testnet | 5003 | https://rpc.sepolia.mantle.xyz |
| Mantle Mainnet | 5000 | https://rpc.mantle.xyz |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MantleFracVault                         │
│  - Creates vaults from NFTs                                 │
│  - Deploys VaultShareToken for each vault                   │
│  - Manages custody and redemption                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    VaultShareToken (ERC-20)                 │
│  - Fractional ownership tokens                              │
│  - Transfer mode controls (open/allowlist/paused)           │
│  - Max supply enforcement                                   │
└───────────────────────���─────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Marketplace   │ │ConstantProduct  │ │   Distributor   │
│                 │ │      AMM        │ │                 │
│ - Create/fill   │ │ - Liquidity     │ │ - Schedule      │
│   listings      │ │   pools         │ │   distributions │
│ - Fee routing   │ │ - Swaps         │ │ - Claim payouts │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## License

MIT
