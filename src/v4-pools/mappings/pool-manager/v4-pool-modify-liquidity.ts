import { HandlerContext, Pool as PoolEntity, Token as TokenEntity } from "generated";
import { PoolSetters } from "../../../common/pool-setters";
import { formatFromTokenAmount } from "../../../common/token-commons";
import { getAmount0, getAmount1 } from "../../common/liquidity-amounts";

export async function handleV4PoolModifyLiquidity(
  context: HandlerContext,
  poolEntity: PoolEntity,
  token0Entity: TokenEntity,
  token1Entity: TokenEntity,
  liqudityDelta: bigint,
  tickLower: number,
  tickUpper: number,
  eventTimestamp: bigint,
  v4PoolSetters: PoolSetters
): Promise<void> {
  const v4PoolEntity = await context.V4PoolData.getOrThrow(poolEntity.id);
  const amount0 = getAmount0(tickLower, tickUpper, v4PoolEntity.tick, liqudityDelta, v4PoolEntity.sqrtPriceX96);
  const amount1 = getAmount1(tickLower, tickUpper, v4PoolEntity.tick, liqudityDelta, v4PoolEntity.sqrtPriceX96);
  const amount0Formatted = formatFromTokenAmount(amount0, token0Entity);
  const amount1Formatted = formatFromTokenAmount(amount1, token1Entity);

  const poolTotalValueLockedToken0 = poolEntity.totalValueLockedToken0.plus(amount0Formatted);
  const poolTotalValueLockedToken1 = poolEntity.totalValueLockedToken1.plus(amount1Formatted);
  const poolTotalValueLockedUSD = poolTotalValueLockedToken0
    .times(token0Entity.usdPrice)
    .plus(poolTotalValueLockedToken1.times(token1Entity.usdPrice));

  const token0TotalTokenPooledAmount = token0Entity.totalTokenPooledAmount.plus(amount0Formatted);
  const token1TotalTokenPooledAmount = token1Entity.totalTokenPooledAmount.plus(amount1Formatted);

  const token0TotalValuePooledUsd = token0TotalTokenPooledAmount.times(token0Entity.usdPrice);
  const token1TotalValuePooledUsd = token1TotalTokenPooledAmount.times(token1Entity.usdPrice);

  poolEntity = {
    ...poolEntity,
    totalValueLockedToken0: poolTotalValueLockedToken0,
    totalValueLockedToken1: poolTotalValueLockedToken1,
    totalValueLockedUSD: poolTotalValueLockedUSD,
  };

  token0Entity = {
    ...token0Entity,
    totalTokenPooledAmount: token0TotalTokenPooledAmount,
    totalValuePooledUsd: token0TotalValuePooledUsd,
  };

  token1Entity = {
    ...token1Entity,
    totalTokenPooledAmount: token1TotalTokenPooledAmount,
    totalValuePooledUsd: token1TotalValuePooledUsd,
  };

  await v4PoolSetters.setPoolDailyDataTVL(eventTimestamp, poolEntity);

  context.Pool.set(poolEntity);
  context.Token.set(token0Entity);
  context.Token.set(token1Entity);
}
