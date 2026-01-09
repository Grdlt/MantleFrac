import { Decimal } from "@/lib/num";

export type SwapDirection = "share_to_quote" | "quote_to_share";

export interface SwapArgs {
  poolId: string;
  direction: SwapDirection;
  amountIn: bigint;
  minAmountOut: bigint;
  vaultId: string;
}

export function buildSwapArgs(input: {
  poolId: string;
  direction: SwapDirection | string;
  amountIn: string | number;
  slippagePct: string | number;
  vaultId: string;
  decimals?: number;
}): SwapArgs {
  const decimals = input.decimals ?? 18;
  const amountInDecimal = new Decimal((input.amountIn ?? 0).toString().replace(/,/g, ""));
  const amountIn = BigInt(amountInDecimal.mul(new Decimal(10).pow(decimals)).toFixed(0));
  
  const slippageBps = Math.max(
    0,
    Math.min(10000, Math.floor((Number(input.slippagePct) || 0) * 100))
  );
  
  // Calculate minimum amount out based on slippage
  const minAmountOut = amountIn * BigInt(10000 - slippageBps) / BigInt(10000);

  return {
    poolId: input.poolId,
    direction: input.direction as SwapDirection,
    amountIn,
    minAmountOut,
    vaultId: input.vaultId,
  };
}
