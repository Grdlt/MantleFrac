# MantleFrac: 基于 Mantle 的 RWA 碎片化平台

将任何 NFT 或 RWA 转化为可交易的份额 - Mantle 网络上完整的真实世界资产通证化 DeFi 平台

MantleFrac 是一个构建在 Mantle 网络上的生产级 RWA (Real World Assets) 碎片化平台。



## 问题陈述

房地产、艺术品和收藏品等真实世界资产 (RWA) 传统上流动性差，且普通投资者难以接触。MantleFrac 通过以下方式解决这一问题：

1. 将高价值资产碎片化为可交易的 ERC-20 代币
2. 通过内置市场和 AMM 提供流动性
3. 按比例向所有代币持有者分配收益
4. 通过可选的 KYC/白名单控制确保合规性

## 功能特性

| 功能 | 描述 |
|---------|-------------|
| 金库系统 | 从任何 ERC-721 NFT 创建碎片化金库 |
| 份额代币 | 具有传输模式控制 (开放/白名单/暂停) 的标准 ERC-20 代币 |
| 交易市场 | 具有原子交换和费用收集功能的点对点交易 |
| AMM 池 | 具有 LP 代币的恒定乘积 (x*y=k) 流动性池 |
| 收益分配 | 基于快照向代币持有者分享收益 |
| RWA 合规 | 可选的 KYC 验证和白名单支持 |

## 架构

```
前端 (Next.js)
   |
   v
智能合约 (Solidity) --> Mantle 网络
```

## 快速开始

### 前置要求

- Node.js 18+
- pnpm
- Foundry (用于智能合约)

### 安装

```powershell
# 克隆仓库
git clone https://github.com/Grdlt/MantleFrac.git
cd MantleFrac

# 安装前端依赖
cd web
pnpm install

# 安装 Foundry 依赖
cd ../contracts
forge install
```

### 构建与测试

```powershell
# 构建合约
cd contracts
forge build

# 运行所有测试
forge test -vvv

# 运行特定测试
forge test --match-contract MantleFracVaultTest -vvv
```

### 部署到 Mantle 测试网

```powershell
# 设置环境变量
$env:PRIVATE_KEY = "your_private_key"

# 部署
forge script script/Deploy.s.sol:DeployTestnet --rpc-url https://rpc.sepolia.mantle.xyz --broadcast
```

## 智能合约

| 合约 | 描述 |
|----------|-------------|
| MantleFracVault.sol | 核心金库管理、NFT 托管、份额代币部署 |
| VaultShareToken.sol | 具有传输模式和最大供应量的 ERC-20 份额代币 |
| Marketplace.sol | 具有原子交换和费用收集功能的 P2P 挂单 |
| ConstantProductAMM.sol | 具有 LP 代币的恒定乘积 AMM |
| Distributor.sol | 基于快照的分红分配 |

## 网络配置

| 网络 | 链 ID | RPC URL | 浏览器 |
|---------|----------|---------|----------|
| Mantle Sepolia | 5003 | https://rpc.sepolia.mantle.xyz | https://explorer.sepolia.mantle.xyz |
| Mantle Mainnet | 5000 | https://rpc.mantle.xyz | https://explorer.mantle.xyz |

## 项目结构

```
MantleFrac/
├── contracts/              # Solidity 智能合约 (Foundry)
│   ├── src/               # 合约源文件
│   ├── test/              # Foundry 测试
│   └── script/            # 部署脚本
├── services/              # 后端微服务
│   ├── indexer-evm/       # EVM 事件索引器
│   └── api-evm/           # GraphQL API
├── web/                   # Next.js 前端
│   ├── src/lib/           # Wagmi 配置、ABI、链信息
│   ├── src/hooks/         # 合约交互 Hooks
│   └── src/components/    # React 组件
└── docs/                  # 文档
```

## 技术栈

- 智能合约: Solidity 0.8.24, OpenZeppelin, Foundry
- 前端: Next.js 15, React 19, wagmi, viem, TailwindCSS
- 后端: Node.js, TypeScript, SQLite
- 基础设施: Vercel, Render

## 安全性

- 包含基于属性的模糊测试的全面测试覆盖
- OpenZeppelin 经过实战检验的合约
- 用于合规的传输模式控制
- 原子交换执行

## 许可证

MIT

