# 🚀 MantleFrac 快速启动

## 最简启动步骤

### 1. 安装依赖
```powershell
# 进入前端目录
cd web

# 安装依赖
pnpm install
```

### 2. 启动前端
```powershell
# 启动开发服务器
pnpm dev
```

访问 http://localhost:3001

### 3. 连接钱包
1. 安装 MetaMask 浏览器扩展
2. 添加 Mantle Sepolia Testnet：
   - Network Name: `Mantle Sepolia Testnet`
   - RPC URL: `https://rpc.sepolia.mantle.xyz`
   - Chain ID: `5003`
   - Currency Symbol: `MNT`
   - Block Explorer: `https://explorer.sepolia.mantle.xyz`

3. 获取测试代币：https://faucet.sepolia.mantle.xyz

### 4. 测试合约（可选）
```powershell
# 进入合约目录
cd contracts

# 安装 Foundry 依赖
forge install

# 运行测试
forge test -vvv
```

---

## 已部署的合约地址

项目已部署到 Mantle Sepolia Testnet (Chain ID: 5003)

| 合约 | 地址 |
|------|------|
| MantleFracVault | `0xCc59F6FC768612659BEB827c0345c65F1C7ABe17` |
| Marketplace | `0x751dC26E9d66aC60B29D395a11C96523ACd94487` |
| ConstantProductAMM | `0x293fA675B73931a20F30b0c68A18d3cd39cF9Af0` |
| Distributor | `0x7E871dfEBAEC9E3e9f2458E5B5Fd90F3283356cD` |

---

## 项目结构

```
MantleFrac/
├── contracts/          # Solidity 智能合约
├── web/               # Next.js 前端
├── services/          # 后端服务（可选）
└── docs/              # 文档
```

---

## 常用命令

### 前端开发
```powershell
cd web
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
```

### 合约开发
```powershell
cd contracts
forge build       # 编译合约
forge test        # 运行测试
forge test -vvv   # 详细测试输出
```

---

## 需要帮助？

查看完整文档：
- [PROJECT_STARTUP_GUIDE.md](./PROJECT_STARTUP_GUIDE.md) - 详细启动指南
- [README.md](./README.md) - 项目概述
- [contracts/README.md](./contracts/README.md) - 合约文档

---

**就这么简单！** 🎉
