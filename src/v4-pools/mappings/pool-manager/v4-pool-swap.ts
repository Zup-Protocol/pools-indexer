import { BigDecimal, handlerContext, Pool as PoolEntity, Token as TokenEntity } from "generated";
import { sqrtPriceX96toPrice } from "../../../common/cl-pool-converters";
import { getSwapVolumeFromAmounts } from "../../../common/pool-commons";
import { PoolSetters } from "../../../common/pool-setters";
import { formatFromTokenAmount } from "../../../common/token-commons";

export async function handleV4PoolSwap(
  context: handlerContext,
  poolEntity: PoolEntity,
  token0Entity: TokenEntity,
  token1Entity: TokenEntity,
  amount0: bigint,
  amount1: bigint,
  sqrtPriceX96: bigint,
  tick: bigint,
  swapFee: number,
  eventTimestamp: bigint,
  v4PoolSetters: PoolSetters
): Promise<void> {
  // Unlike V3, a negative amount represents that amount is being sent to the pool and vice versa, so invert the sign
  const amount0SignInverted = amount0 * -1n;
  const amount1SignInverted = amount1 * -1n;
  const tokenAmount0Formatted = formatFromTokenAmount(amount0, token0Entity).times(BigDecimal("-1"));
  const tokenAmount1Formatted = formatFromTokenAmount(amount1, token1Entity).times(BigDecimal("-1"));

  let v4PoolEntity = await context.V4PoolData.getOrThrow(poolEntity.id);

  poolEntity = {
    ...poolEntity,
    totalValueLockedToken0: poolEntity.totalValueLockedToken0.plus(tokenAmount0Formatted),
    totalValueLockedToken1: poolEntity.totalValueLockedToken1.plus(tokenAmount1Formatted),
  };

  [token0Entity, token1Entity] = await v4PoolSetters.updateTokenPricesFromPoolPrices(
    token0Entity,
    token1Entity,
    poolEntity,
    sqrtPriceX96toPrice(sqrtPriceX96, token0Entity, token1Entity)
  );

  const swapVolumeWithNewPrices = getSwapVolumeFromAmounts(
    tokenAmount0Formatted,
    tokenAmount1Formatted,
    token0Entity,
    token1Entity
  );

  const updatedPoolTotalValueLockedUSD = poolEntity.totalValueLockedToken0
    .times(token0Entity.usdPrice)
    .plus(poolEntity.totalValueLockedToken1.times(token1Entity.usdPrice));

  const updatedToken0TotalTokenPooledAmount = token0Entity.totalTokenPooledAmount.plus(tokenAmount0Formatted);
  const updatedToken1TotalTokenPooledAmount = token1Entity.totalTokenPooledAmount.plus(tokenAmount1Formatted);

  const updatedToken0TotalValuePooledUsd = updatedToken0TotalTokenPooledAmount.times(token0Entity.usdPrice);
  const updatedToken1TotalValuePooledUsd = updatedToken1TotalTokenPooledAmount.times(token1Entity.usdPrice);

  v4PoolEntity = {
    ...v4PoolEntity,
    sqrtPriceX96: sqrtPriceX96,
    tick: tick,
  };

  poolEntity = {
    ...poolEntity,
    currentFeeTier: swapFee,
    totalValueLockedUSD: updatedPoolTotalValueLockedUSD,
    swapVolumeToken0: poolEntity.swapVolumeToken0.plus(swapVolumeWithNewPrices.volumeToken0),
    swapVolumeToken1: poolEntity.swapVolumeToken1.plus(swapVolumeWithNewPrices.volumeToken1),
    swapVolumeUSD: poolEntity.swapVolumeUSD.plus(swapVolumeWithNewPrices.volumeUSD),
  };

  token0Entity = {
    ...token0Entity,
    totalTokenPooledAmount: updatedToken0TotalTokenPooledAmount,
    totalValuePooledUsd: updatedToken0TotalValuePooledUsd,
    tokenSwapVolume: token0Entity.tokenSwapVolume.plus(swapVolumeWithNewPrices.volumeToken0),
    swapVolumeUSD: token0Entity.swapVolumeUSD.plus(swapVolumeWithNewPrices.volumeToken0USD),
  };

  token1Entity = {
    ...token1Entity,
    totalTokenPooledAmount: updatedToken1TotalTokenPooledAmount,
    totalValuePooledUsd: updatedToken1TotalValuePooledUsd,
    tokenSwapVolume: token1Entity.tokenSwapVolume.plus(swapVolumeWithNewPrices.volumeToken1),
    swapVolumeUSD: token1Entity.swapVolumeUSD.plus(swapVolumeWithNewPrices.volumeToken1USD),
  };

  await v4PoolSetters.setIntervalSwapData(
    eventTimestamp,
    context,
    poolEntity,
    token0Entity,
    token1Entity,
    amount0SignInverted,
    amount1SignInverted,
    swapFee
  );

  context.Pool.set(poolEntity);
  context.Token.set(token0Entity);
  context.Token.set(token1Entity);
  context.V4PoolData.set(v4PoolEntity);
}
