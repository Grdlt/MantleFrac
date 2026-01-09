/**
 * Contract ABIs for event parsing
 */

export const VAULT_EVENTS = [
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
] as const;

export const MARKETPLACE_EVENTS = [
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
] as const;

export const AMM_EVENTS = [
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
] as const;

export const DISTRIBUTOR_EVENTS = [
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
] as const;

// Combined ABI for all contracts
export const ALL_EVENTS = [
  ...VAULT_EVENTS,
  ...MARKETPLACE_EVENTS,
  ...AMM_EVENTS,
  ...DISTRIBUTOR_EVENTS,
] as const;
