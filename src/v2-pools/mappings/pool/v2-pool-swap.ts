import { HandlerContext, Pool as PoolEntity, Token as TokenEntity } from "generated";
import { PoolSetters } from "../../../common/pool-setters";
import { formatFromTokenAmount } from "../../../common/token-commons";
import { poolReservesToPrice } from "../../common/v2-pool-converters";

export async function handleV2PoolSwap(params: {
  context: HandlerContext;
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
  let rawAmount0 = params.amount0In - params.amount0Out;
  let rawAmount1 = params.amount1In - params.amount1Out;

  let tokenAmount0InFormatted = formatFromTokenAmount(params.amount0In, params.token0Entity);
  let tokenAmount1InFormatted = formatFromTokenAmount(params.amount1In, params.token1Entity);

  let tokenAmount0OutFormatted = formatFromTokenAmount(params.amount0Out, params.token0Entity);
  let tokenAmount1OutFormatted = formatFromTokenAmount(params.amount1Out, params.token1Entity);

  let amount0Formatted = tokenAmount0InFormatted.minus(tokenAmount0OutFormatted);
  let amount1Formatted = tokenAmount1InFormatted.minus(tokenAmount1OutFormatted);

  let newPoolReserve0Formatted = params.poolEntity.totalValueLockedToken0.plus(amount0Formatted);
  let newPoolReserve1Formatted = params.poolEntity.totalValueLockedToken1.plus(amount1Formatted);

  const newPrices = params.v2PoolSetters.getPricesForPoolWhitelistedTokens(
    params.token0Entity,
    params.token1Entity,
    poolReservesToPrice(newPoolReserve0Formatted, newPoolReserve1Formatted)
  );

  const poolTotalValueLockedToken0 = newPoolReserve0Formatted;
  const poolTotalValueLockedToken1 = newPoolReserve1Formatted;

  const poolTotalValueLockedUSD = poolTotalValueLockedToken0
    .times(newPrices.token0UpdatedPrice)
    .plus(poolTotalValueLockedToken1.times(newPrices.token1UpdatedPrice));

  const token0TotalTokenPooledAmount = params.token0Entity.totalTokenPooledAmount.plus(amount0Formatted);
  const token1TotalTokenPooledAmount = params.token1Entity.totalTokenPooledAmount.plus(amount1Formatted);

  const token0TotalValuePooledUsd = token0TotalTokenPooledAmount.times(newPrices.token0UpdatedPrice);
  const token1TotalValuePooledUsd = token1TotalTokenPooledAmount.times(newPrices.token1UpdatedPrice);

  params.poolEntity = {
    ...params.poolEntity,
    totalValueLockedToken0: poolTotalValueLockedToken0,
    totalValueLockedToken1: poolTotalValueLockedToken1,
    totalValueLockedUSD: poolTotalValueLockedUSD,
    currentFeeTier: params.updatedFeeTier ? params.updatedFeeTier : params.poolEntity.currentFeeTier,
  };

  params.token0Entity = {
    ...params.token0Entity,
    totalTokenPooledAmount: token0TotalTokenPooledAmount,
    totalValuePooledUsd: token0TotalValuePooledUsd,
    usdPrice: newPrices.token0UpdatedPrice,
  };

  params.token1Entity = {
    ...params.token1Entity,
    totalTokenPooledAmount: token1TotalTokenPooledAmount,
    totalValuePooledUsd: token1TotalValuePooledUsd,
    usdPrice: newPrices.token1UpdatedPrice,
  };

  await params.v2PoolSetters.setHourlyData(
    params.eventTimestamp,
    params.context,
    params.token0Entity,
    params.token1Entity,
    params.poolEntity,
    rawAmount0,
    rawAmount1
  );

  await params.v2PoolSetters.setDailyData(
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
