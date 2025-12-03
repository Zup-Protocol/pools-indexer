import { handlerContext, Pool as PoolEntity, Token as TokenEntity, V3PoolData as V3PoolDataEntity } from "generated";
import { sqrtPriceX96toPrice } from "../../../common/cl-pool-converters";
import { getSwapFeesFromRawAmounts, getSwapVolumeFromAmounts } from "../../../common/pool-commons";
import { PoolSetters } from "../../../common/pool-setters";
import { formatFromTokenAmount } from "../../../common/token-commons";

export async function handleV3PoolSwap(params: {
  context: handlerContext;
  poolEntity: PoolEntity;
  v3PoolEntity: V3PoolDataEntity;
  token0Entity: TokenEntity;
  token1Entity: TokenEntity;
  swapAmount0: bigint;
  swapAmount1: bigint;
  sqrtPriceX96: bigint;
  tick: bigint;
  eventTimestamp: bigint;
  v3PoolSetters: PoolSetters;
  newFeeTier?: number;
  overrideSingleSwapFee?: number;
}): Promise<void> {
  const tokenAmount0Formatted = formatFromTokenAmount(params.swapAmount0, params.token0Entity);
  const tokenAmount1Formatted = formatFromTokenAmount(params.swapAmount1, params.token1Entity);

  params.poolEntity = {
    ...params.poolEntity,
    totalValueLockedToken0: params.poolEntity.totalValueLockedToken0.plus(tokenAmount0Formatted),
    totalValueLockedToken1: params.poolEntity.totalValueLockedToken1.plus(tokenAmount1Formatted),
  };

  [params.token0Entity, params.token1Entity] = await params.v3PoolSetters.updateTokenPricesFromPoolPrices(
    params.token0Entity,
    params.token1Entity,
    params.poolEntity,
    sqrtPriceX96toPrice(params.sqrtPriceX96, params.token0Entity, params.token1Entity)
  );

  const swapVolumeWithNewPrices = getSwapVolumeFromAmounts(
    tokenAmount0Formatted,
    tokenAmount1Formatted,
    params.token0Entity,
    params.token1Entity
  );

  const updatedPoolTotalValueLockedUSD = params.poolEntity.totalValueLockedToken0
    .times(params.token0Entity.usdPrice)
    .plus(params.poolEntity.totalValueLockedToken1.times(params.token1Entity.usdPrice));

  const updatedToken0TotalTokenPooledAmount = params.token0Entity.totalTokenPooledAmount.plus(tokenAmount0Formatted);
  const updatedToken1TotalTokenPooledAmount = params.token1Entity.totalTokenPooledAmount.plus(tokenAmount1Formatted);

  const updatedToken0TotalValuePooledUsd = updatedToken0TotalTokenPooledAmount.times(params.token0Entity.usdPrice);
  const updatedToken1TotalValuePooledUsd = updatedToken1TotalTokenPooledAmount.times(params.token1Entity.usdPrice);

  const swapFees = getSwapFeesFromRawAmounts(
    params.swapAmount0,
    params.swapAmount1,
    params.overrideSingleSwapFee ?? params.newFeeTier ?? params.poolEntity.currentFeeTier,
    params.token0Entity,
    params.token1Entity
  );

  const swapYield = swapFees.feesUSD.div(updatedPoolTotalValueLockedUSD).times(100);

  params.v3PoolEntity = {
    ...params.v3PoolEntity,
    sqrtPriceX96: params.sqrtPriceX96,
    tick: params.tick,
  };

  params.poolEntity = {
    ...params.poolEntity,
    totalValueLockedUSD: updatedPoolTotalValueLockedUSD,
    currentFeeTier: params.newFeeTier ?? params.poolEntity.currentFeeTier,
    swapVolumeToken0: params.poolEntity.swapVolumeToken0.plus(swapVolumeWithNewPrices.volumeToken0),
    swapVolumeToken1: params.poolEntity.swapVolumeToken1.plus(swapVolumeWithNewPrices.volumeToken1),
    swapVolumeUSD: params.poolEntity.swapVolumeUSD.plus(swapVolumeWithNewPrices.volumeUSD),
    totalAccumulatedYield: params.poolEntity.totalAccumulatedYield.plus(swapYield),
    accumulated24hYield: params.poolEntity.accumulated24hYield.plus(swapYield),
    accumulated7dYield: params.poolEntity.accumulated7dYield.plus(swapYield),
    accumulated30dYield: params.poolEntity.accumulated30dYield.plus(swapYield),
    accumulated90dYield: params.poolEntity.accumulated90dYield.plus(swapYield),
  };

  params.token0Entity = {
    ...params.token0Entity,
    totalTokenPooledAmount: updatedToken0TotalTokenPooledAmount,
    totalValuePooledUsd: updatedToken0TotalValuePooledUsd,
    tokenSwapVolume: params.token0Entity.tokenSwapVolume.plus(swapVolumeWithNewPrices.volumeToken0),
    swapVolumeUSD: params.token0Entity.swapVolumeUSD.plus(swapVolumeWithNewPrices.volumeToken0USD),
  };

  params.token1Entity = {
    ...params.token1Entity,
    totalTokenPooledAmount: updatedToken1TotalTokenPooledAmount,
    totalValuePooledUsd: updatedToken1TotalValuePooledUsd,
    tokenSwapVolume: params.token1Entity.tokenSwapVolume.plus(swapVolumeWithNewPrices.volumeToken1),
    swapVolumeUSD: params.token1Entity.swapVolumeUSD.plus(swapVolumeWithNewPrices.volumeToken1USD),
  };

  await params.v3PoolSetters.setIntervalSwapData(
    params.eventTimestamp,
    params.context,
    params.poolEntity,
    params.token0Entity,
    params.token1Entity,
    params.swapAmount0,
    params.swapAmount1,
    params.overrideSingleSwapFee
  );

  params.poolEntity = await params.v3PoolSetters.updatePoolAccumulatedYield(params.eventTimestamp, params.poolEntity);

  params.context.Pool.set(params.poolEntity);
  params.context.Token.set(params.token0Entity);
  params.context.Token.set(params.token1Entity);
  params.context.V3PoolData.set(params.v3PoolEntity);
}
