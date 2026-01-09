# MantleFrac - Mantle Global Hackathon 2025 Submission

## 🏆 Track: RWA/RealFi

## 📋 Project Summary

**MantleFrac** is a complete RWA (Real World Assets) fractionalization platform built on Mantle Network. It enables users to:

1. **Fractionalize** any ERC-721 NFT into tradeable ERC-20 share tokens
2. **Trade** shares through a built-in P2P marketplace with atomic swaps
3. **Provide liquidity** via constant product AMM pools
4. **Receive dividends** through snapshot-based revenue distribution

## 🎯 Problem Solved

Real World Assets like real estate, art, and collectibles are traditionally:
- **Illiquid** - Hard to buy/sell quickly
- **Inaccessible** - High minimum investment requirements
- **Non-divisible** - Cannot own partial shares

MantleFrac solves these problems by tokenizing RWAs on Mantle Network, enabling fractional ownership with instant liquidity.

## ✨ Key Features

| Feature | Implementation |
|---------|---------------|
| **Vault System** | `MantleFracVault.sol` - NFT custody with share token deployment |
| **Share Tokens** | `VaultShareToken.sol` - ERC-20 with transfer modes (Open/Allowlist/Paused) |
| **Marketplace** | `Marketplace.sol` - P2P listings with atomic swaps, 2.5% fee |
| **AMM** | `ConstantProductAMM.sol` - x*y=k pools with LP tokens, 0.3% swap fee |
| **Distributions** | `Distributor.sol` - Snapshot-based dividend claims |

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Smart Contracts (Solidity 0.8.24)         │
├─────────────────────────────────────────────────────────────┤
│  MantleFracVault    │  Marketplace    │  ConstantProductAMM │
│  VaultShareToken    │  Distributor    │                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Mantle Network                           │
│         Chain ID: 5003 (Testnet) / 5000 (Mainnet)           │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Test Results

All **72 tests** pass with comprehensive coverage:

| Test Suite | Tests | Status |
|------------|-------|--------|
| VaultShareToken | 25 | ✅ Pass |
| MantleFracVault | 14 | ✅ Pass |
| Marketplace | 10 | ✅ Pass |
| ConstantProductAMM | 12 | ✅ Pass |
| Distributor | 11 | ✅ Pass |

Includes property-based fuzzing tests for:
- MaxSupply enforcement
- Transfer mode enforcement
- AMM constant product invariant
- Proportional payout distribution

## 🔧 Tech Stack

- **Smart Contracts**: Solidity 0.8.24, OpenZeppelin 5.x, Foundry
- **Frontend**: Next.js 15, React 19, wagmi v2, viem
- **Backend**: Node.js, TypeScript, ScyllaDB, GraphQL

## 📁 Repository Structure

```
contracts/
├── src/
│   ├── MantleFracVault.sol      # Core vault contract
│   ├── VaultShareToken.sol      # ERC-20 share token
│   ├── Marketplace.sol          # P2P marketplace
│   ├── ConstantProductAMM.sol   # AMM liquidity pools
│   └── Distributor.sol          # Revenue distribution
├── test/                        # Foundry tests (72 tests)
└── script/Deploy.s.sol          # Deployment script

web/src/
├── lib/chains.ts                # Mantle chain config
├── lib/contracts.ts             # Contract addresses
├── hooks/contracts/             # React hooks for contracts
└── components/ConnectButton.tsx # Wallet connection

services/
├── indexer-evm/                 # EVM event indexer
└── api-evm/                     # GraphQL API
```

## 🚀 How to Run

```powershell
# Clone and install
git clone <repo>
cd contracts

# Install dependencies
forge install

# Run tests
forge test -vvv

# Deploy to Mantle Testnet
$env:PRIVATE_KEY = "your_key"
forge script script/Deploy.s.sol:DeployTestnet --rpc-url https://rpc.sepolia.mantle.xyz --broadcast
```

## 🌟 Why Mantle?

1. **Low Gas Costs** - Affordable for RWA transactions
2. **EVM Compatibility** - Easy migration from other chains
3. **High Throughput** - Supports active trading
4. **Growing Ecosystem** - Strong DeFi infrastructure

## 📄 Contract Interfaces

### Create Vault
```solidity
function createVault(
    address nftContract,
    uint256 tokenId,
    string memory shareSymbol,
    string memory shareName,
    uint256 maxSupply
) external returns (bytes32 vaultId);
```

### Create Listing
```solidity
function createListing(
    bytes32 vaultId,
    uint256 shareAmount,
    address priceAsset,
    uint256 priceAmount,
    uint256 expiry
) external returns (uint256 listingId);
```

### Add Liquidity
```solidity
function addLiquidity(
    bytes32 poolId,
    uint256 amountA,
    uint256 amountB,
    uint256 minLpOut
) external returns (uint256 lpMinted);
```

## 🔗 Links

- **GitHub**: [Repository URL]
- **Demo Video**: [Video URL]

### Deployed Contracts (Mantle Sepolia Testnet)

| Contract | Address | Explorer |
|----------|---------|----------|
| MantleFracVault | `0xCc59F6FC768612659BEB827c0345c65F1C7ABe17` | [View](https://explorer.sepolia.mantle.xyz/address/0xCc59F6FC768612659BEB827c0345c65F1C7ABe17) |
| Marketplace | `0x751dC26E9d66aC60B29D395a11C96523ACd94487` | [View](https://explorer.sepolia.mantle.xyz/address/0x751dC26E9d66aC60B29D395a11C96523ACd94487) |
| ConstantProductAMM | `0x293fA675B73931a20F30b0c68A18d3cd39cF9Af0` | [View](https://explorer.sepolia.mantle.xyz/address/0x293fA675B73931a20F30b0c68A18d3cd39cF9Af0) |
| Distributor | `0x7E871dfEBAEC9E3e9f2458E5B5Fd90F3283356cD` | [View](https://explorer.sepolia.mantle.xyz/address/0x7E871dfEBAEC9E3e9f2458E5B5Fd90F3283356cD) |

**Deployment Block**: 33153271-33153279
**Total Gas Paid**: 0.4189685635542 MNT

## 👥 Team

Built for Mantle Global Hackathon 2025

---

*MantleFrac - Democratizing RWA Investment on Mantle Network*
