import { handlerContext, Pool as PoolEntity, Token as TokenEntity } from "generated";
import { PoolSetters } from "../../../common/pool-setters";
import { formatFromTokenAmount, pickMostLiquidPoolForToken } from "../../../common/token-commons";

export async function handleV2PoolSync(
  context: handlerContext,
  poolEntity: PoolEntity,
  token0Entity: TokenEntity,
  token1Entity: TokenEntity,
  reserve0: bigint,
  reserve1: bigint,
  eventTimestamp: bigint,
  v2PoolSetters: PoolSetters
): Promise<void> {
  const token0SourcePricePoolEntity = await context.Pool.get(token0Entity.mostLiquidPool_id);
  const token1SourcePricePoolEntity = await context.Pool.get(token1Entity.mostLiquidPool_id);
  const oldToken0LockedValue = poolEntity.totalValueLockedToken0;
  const oldToken1LockedValue = poolEntity.totalValueLockedToken1;
  const reserve0Formatted = formatFromTokenAmount(reserve0, token0Entity);
  const reserve1Formatted = formatFromTokenAmount(reserve1, token1Entity);
  const reserve0Difference = reserve0Formatted.minus(oldToken0LockedValue);
  const reserve1Difference = reserve1Formatted.minus(oldToken1LockedValue);

  const poolTotalValueLockedToken0 = reserve0Formatted;
  const poolTotalValueLockedToken1 = reserve1Formatted;

  const poolTotalValueLockedUSD = poolTotalValueLockedToken0
    .times(token0Entity.usdPrice)
    .plus(poolTotalValueLockedToken1.times(token1Entity.usdPrice));

  const token0TotalTokenPooledAmount = token0Entity.totalTokenPooledAmount.plus(reserve0Difference);
  const token1TotalTokenPooledAmount = token1Entity.totalTokenPooledAmount.plus(reserve1Difference);

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
    mostLiquidPool_id: pickMostLiquidPoolForToken(token0Entity, poolEntity, token0SourcePricePoolEntity).id,
  };

  token1Entity = {
    ...token1Entity,
    totalTokenPooledAmount: token1TotalTokenPooledAmount,
    totalValuePooledUsd: token1TotalValuePooledUsd,
    mostLiquidPool_id: pickMostLiquidPoolForToken(token1Entity, poolEntity, token1SourcePricePoolEntity).id,
  };

  await v2PoolSetters.setIntervalDataTVL(eventTimestamp, poolEntity);

  context.Pool.set(poolEntity);
  context.Token.set(token0Entity);
  context.Token.set(token1Entity);
}
