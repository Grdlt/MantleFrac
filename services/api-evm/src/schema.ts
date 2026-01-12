/**
 * GraphQL Schema for MantleFrac EVM API
 */

export const typeDefs = /* GraphQL */ `
  scalar JSON

  type Vault {
    network: String!
    vaultId: String!
    nftContract: String
    tokenId: String
    collection: String
    shareSymbol: String
    shareToken: String
    creator: String
    state: String
    redeemedBy: String
    redeemedAt: String
    createdAt: String
    blockNumber: String
    txHash: String
  }

  type ShareToken {
    network: String!
    address: String!
    vaultId: String!
    symbol: String
    name: String
    decimals: Int
    totalSupply: String
    maxSupply: String
    transferMode: String
    createdAt: String
  }

  type Listing {
    network: String!
    vaultId: String!
    listingId: String!
    seller: String
    buyer: String
    shareAmount: String
    priceAsset: String
    priceAmount: String
    status: String
    createdAt: String
    filledAt: String
    cancelledAt: String
    blockNumber: String
    txHash: String
  }

  enum ListingStatus {
    OPEN
    FILLED
    CANCELLED
    EXPIRED
  }

  enum ListingSortBy {
    CREATED_AT_DESC
    CREATED_AT_ASC
    PRICE_AMOUNT_DESC
    PRICE_AMOUNT_ASC
    AMOUNT_DESC
    AMOUNT_ASC
  }

  type ListingsResponse {
    listings: [Listing!]!
    totalCount: Int!
    hasMore: Boolean!
  }

  type MarketplaceStats {
    totalListings: Int!
    openListings: Int!
    totalVolume: String!
    uniqueVaults: Int!
  }

  type Pool {
    network: String!
    poolId: String!
    tokenA: String
    tokenB: String
    reserveA: String
    reserveB: String
    totalLpSupply: String
    feeBps: Int
    createdAt: String
    blockNumber: String
    txHash: String
  }

  type Swap {
    network: String!
    poolId: String!
    trader: String
    tokenIn: String
    amountIn: String
    tokenOut: String
    amountOut: String
    createdAt: String
    blockNumber: String
    txHash: String
  }

  type Distribution {
    network: String!
    vaultId: String!
    programId: String!
    asset: String
    totalAmount: String
    claimedAmount: String
    startsAt: String
    endsAt: String
    snapshotBlock: String
    active: Boolean
    createdAt: String
    blockNumber: String
    txHash: String
  }

  type Claim {
    network: String!
    programId: String!
    account: String!
    amount: String
    claimedAt: String
    blockNumber: String
    txHash: String
  }

  type Event {
    network: String!
    blockNumber: String!
    txHash: String!
    logIndex: Int!
    contract: String
    eventName: String
    payload: String
    createdAt: String
  }

  type ContractAddresses {
    vault: String!
    marketplace: String!
    amm: String!
    distributor: String!
  }

  type NetworkInfo {
    network: String!
    chainId: Int!
    rpcUrl: String!
    contracts: ContractAddresses!
  }

  # Fee related types
  type FeeParams {
    feeBps: Int!
    vaultSplitBps: Int!
    protocolSplitBps: Int!
  }

  type FeeSchedule {
    current: FeeParams
    pending: FeeParams
    pendingEffectiveAt: String
  }

  type FeeTotals {
    amountTotal: String!
    vaultTotal: String!
    protocolTotal: String!
    updatedAt: String
  }

  type FeeEvent {
    kind: String!
    token: String!
    amount: String!
    vaultShare: String!
    protocolShare: String!
    payer: String
    txId: String
    createdAt: String
  }

  # AMM types
  type AmmFeeParams {
    feeBps: Int!
    protocolFeeBps: Int!
  }

  type AmmQuote {
    amountIn: String!
    amountOut: String!
  }

  type PriceTvl {
    symbol: String!
    quoteSymbol: String
    price: String
    tvl: String
    poolId: String
    vaultId: String
    feeBps: Int
  }

  type AllPoolsItem {
    poolId: String!
    tokenA: String!
    tokenB: String!
    reserveA: String!
    reserveB: String!
    feeBps: Int!
  }

  type PoolEvent {
    eventType: String!
    poolId: String!
    trader: String
    amountA: String
    amountB: String
    createdAt: String
    txHash: String
  }

  # NFT types
  type NftCollection {
    contractAddress: String!
    name: String
    symbol: String
    description: String
    imageUrl: String
  }

  type NftDisplay {
    contractAddress: String!
    tokenId: String!
    name: String
    description: String
    imageUrl: String
    attributes: JSON
  }

  # Availability checks
  type SymbolAvailability {
    available: Boolean!
  }

  type VaultIdAvailability {
    available: Boolean!
  }

  # Balance types
  type ShareBalance {
    balance: String!
  }

  # Quote with fees
  type QuoteWithFees {
    grossAmount: String!
    feeAmount: String!
    netAmount: String!
  }

  # Registration result
  type RegistrationResult {
    txId: String!
  }

  type Query {
    # Network info
    networkInfo: NetworkInfo!
    
    # Vaults
    vault(network: String, vaultId: String!): Vault
    vaults(network: String, limit: Int = 50, offset: Int = 0): [Vault!]!
    vaultsByCreator(network: String, creator: String!, limit: Int = 50): [Vault!]!
    
    # Vault details
    vaultMaxSupply(network: String!, vaultId: String!): String
    vaultTotalSupply(network: String!, vaultId: String!): String
    vaultEscrowBalance(network: String!, vaultId: String!): String
    vaultTreasuryBalance(network: String!, vaultId: String!): String
    vaultTreasuryShareBalance(network: String!, vaultId: String!): String
    vaultLockedSeedShares(network: String!, vaultId: String!): String
    vaultTeamShareBalances(network: String!, vaultId: String!): String
    vaultTeamLPShareEquivalent(network: String!, vaultId: String!): String
    vaultCirculating(network: String!, vaultId: String!): String
    vaultNftDisplay(network: String!, vaultId: String!): NftDisplay
    
    # Share balances
    shareBalance(network: String!, vaultId: String!, account: String!): ShareBalance
    
    # Listings
    listing(listingId: String!): Listing
    listings(network: String, vaultId: String!, limit: Int = 50): [Listing!]!
    listingsBySeller(seller: String!, limit: Int = 50): [Listing!]!
    marketplaceListings(
      limit: Int = 50
      offset: Int = 0
      sortBy: ListingSortBy = CREATED_AT_DESC
      filterByStatus: ListingStatus
    ): ListingsResponse!
    marketplaceStats: MarketplaceStats!
    
    # Pools
    pool(poolId: String!): Pool
    pools(network: String, limit: Int = 50, offset: Int = 0): [Pool!]!
    poolsByToken(tokenAddress: String!, limit: Int = 50): [Pool!]!
    poolsByAsset(network: String!, assetSymbol: String!, limit: Int = 50): [Pool!]!
    allPools(network: String!, limit: Int = 50): [AllPoolsItem!]!
    swaps(poolId: String!, limit: Int = 50): [Swap!]!
    
    # AMM
    ammQuote(network: String!, poolId: String!, tokenIn: String!, amountIn: String!): AmmQuote
    ammFeeParams(network: String!): AmmFeeParams
    priceTvl(network: String!, symbol: String!, quoteSymbol: String): PriceTvl
    
    # Fees
    feeSchedule(network: String!, vaultId: String!): FeeSchedule
    feeParams(network: String!, vaultId: String!): FeeParams
    feeTotals(network: String!, token: String!): FeeTotals
    fees(network: String!, vaultId: String!, limit: Int = 50): [FeeEvent!]!
    quoteWithFees(network: String!, vaultId: String!, amount: String!, isBuy: Boolean!): QuoteWithFees
    
    # Platform
    platformTreasuryBalance(network: String!): String
    
    # Distributions
    distribution(programId: String!): Distribution
    distributions(vaultId: String!, limit: Int = 50): [Distribution!]!
    claims(programId: String!, limit: Int = 100): [Claim!]!
    claimsByAccount(account: String!, limit: Int = 100): [Claim!]!
    
    # NFT
    nftCollections(network: String!): [NftCollection!]!
    collectionIds(network: String!): [String!]!
    nftDisplay(network: String!, contractAddress: String!, tokenId: String!): NftDisplay
    
    # Availability checks
    symbolAvailable(network: String!, symbol: String!): SymbolAvailability!
    vaultIdAvailable(network: String!, vaultId: String!): VaultIdAvailability!
    
    # Events
    events(limit: Int = 50): [Event!]!
    eventsByContract(contract: String!, limit: Int = 50): [Event!]!
  }

  type Mutation {
    registerVaultFromNFT(
      network: String!
      contractAddress: String!
      tokenId: String!
      symbol: String!
    ): RegistrationResult
  }
`;

export default typeDefs;
