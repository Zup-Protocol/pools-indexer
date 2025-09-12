import { BigDecimal, Token } from "generated";
import { safeDiv } from "./math";
import { tokenBaseAmount } from "./token-commons";
import { PoolPrices } from "./types";

export function sqrtPriceX96toPrice(sqrtPriceX96: bigint, poolToken0: Token, poolToken1: Token): PoolPrices {
  const Q192 = BigInt(2) ** BigInt(192);
  const num = BigDecimal((sqrtPriceX96 * sqrtPriceX96).toString());

  const denominator = BigDecimal(Q192.toString());

  const price1 = num
    .div(denominator)
    .times(BigDecimal(tokenBaseAmount(poolToken0).toString()))
    .div(BigDecimal(tokenBaseAmount(poolToken1).toString()));

  const price0 = safeDiv(BigDecimal("1"), price1);

  return { token0PerToken1: price0, token1PerToken0: price1 };
}
