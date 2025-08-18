import { HandlerContext, Pool as PoolEntity, Token as TokenEntity } from "generated";
import { PoolSetters } from "../../../common/pool-setters";
import { formatFromTokenAmount } from "../../../common/token-commons";
import { poolReservesToPrice } from "../../common/v2-pool-converters";

export async function handleV2PoolSwap(
  context: HandlerContext,
  poolEntity: PoolEntity,
  token0Entity: TokenEntity,
  token1Entity: TokenEntity,
  amount0In: bigint,
  amount1In: bigint,
  amount0Out: bigint,
  amount1Out: bigint,
  eventTimestamp: bigint,
  v2PoolSetters: PoolSetters,
  feeTier: number = 0
): Promise<void> {
  let rawAmount0 = amount0In - amount0Out;
  let rawAmount1 = amount1In - amount1Out;

  let tokenAmount0InFormatted = formatFromTokenAmount(amount0In, token0Entity);
  let tokenAmount1InFormatted = formatFromTokenAmount(amount1In, token1Entity);

  let tokenAmount0OutFormatted = formatFromTokenAmount(amount0Out, token0Entity);
  let tokenAmount1OutFormatted = formatFromTokenAmount(amount1Out, token1Entity);

  let amount0Formatted = tokenAmount0InFormatted.minus(tokenAmount0OutFormatted);
  let amount1Formatted = tokenAmount1InFormatted.minus(tokenAmount1OutFormatted);

  let newPoolReserve0Formatted = poolEntity.totalValueLockedToken0.plus(amount0Formatted);
  let newPoolReserve1Formatted = poolEntity.totalValueLockedToken1.plus(amount1Formatted);

  const newPrices = v2PoolSetters.getPricesForPoolWhitelistedTokens(
    token0Entity,
    token1Entity,
    poolReservesToPrice(newPoolReserve0Formatted, newPoolReserve1Formatted)
  );

  const poolTotalValueLockedToken0 = newPoolReserve0Formatted;
  const poolTotalValueLockedToken1 = newPoolReserve1Formatted;

  const poolTotalValueLockedUSD = poolEntity.totalValueLockedToken0
    .times(newPrices.token0UpdatedPrice)
    .plus(poolEntity.totalValueLockedToken1.times(newPrices.token1UpdatedPrice));

  const token0TotalTokenPooledAmount = token0Entity.totalTokenPooledAmount.plus(amount0Formatted);
  const token1TotalTokenPooledAmount = token1Entity.totalTokenPooledAmount.plus(amount1Formatted);

  const token0TotalValuePooledUsd = token0Entity.totalTokenPooledAmount.times(newPrices.token0UpdatedPrice);
  const token1TotalValuePooledUsd = token1Entity.totalTokenPooledAmount.times(newPrices.token1UpdatedPrice);

  poolEntity = {
    ...poolEntity,
    totalValueLockedToken0: poolTotalValueLockedToken0,
    totalValueLockedToken1: poolTotalValueLockedToken1,
    totalValueLockedUSD: poolTotalValueLockedUSD,
    currentFeeTier: feeTier != 0 ? feeTier : poolEntity.currentFeeTier,
  };

  token0Entity = {
    ...token0Entity,
    totalTokenPooledAmount: token0TotalTokenPooledAmount,
    totalValuePooledUsd: token0TotalValuePooledUsd,
    usdPrice: newPrices.token0UpdatedPrice,
  };

  token1Entity = {
    ...token1Entity,
    totalTokenPooledAmount: token1TotalTokenPooledAmount,
    totalValuePooledUsd: token1TotalValuePooledUsd,
    usdPrice: newPrices.token1UpdatedPrice,
  };

  await v2PoolSetters.setHourlyData(
    eventTimestamp,
    context,
    token0Entity,
    token1Entity,
    poolEntity,
    rawAmount0,
    rawAmount1
  );

  await v2PoolSetters.setDailyData(
    eventTimestamp,
    context,
    poolEntity,
    token0Entity,
    token1Entity,
    rawAmount0,
    rawAmount1
  );

  context.Pool.set(poolEntity);
  context.Token.set(token0Entity);
  context.Token.set(token1Entity);
}
