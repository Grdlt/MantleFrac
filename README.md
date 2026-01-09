# MantleFrac: RWA Fractionalization Platform on Mantle

> Transform any NFT or RWA into tradeable shares - A complete DeFi platform for Real World Asset tokenization on Mantle Network

[![Mantle](https://img.shields.io/badge/Mantle-Network-blue)](https://mantle.xyz)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636)](https://soliditylang.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)

**MantleFrac** is a production-ready RWA (Real World Assets) fractionalization platform built on Mantle Network.

🏆 Built for **Mantle Global Hackathon 2025** - RWA/RealFi Track

## 🎯 Problem Statement

Real World Assets (RWAs) like real estate, art, and collectibles are traditionally illiquid and inaccessible to average investors. MantleFrac solves this by:

1. **Fractionalizing** high-value assets into tradeable ERC-20 tokens
2. **Enabling liquidity** through built-in marketplace and AMM
3. **Distributing revenue** proportionally to all token holders
4. **Ensuring compliance** with optional KYC/whitelist controls

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Vault System** | Create fractionalized vaults from any ERC-721 NFT |
| **Share Tokens** | Standard ERC-20 tokens with transfer mode controls (Open/Allowlist/Paused) |
| **Marketplace** | P2P trading with atomic swaps and fee collection |
| **AMM Pools** | Constant product (x*y=k) liquidity pools with LP tokens |
| **Distributions** | Snapshot-based revenue sharing to token holders |
| **RWA Compliance** | Optional KYC verification and whitelist support |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ ConnectBtn  │  │ VaultPage   │  │ MarketplacePage     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Smart Contracts (Solidity)                │
│  ┌───────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │MantleFracVault│  │ Marketplace │  │ConstantProduct  │   │
│  │               │  │             │  │     AMM         │   │
│  └───────────────┘  └─────────────┘  └─────────────────┘   │
│  ┌───────────────┐  ┌─────────────┐                        │
│  │VaultShareToken│  │ Distributor │                        │
│  │   (ERC-20)    │  │             │                        │
│  └───────────────┘  └─────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Mantle Network                           │
│            Low Gas • High Throughput • EVM Compatible        │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Foundry (for smart contracts)

### Installation

```powershell
# Clone the repository
git clone https://github.com/your-repo/mantlefrac.git
cd mantlefrac

# Install frontend dependencies
pnpm install

# Install Foundry dependencies
cd contracts
forge install
```

### Build & Test

```powershell
# Build contracts
cd contracts
forge build

# Run all tests
forge test -vvv

# Run specific test
forge test --match-contract MantleFracVaultTest -vvv
```

### Deploy to Mantle Testnet

```powershell
# Set environment variables
$env:PRIVATE_KEY = "your_private_key"

# Deploy
forge script script/Deploy.s.sol:DeployTestnet --rpc-url https://rpc.sepolia.mantle.xyz --broadcast
```

## 📋 Smart Contracts

| Contract | Description |
|----------|-------------|
| `MantleFracVault.sol` | Core vault management, NFT custody, share token deployment |
| `VaultShareToken.sol` | ERC-20 share token with transfer modes and max supply |
| `Marketplace.sol` | P2P listings with atomic swaps and fee collection |
| `ConstantProductAMM.sol` | x*y=k AMM with LP tokens |
| `Distributor.sol` | Snapshot-based dividend distribution |

## 🌐 Network Configuration

| Network | Chain ID | RPC URL | Explorer |
|---------|----------|---------|----------|
| Mantle Sepolia | 5003 | https://rpc.sepolia.mantle.xyz | https://explorer.sepolia.mantle.xyz |
| Mantle Mainnet | 5000 | https://rpc.mantle.xyz | https://explorer.mantle.xyz |

## 📁 Project Structure

```
MantleFrac/
├── contracts/              # Solidity smart contracts (Foundry)
│   ├── src/               # Contract source files
│   ├── test/              # Foundry tests
│   └── script/            # Deployment scripts
├── services/              # Backend microservices
│   ├── indexer-evm/       # EVM event indexer
│   └── api/               # GraphQL API
├── web/                   # Next.js frontend
│   ├── src/lib/           # Wagmi config, ABIs, chains
│   ├── src/hooks/         # Contract interaction hooks
│   └── src/components/    # React components
└── docs/                  # Documentation
```

## 🔧 Tech Stack

- **Smart Contracts**: Solidity 0.8.20, OpenZeppelin, Foundry
- **Frontend**: Next.js 15, React 19, wagmi, viem, TailwindCSS
- **Backend**: Node.js, TypeScript, ScyllaDB
- **Infrastructure**: Docker, Prometheus, Grafana

## 🛡️ Security

- Comprehensive test coverage with property-based fuzzing
- OpenZeppelin battle-tested contracts
- Transfer mode controls for compliance
- Atomic swap execution

## 📄 License

MIT

## 🤝 Team

Built with ❤️ for Mantle Global Hackathon 2025
