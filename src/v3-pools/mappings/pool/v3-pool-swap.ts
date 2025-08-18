import { HandlerContext, Pool as PoolEntity, Token as TokenEntity } from "generated";
import { PoolSetters } from "../../../common/pool-setters";
import { formatFromTokenAmount } from "../../../common/token-commons";
import { sqrtPriceX96toPrice } from "../../common/v3-v4-pool-converters";

export async function handleV3PoolSwap(params: {
  context: HandlerContext;
  poolEntity: PoolEntity;
  token0Entity: TokenEntity;
  token1Entity: TokenEntity;
  amount0: bigint;
  amount1: bigint;
  sqrtPriceX96: bigint;
  tick: bigint;
  eventTimestamp: bigint;
  v3PoolSetters: PoolSetters;
  newFeeTier?: number;
  overrideSingleSwapFee?: number;
}): Promise<void> {
  const tokenAmount0Formatted = formatFromTokenAmount(params.amount0, params.token0Entity);
  const tokenAmount1Formatted = formatFromTokenAmount(params.amount1, params.token1Entity);
  let v3PoolEntity = (await params.context.V3PoolData.get(params.poolEntity.id))!;

  const newPrices = params.v3PoolSetters.getPricesForPoolWhitelistedTokens(
    params.token0Entity,
    params.token1Entity,
    sqrtPriceX96toPrice(params.sqrtPriceX96, params.token0Entity, params.token1Entity)
  );

  const poolTotalValueLockedToken0 = params.poolEntity.totalValueLockedToken0.plus(tokenAmount0Formatted);
  const poolTotalValueLockedToken1 = params.poolEntity.totalValueLockedToken1.plus(tokenAmount1Formatted);

  const poolTotalValueLockedUSD = params.poolEntity.totalValueLockedToken0
    .times(newPrices.token0UpdatedPrice)
    .plus(params.poolEntity.totalValueLockedToken1.times(newPrices.token1UpdatedPrice));

  const token0TotalTokenPooledAmount = params.token0Entity.totalTokenPooledAmount.plus(tokenAmount0Formatted);
  const token1TotalTokenPooledAmount = params.token1Entity.totalTokenPooledAmount.plus(tokenAmount1Formatted);

  const token0TotalValuePooledUsd = params.token0Entity.totalTokenPooledAmount.times(newPrices.token0UpdatedPrice);
  const token1TotalValuePooledUsd = params.token1Entity.totalTokenPooledAmount.times(newPrices.token1UpdatedPrice);

  v3PoolEntity = {
    ...v3PoolEntity,
    sqrtPriceX96: params.sqrtPriceX96,
    tick: params.tick,
  };

  params.poolEntity = {
    ...params.poolEntity,
    totalValueLockedToken0: poolTotalValueLockedToken0,
    totalValueLockedToken1: poolTotalValueLockedToken1,
    totalValueLockedUSD: poolTotalValueLockedUSD,
    currentFeeTier: params.newFeeTier ?? params.poolEntity.currentFeeTier,
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

  await params.v3PoolSetters.setHourlyData(
    params.eventTimestamp,
    params.context,
    params.token0Entity,
    params.token1Entity,
    params.poolEntity,
    params.amount0,
    params.amount1,
    params.overrideSingleSwapFee
  );

  await params.v3PoolSetters.setDailyData(
    params.eventTimestamp,
    params.context,
    params.poolEntity,
    params.token0Entity,
    params.token1Entity,
    params.amount0,
    params.amount1,
    params.overrideSingleSwapFee
  );

  params.context.Pool.set(params.poolEntity);
  params.context.Token.set(params.token0Entity);
  params.context.Token.set(params.token1Entity);
  params.context.V3PoolData.set(v3PoolEntity);
}
