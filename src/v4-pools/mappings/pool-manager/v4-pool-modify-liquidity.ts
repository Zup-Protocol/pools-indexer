import { handlerContext, Pool as PoolEntity, Token as TokenEntity, V4PoolData as V4PoolDataEntity } from "generated";
import { DeFiPoolDataSetters } from "../../../common/defi-pool-data-setters";
import { PoolSetters } from "../../../common/pool-setters";
import { formatFromTokenAmount, pickMostLiquidPoolForToken } from "../../../common/token-commons";
import { getAmount0, getAmount1 } from "../../common/liquidity-amounts";

export async function handleV4PoolModifyLiquidity(
  context: handlerContext,
  poolEntity: PoolEntity,
  token0Entity: TokenEntity,
  token1Entity: TokenEntity,
  liqudityDelta: bigint,
  tickLower: number,
  tickUpper: number,
  eventTimestamp: bigint,
  v4PoolSetters: PoolSetters,
  defiPoolDataSetters: DeFiPoolDataSetters
): Promise<void> {
  let [v4PoolEntity, token0SourcePricePoolEntity, token1SourcePricePoolEntity]: [
    V4PoolDataEntity,
    PoolEntity | undefined,
    PoolEntity | undefined
  ] = await Promise.all([
    context.V4PoolData.getOrThrow(poolEntity.id),
    context.Pool.get(token0Entity.mostLiquidPool_id),
    context.Pool.get(token1Entity.mostLiquidPool_id),
  ]);

  const amount0 = getAmount0(tickLower, tickUpper, v4PoolEntity.tick, liqudityDelta, v4PoolEntity.sqrtPriceX96);
  const amount1 = getAmount1(tickLower, tickUpper, v4PoolEntity.tick, liqudityDelta, v4PoolEntity.sqrtPriceX96);
  const amount0Formatted = formatFromTokenAmount(amount0, token0Entity);
  const amount1Formatted = formatFromTokenAmount(amount1, token1Entity);

  const updatedPoolTotalValueLockedToken0 = poolEntity.totalValueLockedToken0.plus(amount0Formatted);
  const updatedPoolTotalValueLockedToken1 = poolEntity.totalValueLockedToken1.plus(amount1Formatted);

  const updatedPoolTotalValueLockedUSD = updatedPoolTotalValueLockedToken0
    .times(token0Entity.usdPrice)
    .plus(updatedPoolTotalValueLockedToken1.times(token1Entity.usdPrice));

  const updatedToken0TotalTokenPooledAmount = token0Entity.totalTokenPooledAmount.plus(amount0Formatted);
  const updatedToken1TotalTokenPooledAmount = token1Entity.totalTokenPooledAmount.plus(amount1Formatted);

  const updatedToken0TotalValuePooledUsd = updatedToken0TotalTokenPooledAmount.times(token0Entity.usdPrice);
  const updatedToken1TotalValuePooledUsd = updatedToken1TotalTokenPooledAmount.times(token1Entity.usdPrice);

  const operationVolumeUSD = amount0Formatted
    .abs()
    .times(token0Entity.usdPrice)
    .plus(amount1Formatted.abs().times(token1Entity.usdPrice));

  poolEntity = {
    ...poolEntity,
    totalValueLockedToken0: updatedPoolTotalValueLockedToken0,
    totalValueLockedToken1: updatedPoolTotalValueLockedToken1,
    totalValueLockedUSD: updatedPoolTotalValueLockedUSD,
    liquidityVolumeUSD: poolEntity.liquidityVolumeUSD.plus(operationVolumeUSD),
    liquidityVolumeToken0: poolEntity.liquidityVolumeToken0.plus(amount0Formatted.abs()),
    liquidityVolumeToken1: poolEntity.liquidityVolumeToken1.plus(amount1Formatted.abs()),
  };

  token0Entity = {
    ...token0Entity,
    totalTokenPooledAmount: updatedToken0TotalTokenPooledAmount,
    totalValuePooledUsd: updatedToken0TotalValuePooledUsd,
    tokenLiquidityVolume: token0Entity.tokenLiquidityVolume.plus(amount0Formatted.abs()),
    liquidityVolumeUSD: token0Entity.liquidityVolumeUSD.plus(amount0Formatted.abs().times(token0Entity.usdPrice)),
    mostLiquidPool_id: pickMostLiquidPoolForToken(token0Entity, poolEntity, token0SourcePricePoolEntity).id,
  };

  token1Entity = {
    ...token1Entity,
    totalTokenPooledAmount: updatedToken1TotalTokenPooledAmount,
    totalValuePooledUsd: updatedToken1TotalValuePooledUsd,
    tokenLiquidityVolume: token1Entity.tokenLiquidityVolume.plus(amount1Formatted.abs()),
    liquidityVolumeUSD: token1Entity.liquidityVolumeUSD.plus(amount1Formatted.abs().times(token1Entity.usdPrice)),
    mostLiquidPool_id: pickMostLiquidPoolForToken(token1Entity, poolEntity, token1SourcePricePoolEntity).id,
  };

  // TODO: Maybe implement -> Currently removed as is not needed and it makes the sync slower
  // if (isPoolSwapVolumeValid(poolEntity)) {
  //   await defiPoolDataSetters.setIntervalLiquidityData(
  //     eventTimestamp,
  //     defiPoolData,
  //     amount0,
  //     amount1,
  //     token0Entity,
  //     token1Entity
  //   );
  // }

  await v4PoolSetters.setIntervalDataTVL(eventTimestamp, poolEntity);
  await v4PoolSetters.setLiquidityIntervalData({
    eventTimestamp,
    amount0AddedOrRemoved: amount0,
    amount1AddedOrRemoved: amount1,
    poolEntity,
    token0: token0Entity,
    token1: token1Entity,
  });

  poolEntity = await v4PoolSetters.updatePoolAccumulatedYield(eventTimestamp, poolEntity);

  context.Pool.set(poolEntity);
  context.Token.set(token0Entity);
  context.Token.set(token1Entity);
}
