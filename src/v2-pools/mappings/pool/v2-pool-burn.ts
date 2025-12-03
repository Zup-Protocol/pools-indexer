import { handlerContext, Pool as PoolEntity, Token as TokenEntity } from "generated";
import { DeFiPoolDataSetters } from "../../../common/defi-pool-data-setters";
import { PoolSetters } from "../../../common/pool-setters";
import { formatFromTokenAmount, pickMostLiquidPoolForToken } from "../../../common/token-commons";

export async function handleV2PoolBurn(
  context: handlerContext,
  poolEntity: PoolEntity,
  token0Entity: TokenEntity,
  token1Entity: TokenEntity,
  amount0: bigint,
  amount1: bigint,
  eventTimestamp: bigint,
  v2PoolSetters: PoolSetters,
  defiPoolDataSetters: DeFiPoolDataSetters
): Promise<void> {
  let [token0SourcePricePoolEntity, token1SourcePricePoolEntity]: [PoolEntity | undefined, PoolEntity | undefined] =
    await Promise.all([
      context.Pool.get(token0Entity.mostLiquidPool_id),
      context.Pool.get(token1Entity.mostLiquidPool_id),
    ]);

  const formattedToken0BurnedAmount = formatFromTokenAmount(amount0, token0Entity);
  const formattedToken1BurnedAmount = formatFromTokenAmount(amount1, token1Entity);

  const updatedPoolTotalValueLockedToken0 = poolEntity.totalValueLockedToken0.minus(formattedToken0BurnedAmount);
  const updatedPoolTotalValueLockedToken1 = poolEntity.totalValueLockedToken1.minus(formattedToken1BurnedAmount);

  const updatedPoolTotalValueLockedUSD = updatedPoolTotalValueLockedToken0
    .times(token0Entity.usdPrice)
    .plus(updatedPoolTotalValueLockedToken1.times(token1Entity.usdPrice));

  const updatedToken0TotalTokenPooledAmount = token0Entity.totalTokenPooledAmount.minus(formattedToken0BurnedAmount);
  const updatedToken1TotalTokenPooledAmount = token1Entity.totalTokenPooledAmount.minus(formattedToken1BurnedAmount);

  const updatedToken0TotalValuePooledUsd = updatedToken0TotalTokenPooledAmount.times(token0Entity.usdPrice);
  const updatedToken1TotalValuePooledUsd = updatedToken1TotalTokenPooledAmount.times(token1Entity.usdPrice);

  const operationVolumeUSD = formattedToken0BurnedAmount
    .times(token0Entity.usdPrice)
    .plus(formattedToken1BurnedAmount.times(token1Entity.usdPrice));

  poolEntity = {
    ...poolEntity,
    totalValueLockedToken0: updatedPoolTotalValueLockedToken0,
    totalValueLockedToken1: updatedPoolTotalValueLockedToken1,
    totalValueLockedUSD: updatedPoolTotalValueLockedUSD,
    liquidityVolumeToken0: poolEntity.liquidityVolumeToken0.plus(formattedToken0BurnedAmount),
    liquidityVolumeToken1: poolEntity.liquidityVolumeToken1.plus(formattedToken1BurnedAmount),
    liquidityVolumeUSD: poolEntity.liquidityVolumeUSD.plus(operationVolumeUSD),
  };

  token0Entity = {
    ...token0Entity,
    totalTokenPooledAmount: updatedToken0TotalTokenPooledAmount,
    totalValuePooledUsd: updatedToken0TotalValuePooledUsd,
    tokenLiquidityVolume: token0Entity.tokenLiquidityVolume.plus(formattedToken0BurnedAmount),
    liquidityVolumeUSD: token0Entity.liquidityVolumeUSD.plus(formattedToken0BurnedAmount.times(token0Entity.usdPrice)),
    mostLiquidPool_id: pickMostLiquidPoolForToken(token0Entity, poolEntity, token0SourcePricePoolEntity).id,
  };

  token1Entity = {
    ...token1Entity,
    totalTokenPooledAmount: updatedToken1TotalTokenPooledAmount,
    totalValuePooledUsd: updatedToken1TotalValuePooledUsd,
    tokenLiquidityVolume: token1Entity.tokenLiquidityVolume.plus(formattedToken1BurnedAmount),
    liquidityVolumeUSD: token1Entity.liquidityVolumeUSD.plus(formattedToken1BurnedAmount.times(token1Entity.usdPrice)),
    mostLiquidPool_id: pickMostLiquidPoolForToken(token1Entity, poolEntity, token1SourcePricePoolEntity).id,
  };

  await v2PoolSetters.setIntervalDataTVL(eventTimestamp, poolEntity);
  await v2PoolSetters.setLiquidityIntervalData({
    eventTimestamp,
    poolEntity,
    token0: token0Entity,
    token1: token1Entity,
    amount0AddedOrRemoved: -amount0,
    amount1AddedOrRemoved: -amount1,
  });

  // TODO: Maybe implement -> Currently removed as is not needed and it makes the sync slower
  // if (isPoolSwapVolumeValid(poolEntity)) {
  //   await defiPoolDataSetters.setIntervalLiquidityData(
  //     eventTimestamp,
  //     defiPoolData,
  //     -amount0,
  //     -amount1,
  //     token0Entity,
  //     token1Entity
  //   );
  // }

  poolEntity = await v2PoolSetters.updatePoolAccumulatedYield(eventTimestamp, poolEntity);

  context.Pool.set(poolEntity);
  context.Token.set(token0Entity);
  context.Token.set(token1Entity);
}
