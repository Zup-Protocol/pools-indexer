import { BigDecimal, Pool as PoolEntity, Token, Token as TokenEntity } from "generated";
import { getTokenAmountInPool } from "./pool-commons";

export function formatFromTokenAmount(amount: bigint, token: TokenEntity): BigDecimal {
  const tokenAmountInBigDecimal = new BigDecimal(amount.toString());
  const tokensDivisionFactor = new BigDecimal("10").pow(token.decimals);

  return tokenAmountInBigDecimal.div(tokensDivisionFactor);
}

export function tokenBaseAmount(token: Token): BigInt {
  return BigInt(10) ** BigInt(token.decimals);
}

export function pickMostLiquidPoolForToken(
  token: TokenEntity,
  otherPool: PoolEntity,
  currentPool?: PoolEntity
): PoolEntity {
  if (!currentPool) return otherPool;

  const tokenAmountStoredInCurrentPool = getTokenAmountInPool(currentPool, token);
  const tokenAmountStoredInOtherPool = getTokenAmountInPool(otherPool, token);

  if (token.usdPrice.isZero()) {
    return otherPool.totalValueLockedUSD.gt(currentPool.totalValueLockedUSD) ? otherPool : currentPool;
  }

  if (tokenAmountStoredInOtherPool.gt(tokenAmountStoredInCurrentPool)) {
    return otherPool;
  }

  return currentPool;
}
