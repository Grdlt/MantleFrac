/**
 * Contract ABIs for MantleFrac
 * These ABIs are generated from the Solidity interfaces
 */

export const MANTLE_FRAC_VAULT_ABI = [
  // Events
  {
    type: 'event',
    name: 'VaultCreated',
    inputs: [
      { name: 'vaultId', type: 'bytes32', indexed: true },
      { name: 'nftContract', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: false },
      { name: 'shareSymbol', type: 'string', indexed: false },
      { name: 'shareToken', type: 'address', indexed: false },
      { name: 'creator', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'VaultRedeemed',
    inputs: [
      { name: 'vaultId', type: 'bytes32', indexed: true },
      { name: 'redeemer', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'VaultStateChanged',
    inputs: [
      { name: 'vaultId', type: 'bytes32', indexed: true },
      { name: 'oldState', type: 'uint8', indexed: false },
      { name: 'newState', type: 'uint8', indexed: false },
    ],
  },
  // Functions
  {
    type: 'function',
    name: 'createVault',
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'shareSymbol', type: 'string' },
      { name: 'shareName', type: 'string' },
      { name: 'maxSupply', type: 'uint256' },
      { name: 'policy', type: 'string' },
    ],
    outputs: [{ name: 'vaultId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'redeemVault',
    inputs: [{ name: 'vaultId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getVault',
    inputs: [{ name: 'vaultId', type: 'bytes32' }],
    outputs: [
      {
        name: 'vault',
        type: 'tuple',
        components: [
          { name: 'nftContract', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'shareToken', type: 'address' },
          { name: 'creator', type: 'address' },
          { name: 'custodian', type: 'address' },
          { name: 'policy', type: 'string' },
          { name: 'state', type: 'uint8' },
          { name: 'maxSupply', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getVaultByShareToken',
    inputs: [{ name: 'shareToken', type: 'address' }],
    outputs: [{ name: 'vaultId', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'vaultExists',
    inputs: [{ name: 'vaultId', type: 'bytes32' }],
    outputs: [{ name: 'exists', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

export const VAULT_SHARE_TOKEN_ABI = [
  // Events
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TransferModeChanged',
    inputs: [
      { name: 'oldMode', type: 'uint8', indexed: false },
      { name: 'newMode', type: 'uint8', indexed: false },
    ],
  },
  // Functions
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'maxSupply',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transferMode',
    inputs: [],
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'burn',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

export const MARKETPLACE_ABI = [
  // Events
  {
    type: 'event',
    name: 'ListingCreated',
    inputs: [
      { name: 'listingId', type: 'bytes32', indexed: true },
      { name: 'vaultId', type: 'bytes32', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'shareAmount', type: 'uint256', indexed: false },
      { name: 'priceAsset', type: 'address', indexed: false },
      { name: 'priceAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ListingFilled',
    inputs: [
      { name: 'listingId', type: 'bytes32', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'shareAmount', type: 'uint256', indexed: false },
      { name: 'priceAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ListingCancelled',
    inputs: [{ name: 'listingId', type: 'bytes32', indexed: true }],
  },
  {
    type: 'event',
    name: 'ListingExpired',
    inputs: [{ name: 'listingId', type: 'bytes32', indexed: true }],
  },
  {
    type: 'event',
    name: 'FeesCollected',
    inputs: [
      { name: 'listingId', type: 'bytes32', indexed: true },
      { name: 'token', type: 'address', indexed: true },
      { name: 'totalFee', type: 'uint256', indexed: false },
      { name: 'vaultShare', type: 'uint256', indexed: false },
      { name: 'protocolShare', type: 'uint256', indexed: false },
    ],
  },
  // Functions
  {
    type: 'function',
    name: 'createListing',
    inputs: [
      { name: 'vaultId', type: 'bytes32' },
      { name: 'shareAmount', type: 'uint256' },
      { name: 'priceAsset', type: 'address' },
      { name: 'priceAmount', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
    ],
    outputs: [{ name: 'listingId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'fillListing',
    inputs: [{ name: 'listingId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelListing',
    inputs: [{ name: 'listingId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getListing',
    inputs: [{ name: 'listingId', type: 'bytes32' }],
    outputs: [
      {
        name: 'listing',
        type: 'tuple',
        components: [
          { name: 'vaultId', type: 'bytes32' },
          { name: 'seller', type: 'address' },
          { name: 'shareToken', type: 'address' },
          { name: 'shareAmount', type: 'uint256' },
          { name: 'priceAsset', type: 'address' },
          { name: 'priceAmount', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'expiresAt', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getListingsByVault',
    inputs: [{ name: 'vaultId', type: 'bytes32' }],
    outputs: [{ name: 'listingIds', type: 'bytes32[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getListingsBySeller',
    inputs: [{ name: 'seller', type: 'address' }],
    outputs: [{ name: 'listingIds', type: 'bytes32[]' }],
    stateMutability: 'view',
  },
] as const;

export const CONSTANT_PRODUCT_AMM_ABI = [
  // Events
  {
    type: 'event',
    name: 'PoolCreated',
    inputs: [
      { name: 'poolId', type: 'bytes32', indexed: true },
      { name: 'tokenA', type: 'address', indexed: true },
      { name: 'tokenB', type: 'address', indexed: true },
      { name: 'reserveA', type: 'uint256', indexed: false },
      { name: 'reserveB', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'LiquidityAdded',
    inputs: [
      { name: 'poolId', type: 'bytes32', indexed: true },
      { name: 'provider', type: 'address', indexed: true },
      { name: 'amountA', type: 'uint256', indexed: false },
      { name: 'amountB', type: 'uint256', indexed: false },
      { name: 'lpMinted', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'LiquidityRemoved',
    inputs: [
      { name: 'poolId', type: 'bytes32', indexed: true },
      { name: 'provider', type: 'address', indexed: true },
      { name: 'amountA', type: 'uint256', indexed: false },
      { name: 'amountB', type: 'uint256', indexed: false },
      { name: 'lpBurned', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Swap',
    inputs: [
      { name: 'poolId', type: 'bytes32', indexed: true },
      { name: 'trader', type: 'address', indexed: true },
      { name: 'tokenIn', type: 'address', indexed: false },
      { name: 'amountIn', type: 'uint256', indexed: false },
      { name: 'tokenOut', type: 'address', indexed: false },
      { name: 'amountOut', type: 'uint256', indexed: false },
    ],
  },
  // Functions
  {
    type: 'function',
    name: 'createPool',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' },
      { name: 'feeBps', type: 'uint256' },
    ],
    outputs: [{ name: 'poolId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'addLiquidity',
    inputs: [
      { name: 'poolId', type: 'bytes32' },
      { name: 'amountADesired', type: 'uint256' },
      { name: 'amountBDesired', type: 'uint256' },
      { name: 'amountAMin', type: 'uint256' },
      { name: 'amountBMin', type: 'uint256' },
    ],
    outputs: [
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' },
      { name: 'lpMinted', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'removeLiquidity',
    inputs: [
      { name: 'poolId', type: 'bytes32' },
      { name: 'lpAmount', type: 'uint256' },
      { name: 'amountAMin', type: 'uint256' },
      { name: 'amountBMin', type: 'uint256' },
    ],
    outputs: [
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'swap',
    inputs: [
      { name: 'poolId', type: 'bytes32' },
      { name: 'tokenIn', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'minAmountOut', type: 'uint256' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPool',
    inputs: [{ name: 'poolId', type: 'bytes32' }],
    outputs: [
      {
        name: 'pool',
        type: 'tuple',
        components: [
          { name: 'tokenA', type: 'address' },
          { name: 'tokenB', type: 'address' },
          { name: 'reserveA', type: 'uint256' },
          { name: 'reserveB', type: 'uint256' },
          { name: 'totalLpSupply', type: 'uint256' },
          { name: 'feeBps', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getAmountOut',
    inputs: [
      { name: 'poolId', type: 'bytes32' },
      { name: 'tokenIn', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getLpBalance',
    inputs: [
      { name: 'poolId', type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    outputs: [{ name: 'balance', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

export const DISTRIBUTOR_ABI = [
  // Events
  {
    type: 'event',
    name: 'DistributionScheduled',
    inputs: [
      { name: 'programId', type: 'bytes32', indexed: true },
      { name: 'vaultId', type: 'bytes32', indexed: true },
      { name: 'asset', type: 'address', indexed: true },
      { name: 'totalAmount', type: 'uint256', indexed: false },
      { name: 'startsAt', type: 'uint256', indexed: false },
      { name: 'endsAt', type: 'uint256', indexed: false },
      { name: 'snapshotBlock', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PayoutClaimed',
    inputs: [
      { name: 'programId', type: 'bytes32', indexed: true },
      { name: 'account', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'DistributionCancelled',
    inputs: [
      { name: 'programId', type: 'bytes32', indexed: true },
      { name: 'remainingAmount', type: 'uint256', indexed: false },
    ],
  },
  // Functions
  {
    type: 'function',
    name: 'scheduleDistribution',
    inputs: [
      { name: 'vaultId', type: 'bytes32' },
      { name: 'asset', type: 'address' },
      { name: 'totalAmount', type: 'uint256' },
      { name: 'startsAt', type: 'uint256' },
      { name: 'endsAt', type: 'uint256' },
    ],
    outputs: [{ name: 'programId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimPayout',
    inputs: [{ name: 'programId', type: 'bytes32' }],
    outputs: [{ name: 'amount', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimMultiple',
    inputs: [{ name: 'programIds', type: 'bytes32[]' }],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelDistribution',
    inputs: [{ name: 'programId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getProgram',
    inputs: [{ name: 'programId', type: 'bytes32' }],
    outputs: [
      {
        name: 'program',
        type: 'tuple',
        components: [
          { name: 'vaultId', type: 'bytes32' },
          { name: 'asset', type: 'address' },
          { name: 'totalAmount', type: 'uint256' },
          { name: 'claimedAmount', type: 'uint256' },
          { name: 'startsAt', type: 'uint256' },
          { name: 'endsAt', type: 'uint256' },
          { name: 'snapshotBlock', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getClaimableAmount',
    inputs: [
      { name: 'programId', type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    outputs: [{ name: 'amount', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasClaimed',
    inputs: [
      { name: 'programId', type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    outputs: [{ name: 'claimed', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getProgramsByVault',
    inputs: [{ name: 'vaultId', type: 'bytes32' }],
    outputs: [{ name: 'programIds', type: 'bytes32[]' }],
    stateMutability: 'view',
  },
] as const;

// ERC-20 standard ABI for token interactions
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;

// ERC-721 standard ABI for NFT interactions
export const ERC721_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'ownerOf',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'safeTransferFrom',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setApprovalForAll',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getApproved',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isApprovedForAll',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenURI',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
] as const;
