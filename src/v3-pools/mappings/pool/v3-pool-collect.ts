import { handlerContext, Pool as PoolEntity, Token as TokenEntity } from "generated";
import { PoolSetters } from "../../../common/pool-setters";
import { formatFromTokenAmount, pickMostLiquidPoolForToken } from "../../../common/token-commons";

export async function handleV3PoolCollect(
  context: handlerContext,
  poolEntity: PoolEntity,
  token0Entity: TokenEntity,
  token1Entity: TokenEntity,
  amount0: bigint,
  amount1: bigint,
  eventTimestamp: bigint,
  v3PoolSetters: PoolSetters
): Promise<void> {
  let [token0SourcePricePoolEntity, token1SourcePricePoolEntity]: [PoolEntity | undefined, PoolEntity | undefined] =
    await Promise.all([
      context.Pool.get(token0Entity.mostLiquidPool_id),
      context.Pool.get(token1Entity.mostLiquidPool_id),
    ]);

  const formattedToken0CollectedAmount = formatFromTokenAmount(amount0, token0Entity);
  const formattedToken1CollectAmount = formatFromTokenAmount(amount1, token1Entity);

  const updatedPoolTotalValueLockedToken0 = poolEntity.totalValueLockedToken0.minus(formattedToken0CollectedAmount);
  const updatedPoolTotalValueLockedToken1 = poolEntity.totalValueLockedToken1.minus(formattedToken1CollectAmount);

  const updatedToken0TotalTokenPooledAmount = token0Entity.totalTokenPooledAmount.minus(formattedToken0CollectedAmount);
  const updatedToken1TotalTokenPooledAmount = token1Entity.totalTokenPooledAmount.minus(formattedToken1CollectAmount);

  const updatedToken0TotalValuePooledUsd = updatedToken0TotalTokenPooledAmount.times(token0Entity.usdPrice);
  const updatedToken1TotalValuePooledUsd = updatedToken1TotalTokenPooledAmount.times(token1Entity.usdPrice);

  const updatedPoolTotalValueLockedUSD = updatedPoolTotalValueLockedToken0
    .times(token0Entity.usdPrice)
    .plus(updatedPoolTotalValueLockedToken1.times(token1Entity.usdPrice));

  poolEntity = {
    ...poolEntity,
    totalValueLockedToken0: updatedPoolTotalValueLockedToken0,
    totalValueLockedToken1: updatedPoolTotalValueLockedToken1,
    totalValueLockedUSD: updatedPoolTotalValueLockedUSD,
  };

  token0Entity = {
    ...token0Entity,
    totalTokenPooledAmount: updatedToken0TotalTokenPooledAmount,
    totalValuePooledUsd: updatedToken0TotalValuePooledUsd,
    mostLiquidPool_id: pickMostLiquidPoolForToken(token0Entity, poolEntity, token0SourcePricePoolEntity).id,
  };

  token1Entity = {
    ...token1Entity,
    totalTokenPooledAmount: updatedToken1TotalTokenPooledAmount,
    totalValuePooledUsd: updatedToken1TotalValuePooledUsd,
    mostLiquidPool_id: pickMostLiquidPoolForToken(token1Entity, poolEntity, token1SourcePricePoolEntity).id,
  };

  await v3PoolSetters.setIntervalDataTVL(eventTimestamp, poolEntity);
  poolEntity = await v3PoolSetters.updatePoolAccumulatedYield(eventTimestamp, poolEntity);

  context.Pool.set(poolEntity);
  context.Token.set(token0Entity);
  context.Token.set(token1Entity);
}
