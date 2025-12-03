import { handlerContext, Pool as PoolEntity, Token as TokenEntity } from "generated";
import { DeFiPoolDataSetters } from "../../../common/defi-pool-data-setters";
import { PoolSetters } from "../../../common/pool-setters";
import { formatFromTokenAmount, pickMostLiquidPoolForToken } from "../../../common/token-commons";

export async function handleV3PoolMint(
  context: handlerContext,
  poolEntity: PoolEntity,
  token0Entity: TokenEntity,
  token1Entity: TokenEntity,
  amount0: bigint,
  amount1: bigint,
  eventTimestamp: bigint,
  v3PoolSetters: PoolSetters,
  defiPoolDataSetters: DeFiPoolDataSetters
): Promise<void> {
  let [token0SourcePricePoolEntity, token1SourcePricePoolEntity]: [PoolEntity | undefined, PoolEntity | undefined] =
    await Promise.all([
      context.Pool.get(token0Entity.mostLiquidPool_id),
      context.Pool.get(token1Entity.mostLiquidPool_id),
    ]);

  const token0FormattedAmount = formatFromTokenAmount(amount0, token0Entity);
  const token1FormattedAmount = formatFromTokenAmount(amount1, token1Entity);

  const updatedPoolTotalValueLockedToken0 = poolEntity.totalValueLockedToken0.plus(token0FormattedAmount);
  const updatedPoolTotalValueLockedToken1 = poolEntity.totalValueLockedToken1.plus(token1FormattedAmount);

  const updatedToken0TotalTokenPooledAmount = token0Entity.totalTokenPooledAmount.plus(token0FormattedAmount);
  const updatedToken1TotalTokenPooledAmount = token1Entity.totalTokenPooledAmount.plus(token1FormattedAmount);

  const updatedToken0TotalValuePooledUsd = updatedToken0TotalTokenPooledAmount.times(token0Entity.usdPrice);
  const updatedToken1TotalValuePooledUsd = updatedToken1TotalTokenPooledAmount.times(token1Entity.usdPrice);

  const updatedPoolTotalValueLockedUSD = updatedPoolTotalValueLockedToken0
    .times(token0Entity.usdPrice)
    .plus(updatedPoolTotalValueLockedToken1.times(token1Entity.usdPrice));

  const operationVolumeUSD = token0FormattedAmount
    .times(token0Entity.usdPrice)
    .plus(token1FormattedAmount.times(token1Entity.usdPrice));

  poolEntity = {
    ...poolEntity,
    totalValueLockedToken0: updatedPoolTotalValueLockedToken0,
    totalValueLockedToken1: updatedPoolTotalValueLockedToken1,
    totalValueLockedUSD: updatedPoolTotalValueLockedUSD,
    liquidityVolumeToken0: poolEntity.liquidityVolumeToken0.plus(token0FormattedAmount),
    liquidityVolumeToken1: poolEntity.liquidityVolumeToken1.plus(token1FormattedAmount),
    liquidityVolumeUSD: poolEntity.liquidityVolumeUSD.plus(operationVolumeUSD),
  };

  token0Entity = {
    ...token0Entity,
    totalTokenPooledAmount: updatedToken0TotalTokenPooledAmount,
    totalValuePooledUsd: updatedToken0TotalValuePooledUsd,
    tokenLiquidityVolume: token0Entity.tokenLiquidityVolume.plus(token0FormattedAmount),
    liquidityVolumeUSD: token0Entity.liquidityVolumeUSD.plus(token0FormattedAmount.times(token0Entity.usdPrice)),
    mostLiquidPool_id: pickMostLiquidPoolForToken(token0Entity, poolEntity, token0SourcePricePoolEntity).id,
  };

  token1Entity = {
    ...token1Entity,
    totalTokenPooledAmount: updatedToken1TotalTokenPooledAmount,
    totalValuePooledUsd: updatedToken1TotalValuePooledUsd,
    tokenLiquidityVolume: token1Entity.tokenLiquidityVolume.plus(token1FormattedAmount),
    liquidityVolumeUSD: token1Entity.liquidityVolumeUSD.plus(token1FormattedAmount.times(token1Entity.usdPrice)),
    mostLiquidPool_id: pickMostLiquidPoolForToken(token1Entity, poolEntity, token1SourcePricePoolEntity).id,
  };

  // TODO: Maybe implement -> Currently removed as is not needed and it makes the sync slower
  // if (isPoolSwapVolumeValid(poolEntity)) {
  //   await defiPoolDataSetters.setIntervalLiquidityData(
  //     eventTimestamp,
  //     defiPoolDataEntity,
  //     amount0,
  //     amount1,
  //     token0Entity,
  //     token1Entity
  //   );
  // }

  await v3PoolSetters.setIntervalDataTVL(eventTimestamp, poolEntity);
  await v3PoolSetters.setLiquidityIntervalData({
    eventTimestamp,
    amount0AddedOrRemoved: amount0,
    amount1AddedOrRemoved: amount1,
    poolEntity,
    token0: token0Entity,
    token1: token1Entity,
  });

  poolEntity = await v3PoolSetters.updatePoolAccumulatedYield(eventTimestamp, poolEntity);

  context.Pool.set(poolEntity);
  context.Token.set(token0Entity);
  context.Token.set(token1Entity);
}
