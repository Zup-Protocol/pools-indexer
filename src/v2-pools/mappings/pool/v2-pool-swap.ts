import { handlerContext, Pool as PoolEntity, Token as TokenEntity } from "generated";
import { getSwapVolumeFromAmounts } from "../../../common/pool-commons";
import { PoolSetters } from "../../../common/pool-setters";
import { formatFromTokenAmount } from "../../../common/token-commons";
import { poolReservesToPrice } from "../../common/v2-pool-converters";

export async function handleV2PoolSwap(params: {
  context: handlerContext;
  poolEntity: PoolEntity;
  token0Entity: TokenEntity;
  token1Entity: TokenEntity;
  amount0In: bigint;
  amount1In: bigint;
  amount0Out: bigint;
  amount1Out: bigint;
  eventTimestamp: bigint;
  v2PoolSetters: PoolSetters;
  updatedFeeTier?: number;
}): Promise<void> {
  const rawAmount0 = params.amount0In - params.amount0Out;
  const rawAmount1 = params.amount1In - params.amount1Out;

  const tokenAmount0InFormatted = formatFromTokenAmount(params.amount0In, params.token0Entity);
  const tokenAmount1InFormatted = formatFromTokenAmount(params.amount1In, params.token1Entity);

  const tokenAmount0OutFormatted = formatFromTokenAmount(params.amount0Out, params.token0Entity);
  const tokenAmount1OutFormatted = formatFromTokenAmount(params.amount1Out, params.token1Entity);

  const amount0Formatted = tokenAmount0InFormatted.minus(tokenAmount0OutFormatted);
  const amount1Formatted = tokenAmount1InFormatted.minus(tokenAmount1OutFormatted);

  params.poolEntity = {
    ...params.poolEntity,
    totalValueLockedToken0: params.poolEntity.totalValueLockedToken0.plus(amount0Formatted),
    totalValueLockedToken1: params.poolEntity.totalValueLockedToken1.plus(amount1Formatted),
  };

  [params.token0Entity, params.token1Entity] = await params.v2PoolSetters.updateTokenPricesFromPoolPrices(
    params.token0Entity,
    params.token1Entity,
    params.poolEntity,
    poolReservesToPrice(params.poolEntity.totalValueLockedToken0, params.poolEntity.totalValueLockedToken1)
  );

  const swapVolumeWithNewPrices = getSwapVolumeFromAmounts(
    amount0Formatted,
    amount1Formatted,
    params.token0Entity,
    params.token1Entity
  );

  const updatedPoolTotalValueLockedUSD = params.poolEntity.totalValueLockedToken0
    .times(params.token0Entity.usdPrice)
    .plus(params.poolEntity.totalValueLockedToken1.times(params.token1Entity.usdPrice));

  const updatedToken0TotalTokenPooledAmount = params.token0Entity.totalTokenPooledAmount.plus(amount0Formatted);
  const updatedToken1TotalTokenPooledAmount = params.token1Entity.totalTokenPooledAmount.plus(amount1Formatted);

  const updatedToken0TotalValuePooledUsd = updatedToken0TotalTokenPooledAmount.times(params.token0Entity.usdPrice);
  const updatedToken1TotalValuePooledUsd = updatedToken1TotalTokenPooledAmount.times(params.token1Entity.usdPrice);

  params.poolEntity = {
    ...params.poolEntity,
    totalValueLockedUSD: updatedPoolTotalValueLockedUSD,
    currentFeeTier: params.updatedFeeTier ?? params.poolEntity.currentFeeTier,
    swapVolumeToken0: params.poolEntity.swapVolumeToken0.plus(swapVolumeWithNewPrices.volumeToken0),
    swapVolumeToken1: params.poolEntity.swapVolumeToken1.plus(swapVolumeWithNewPrices.volumeToken1),
    swapVolumeUSD: params.poolEntity.swapVolumeUSD.plus(swapVolumeWithNewPrices.volumeUSD),
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

  await params.v2PoolSetters.setIntervalSwapData(
    params.eventTimestamp,
    params.context,
    params.poolEntity,
    params.token0Entity,
    params.token1Entity,
    rawAmount0,
    rawAmount1
  );

  params.context.Pool.set(params.poolEntity);
  params.context.Token.set(params.token0Entity);
  params.context.Token.set(params.token1Entity);
}
