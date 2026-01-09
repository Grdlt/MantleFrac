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

  type Query {
    # Network info
    networkInfo: NetworkInfo!
    
    # Vaults
    vault(vaultId: String!): Vault
    vaults(limit: Int = 50, offset: Int = 0): [Vault!]!
    vaultsByCreator(creator: String!, limit: Int = 50): [Vault!]!
    
    # Listings
    listing(listingId: String!): Listing
    listings(vaultId: String!, limit: Int = 50): [Listing!]!
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
    pools(limit: Int = 50, offset: Int = 0): [Pool!]!
    poolsByToken(tokenAddress: String!, limit: Int = 50): [Pool!]!
    swaps(poolId: String!, limit: Int = 50): [Swap!]!
    
    # Distributions
    distribution(programId: String!): Distribution
    distributions(vaultId: String!, limit: Int = 50): [Distribution!]!
    claims(programId: String!, limit: Int = 100): [Claim!]!
    claimsByAccount(account: String!, limit: Int = 100): [Claim!]!
    
    # Events
    events(limit: Int = 50): [Event!]!
    eventsByContract(contract: String!, limit: Int = 50): [Event!]!
  }
`;

export default typeDefs;
