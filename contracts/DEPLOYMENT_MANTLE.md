# MantleFrac Deployment Guide

## Deployment Status ✅

### Mantle Sepolia Testnet (chainId: 5003)

| Contract | Address | TX Hash | Block |
|----------|---------|---------|-------|
| MantleFracVault | `0xCc59F6FC768612659BEB827c0345c65F1C7ABe17` | `0xe821bb96...` | 33153271 |
| Marketplace | `0x751dC26E9d66aC60B29D395a11C96523ACd94487` | `0x2bff8d81...` | 33153274 |
| ConstantProductAMM | `0x293fA675B73931a20F30b0c68A18d3cd39cF9Af0` | `0x10ba3ad1...` | 33153276 |
| Distributor | `0x7E871dfEBAEC9E3e9f2458E5B5Fd90F3283356cD` | `0xf26535e0...` | 33153279 |

**Total Gas Paid:** 0.4189685635542 MNT

**Explorer Links:**
- [MantleFracVault](https://explorer.sepolia.mantle.xyz/address/0xCc59F6FC768612659BEB827c0345c65F1C7ABe17)
- [Marketplace](https://explorer.sepolia.mantle.xyz/address/0x751dC26E9d66aC60B29D395a11C96523ACd94487)
- [ConstantProductAMM](https://explorer.sepolia.mantle.xyz/address/0x293fA675B73931a20F30b0c68A18d3cd39cF9Af0)
- [Distributor](https://explorer.sepolia.mantle.xyz/address/0x7E871dfEBAEC9E3e9f2458E5B5Fd90F3283356cD)

## Prerequisites

1. Install Foundry: https://book.getfoundry.sh/getting-started/installation
2. Get MNT tokens for gas on Mantle Sepolia Testnet
   - Faucet: https://faucet.sepolia.mantle.xyz/

## Setup

### 1. Install Dependencies

```powershell
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```powershell
copy .env.example .env
```

Edit `.env`:
```
PRIVATE_KEY=your_private_key_here
MANTLE_TESTNET_RPC=https://rpc.sepolia.mantle.xyz
MANTLE_MAINNET_RPC=https://rpc.mantle.xyz
ETHERSCAN_API_KEY=your_api_key_for_verification
```

### 3. Load Environment Variables

```powershell
# In PowerShell
$env:PRIVATE_KEY = "your_private_key"
$env:RPC_URL = "https://rpc.sepolia.mantle.xyz"
```

## Deployment

### Deploy to Mantle Sepolia Testnet

```powershell
forge script script/Deploy.s.sol:DeployTestnet --rpc-url https://rpc.sepolia.mantle.xyz --broadcast --verify
```

### Deploy to Mantle Mainnet

```powershell
forge script script/Deploy.s.sol:Deploy --rpc-url https://rpc.mantle.xyz --broadcast --verify
```

## Verify Contracts

If automatic verification fails, verify manually:

```powershell
forge verify-contract <CONTRACT_ADDRESS> src/MantleFracVault.sol:MantleFracVault --chain-id 5003 --verifier blockscout --verifier-url https://explorer.sepolia.mantle.xyz/api
```

## Post-Deployment

### 1. Update Frontend Contract Addresses

Edit `web/src/lib/contracts.ts` with deployed addresses:

```typescript
export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  [MANTLE_TESTNET_CHAIN_ID]: {
    mantleFracVault: '0x...',  // Your deployed address
    marketplace: '0x...',
    constantProductAMM: '0x...',
    distributor: '0x...',
  },
};
```

### 2. Update Indexer Configuration

Edit `services/indexer-evm/.env`:

```
VAULT_ADDRESS=0x...
MARKETPLACE_ADDRESS=0x...
AMM_ADDRESS=0x...
DISTRIBUTOR_ADDRESS=0x...
```

## Network Information

### Mantle Sepolia Testnet
- Chain ID: 5003
- RPC: https://rpc.sepolia.mantle.xyz
- Explorer: https://explorer.sepolia.mantle.xyz
- Faucet: https://faucet.sepolia.mantle.xyz

### Mantle Mainnet
- Chain ID: 5000
- RPC: https://rpc.mantle.xyz
- Explorer: https://explorer.mantle.xyz

## Testing

Run all tests before deployment:

```powershell
cd contracts
forge test -vvv
```

Run specific test file:

```powershell
forge test --match-path test/MantleFracVault.t.sol -vvv
```

## Gas Estimation

Estimate deployment gas:

```powershell
forge script script/Deploy.s.sol:DeployTestnet --rpc-url https://rpc.sepolia.mantle.xyz
```

## Troubleshooting

### "Insufficient funds"
Get testnet MNT from the faucet: https://faucet.sepolia.mantle.xyz

### "Contract verification failed"
Try manual verification with Blockscout API or use the Mantle Explorer UI.

### "Nonce too low"
Wait for pending transactions or reset nonce in your wallet.
