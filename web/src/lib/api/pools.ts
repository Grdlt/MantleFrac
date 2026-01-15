import { gqlFetch, DEFAULT_NETWORK } from "@/lib/graphql";

export type PoolInfo = {
  vaultId: string;
  poolId: string;
  symbol: string;
  feeBps: number;
  reserves: { share: string; quote: string };
  shareTypeId: string;
};

// Pool info is now fetched from EVM contracts via the indexer

export type Pool = {
  network: string;
  vaultId: string;
  poolId: string;
  owner?: string | null;
  assetA?: string | null;
  assetB?: string | null;
  reserveA?: string | null;
  reserveB?: string | null;
  feeBps?: number | null;
  createdAt?: string | null;
};

export async function getPoolsByVault(
  vaultId: string,
  limit = 25
): Promise<Pool[]> {
  const query = `
    query Pools($network: String!, $vaultId: String!, $limit: Int!) {
      pools(network: $network, vaultId: $vaultId, limit: $limit) {
        network
        vaultId
        poolId
        owner
        assetA
        assetB
        reserveA
        reserveB
        feeBps
        createdAt
      }
    }
  `;
  const res = await gqlFetch<{ pools: Pool[] }>(query, {
    network: DEFAULT_NETWORK,
    vaultId,
    limit,
  });
  return res.pools || [];
}

export type PriceTVL = {
  symbol: string;
  quoteSymbol: string;
  price: string | null;
  tvl: string | null;
  poolId?: string | null;
  vaultId?: string | null;
  feeBps?: number | null;
};

export async function getPriceTvl(
  symbol: string,
  quoteSymbol?: string
): Promise<PriceTVL | null> {
  const query = `
    query PriceTVL($network: String!, $symbol: String!, $quoteSymbol: String) {
      priceTvl(network: $network, symbol: $symbol, quoteSymbol: $quoteSymbol) {
        symbol
        quoteSymbol
        price
        tvl
        poolId
        vaultId
        feeBps
      }
    }
  `;
  const res = await gqlFetch<{ priceTvl: PriceTVL | null }>(query, {
    network: DEFAULT_NETWORK,
    symbol,
    quoteSymbol,
  });
  return res.priceTvl ?? null;
}

export async function getAmmQuote(params: {
  poolOwner: string;
  poolId: string;
  direction: "share_to_quote" | "quote_to_share";
  amountIn: string;
}): Promise<{ in: string; out: string }> {
  const query = `
    query AmmQuote($network: String!, $poolOwner: String!, $poolId: String!, $direction: String!, $amountIn: String!) {
      ammQuote(network: $network, poolOwner: $poolOwner, poolId: $poolId, direction: $direction, amountIn: $amountIn) {
      ammQuote(network: $network, poolOwner: $poolOwner, poolId: $poolId, direction: $direction, amountIn: $amountIn) {
        amountIn
        amountOut
      }
      }
    }
  `;
  const res = await gqlFetch<{ ammQuote: { in: string; out: string } }>(query, {
    network: DEFAULT_NETWORK,
    ...params,
  });
  return { in: res.ammQuote.amountIn, out: res.ammQuote.amountOut };
}

export async function getAmmQuoteWithFees(params: {
  poolOwner: string;
  poolId: string;
  direction: "share_to_quote" | "quote_to_share";
  amountIn: string;
  vaultId: string;
}): Promise<{
  in: string;
  out: string;
  feeAmount: string;
  feeBps: number;
  vaultShare: string;
  protocolShare: string;
}> {
  const query = `
    query AmmQuoteWithFees($network:String!,$poolOwner:String!,$poolId:String!,$direction:String!,$amountIn:String!,$vaultId:String!){
      ammQuoteWithFees(network:$network, poolOwner:$poolOwner, poolId:$poolId, direction:$direction, amountIn:$amountIn, vaultId:$vaultId){
        in out feeAmount feeBps vaultShare protocolShare
      }
    }
  `;
  const res = await gqlFetch<{
    ammQuoteWithFees: {
      in: string;
      out: string;
      feeAmount: string;
      feeBps: number;
      vaultShare: string;
      protocolShare: string;
    };
  }>(query, { network: DEFAULT_NETWORK, ...params });
  return res.ammQuoteWithFees;
}

export type AllPoolsItem = {
  network: string;
  vaultId: string;
  poolId: string;
  owner?: string | null;
  assetA?: string | null;
  assetB?: string | null;
  reserveA?: string | null;
  reserveB?: string | null;
  feeBps?: number | null;
  createdAt?: string | null;
};

export async function listAllPools(params: {
  limit?: number;
  offset?: number;
  filterActive?: boolean;
  filterByAsset?: string;
  sortBy?: string;
}): Promise<AllPoolsItem[]> {
  const query = `
    query AllPools($network: String!, $limit: Int, $offset: Int, $filterActive: Boolean, $filterByAsset: String, $sortBy: String) {
      allPools(network: $network, limit: $limit, offset: $offset, filterActive: $filterActive, filterByAsset: $filterByAsset, sortBy: $sortBy) {
        network
        vaultId
        poolId
        owner
        assetA
        assetB
        reserveA
        reserveB
        feeBps
        createdAt
      }
    }
  `;
  const res = await gqlFetch<{ allPools: AllPoolsItem[] }>(query, {
    network: DEFAULT_NETWORK,
    ...params,
  });
  return res.allPools || [];
}

export type PoolEvent = {
  network: string;
  vaultId: string;
  blockHeight: string;
  txIndex: number;
  evIndex: number;
  txId: string;
  type: string;
  payload?: string | null;
  ts?: string | null;
};

export async function getPoolEvents(
  vaultId: string,
  limit = 50
): Promise<PoolEvent[]> {
  const query = `
    query PoolEvents($network: String!, $vaultId: String!, $limit: Int!) {
      events(network: $network, vaultId: $vaultId, limit: $limit) {
        network
        vaultId
        blockHeight
        txIndex
        evIndex
        txId
        type
        payload
        ts
      }
    }
  `;
  const res = await gqlFetch<{ events: PoolEvent[] }>(query, {
    network: DEFAULT_NETWORK,
    vaultId,
    limit,
  });
  return res.events || [];
}

export async function ensureVaultTreasury(
  vaultId: string
): Promise<{ txId: string }> {
  const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
  const res = await fetch(`${API}/pools/ensure-ready`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vaultId }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    shareTreasuryTxId?: string;
    quoteTreasuryTxId?: string;
  };
  return { txId: data.quoteTreasuryTxId || data.shareTreasuryTxId || "" };
}

export type TreasuryStatus = {
  platformQuote: boolean;
  platformShare: boolean;
  vaultQuote: boolean;
  vaultShare: boolean;
  shareIdent?: string | null;
};

export async function getTreasuryStatus(
  vaultId: string
): Promise<TreasuryStatus> {
  const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
  const r = await fetch(
    `${API}/pools/treasury-status?vaultId=${encodeURIComponent(vaultId)}`,
    { cache: "no-store" }
  );
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(text || `HTTP ${r.status}`);
  }
  const s = (await r.json()) as TreasuryStatus;
  return s;
}
