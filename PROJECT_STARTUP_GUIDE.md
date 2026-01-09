# MantleFrac 项目启动指南

## 📋 目录
1. [系统要求](#系统要求)
2. [项目结构](#项目结构)
3. [快速启动](#快速启动)
4. [详细启动步骤](#详细启动步骤)
5. [常见问题](#常见问题)

---

## 系统要求

### 必需软件
- **Node.js**: 18.0 或更高版本
- **pnpm**: 8.0 或更高版本
- **Foundry**: 最新版本（用于智能合约开发）
- **Git**: 用于版本控制

### 可选软件
- **Docker**: 用于运行后端服务
- **MetaMask**: 用于测试前端钱包连接

### Windows 系统特别说明
- 使用 PowerShell 或 CMD
- 确保已安装 Visual Studio Build Tools（用于编译某些 npm 包）

---

## 项目结构

```
MantleFrac/
├── contracts/              # Solidity 智能合约 (Foundry)
│   ├── src/               # 合约源文件
│   ├── test/              # Foundry 测试
│   ├── script/            # 部署脚本
│   └── foundry.toml       # Foundry 配置
│
├── web/                   # Next.js 前端应用
│   ├── src/
│   │   ├── app/          # Next.js 页面
│   │   ├── components/   # React 组件
│   │   ├── hooks/        # 自定义 Hooks (包括合约交互)
│   │   ├── lib/          # 工具函数、ABIs、配置
│   │   └── providers/    # Context Providers
│   └── package.json
│
├── services/              # 后端微服务
│   ├── indexer-evm/      # EVM 事件索引器
│   └── api-evm/          # GraphQL API
│
└── docs/                  # 文档
```

---

## 快速启动

### 1. 克隆项目
```powershell
git clone <repository-url>
cd NFractional
```

### 2. 安装依赖
```powershell
# 安装前端依赖
cd web
pnpm install

# 安装合约依赖
cd ..\contracts
forge install
```

### 3. 启动前端开发服务器
```powershell
cd ..\web
pnpm dev
```

前端将在 http://localhost:3001 启动

---

## 详细启动步骤

### 步骤 1: 智能合约开发

#### 1.1 安装 Foundry
```powershell
# Windows: 使用 foundryup
# 访问 https://book.getfoundry.sh/getting-started/installation
```

#### 1.2 编译合约
```powershell
cd contracts
forge build
```

#### 1.3 运行测试
```powershell
# 运行所有测试
forge test -vvv

# 运行特定测试
forge test --match-contract MantleFracVaultTest -vvv

# 运行特定测试函数
forge test --match-test testCreateVault -vvv

# 查看 gas 报告
forge test --gas-report
```

#### 1.4 部署到 Mantle Testnet

**配置环境变量：**

编辑 `contracts/.env` 文件：
```env
PRIVATE_KEY=your_private_key_here
MANTLE_TESTNET_RPC=https://rpc.sepolia.mantle.xyz
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**部署合约：**
```powershell
# 部署到 Mantle Sepolia Testnet
forge script script/Deploy.s.sol:DeployTestnet --rpc-url $env:MANTLE_TESTNET_RPC --broadcast --verify

# 或者使用 .env 文件中的配置
forge script script/Deploy.s.sol:DeployTestnet --rpc-url https://rpc.sepolia.mantle.xyz --broadcast
```

**部署后：**
- 记录合约地址
- 更新 `web/src/lib/contracts.ts` 中的合约地址

---

### 步骤 2: 前端开发

#### 2.1 配置环境变量

创建 `web/.env.local` 文件：
```env
# API 端点
NEXT_PUBLIC_API_BASE=http://localhost:4000

# Mantle 网络配置
NEXT_PUBLIC_MANTLE_TESTNET_RPC=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_MANTLE_MAINNET_RPC=https://rpc.mantle.xyz

# 合约地址（如果需要覆盖默认值）
NEXT_PUBLIC_VAULT_ADDRESS=0x...
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
```

#### 2.2 更新合约地址

编辑 `web/src/lib/contracts.ts`，更新部署的合约地址：
```typescript
export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  [MANTLE_TESTNET_CHAIN_ID]: {
    mantleFracVault: '0xYourVaultAddress' as Address,
    marketplace: '0xYourMarketplaceAddress' as Address,
    constantProductAMM: '0xYourAMMAddress' as Address,
    distributor: '0xYourDistributorAddress' as Address,
  },
};
```

#### 2.3 启动开发服务器

```powershell
cd web
pnpm dev
```

访问 http://localhost:3001

#### 2.4 构建生产版本

```powershell
cd web
pnpm build
pnpm start
```

---

### 步骤 3: 后端服务（可选）

后端服务用于索引区块链事件和提供 GraphQL API。

#### 3.1 启动 EVM 索引器

```powershell
cd services/indexer-evm

# 安装依赖
pnpm install

# 配置环境变量
# 创建 .env 文件
echo "RPC_URL=https://rpc.sepolia.mantle.xyz" > .env
echo "START_BLOCK=0" >> .env

# 启动索引器
pnpm start
```

#### 3.2 启动 GraphQL API

```powershell
cd services/api-evm

# 安装依赖
pnpm install

# 配置环境变量
# 创建 .env 文件
echo "PORT=4000" > .env
echo "DATABASE_URL=your_database_url" >> .env

# 启动 API
pnpm start
```

#### 3.3 使用 Docker Compose（推荐）

```powershell
# 在项目根目录
docker-compose up -d
```

这将启动：
- EVM 索引器
- GraphQL API
- ScyllaDB 数据库
- Prometheus + Grafana 监控

---

## 测试前端功能

### 1. 连接钱包

1. 打开 http://localhost:3001
2. 点击 "Connect Wallet" 按钮
3. 选择 MetaMask
4. 确保 MetaMask 连接到 Mantle Sepolia Testnet

**添加 Mantle Testnet 到 MetaMask：**
- Network Name: Mantle Sepolia Testnet
- RPC URL: https://rpc.sepolia.mantle.xyz
- Chain ID: 5003
- Currency Symbol: MNT
- Block Explorer: https://explorer.sepolia.mantle.xyz

### 2. 获取测试代币

访问 Mantle Sepolia Faucet 获取测试 MNT：
- https://faucet.sepolia.mantle.xyz

### 3. 测试核心功能

#### 创建金库
1. 准备一个 ERC-721 NFT
2. 调用 `createVault` 函数
3. 设置份额代币符号和最大供应量

#### 创建挂单
1. 选择一个金库
2. 设置价格和数量
3. 创建挂单

#### 添加流动性
1. 选择一个金库
2. 创建 AMM 池
3. 添加流动性

---

## 开发工作流

### 合约开发流程

1. **编写合约** → `contracts/src/`
2. **编写测试** → `contracts/test/`
3. **运行测试** → `forge test`
4. **部署到测试网** → `forge script`
5. **验证合约** → `forge verify-contract`

### 前端开发流程

1. **更新合约地址** → `web/src/lib/contracts.ts`
2. **更新 ABIs** → `web/src/lib/abis/index.ts`
3. **创建 Hooks** → `web/src/hooks/contracts/`
4. **构建 UI** → `web/src/app/` 或 `web/src/components/`
5. **测试功能** → 连接 MetaMask 测试

---

## 常见问题

### Q1: 前端启动失败，提示找不到模块

**问题：** `Cannot find module '@flow-hackathon/cadence'`

**解决方案：**
```powershell
# 删除 node_modules 和 lock 文件
cd web
Remove-Item -Recurse -Force node_modules
Remove-Item pnpm-lock.yaml

# 重新安装
pnpm install
```

### Q2: Foundry 命令不可用

**问题：** `forge: command not found`

**解决方案：**
1. 安装 Foundry: https://book.getfoundry.sh/getting-started/installation
2. 重启终端
3. 验证安装: `forge --version`

### Q3: 合约部署失败

**问题：** `Error: insufficient funds`

**解决方案：**
1. 确保钱包有足够的 MNT 用于 gas
2. 从 faucet 获取测试代币
3. 检查 RPC URL 是否正确

### Q4: MetaMask 无法连接

**问题：** 前端无法连接 MetaMask

**解决方案：**
1. 确保 MetaMask 已安装
2. 检查网络配置（Chain ID: 5003）
3. 刷新页面并重新连接
4. 检查浏览器控制台错误信息

### Q5: 合约交互失败

**问题：** 交易被拒绝或失败

**解决方案：**
1. 检查合约地址是否正确
2. 确保 ABI 与部署的合约匹配
3. 检查函数参数类型和值
4. 查看区块链浏览器的交易详情

### Q6: 后端服务无法启动

**问题：** 索引器或 API 启动失败

**解决方案：**
1. 检查环境变量配置
2. 确保数据库连接正常
3. 检查端口是否被占用
4. 查看日志文件获取详细错误

---

## 有用的命令

### Foundry 命令
```powershell
# 编译合约
forge build

# 运行测试
forge test

# 格式化代码
forge fmt

# 查看合约大小
forge build --sizes

# 生成 gas 报告
forge test --gas-report

# 清理构建文件
forge clean
```

### pnpm 命令
```powershell
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 运行 linter
pnpm lint
```

### Git 命令
```powershell
# 查看状态
git status

# 提交更改
git add .
git commit -m "Your message"

# 推送到远程
git push origin main
```

---

## 下一步

1. ✅ 启动项目
2. 📝 阅读智能合约文档: `contracts/README.md`
3. 🎨 查看前端组件: `web/src/components/`
4. 🔧 自定义配置: `web/src/lib/`
5. 🚀 部署到生产环境

---

## 相关文档

- [README.md](./README.md) - 项目概述
- [HACKATHON_SUBMISSION.md](./HACKATHON_SUBMISSION.md) - 黑客松提交
- [contracts/README.md](./contracts/README.md) - 合约文档
- [contracts/DEPLOYMENT_MANTLE.md](./contracts/DEPLOYMENT_MANTLE.md) - 部署指南

---

## 技术支持

如果遇到问题：
1. 查看本文档的常见问题部分
2. 检查项目 Issues
3. 查看 Mantle 官方文档: https://docs.mantle.xyz
4. 查看 Foundry 文档: https://book.getfoundry.sh

---

**祝开发顺利！** 🚀
