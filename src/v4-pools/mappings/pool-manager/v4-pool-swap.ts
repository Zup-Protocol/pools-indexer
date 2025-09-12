import { BigDecimal, HandlerContext, Pool as PoolEntity, Token as TokenEntity } from "generated";
import { PoolSetters } from "../../../common/pool-setters";
import { formatFromTokenAmount } from "../../../common/token-commons";
import { sqrtPriceX96toPrice } from "../../../v3-pools/common/v3-v4-pool-converters";

export async function handleV4PoolSwap(
  context: HandlerContext,
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
  const tokenAmount0Formatted = formatFromTokenAmount(amount0, token0Entity).times(BigDecimal("-1"));
  const tokenAmount1Formatted = formatFromTokenAmount(amount1, token1Entity).times(BigDecimal("-1"));

  let v4PoolEntity = await context.V4PoolData.getOrThrow(poolEntity.id);

  const newPrices = v4PoolSetters.getPricesForPoolWhitelistedTokens(
    token0Entity,
    token1Entity,
    sqrtPriceX96toPrice(sqrtPriceX96, token0Entity, token1Entity)
  );

  const poolTotalValueLockedToken0 = poolEntity.totalValueLockedToken0.plus(tokenAmount0Formatted);
  const poolTotalValueLockedToken1 = poolEntity.totalValueLockedToken1.plus(tokenAmount1Formatted);

  const poolTotalValueLockedUSD = poolTotalValueLockedToken0
    .times(newPrices.token0UpdatedPrice)
    .plus(poolTotalValueLockedToken1.times(newPrices.token1UpdatedPrice));

  const token0TotalTokenPooledAmount = token0Entity.totalTokenPooledAmount.plus(tokenAmount0Formatted);
  const token1TotalTokenPooledAmount = token1Entity.totalTokenPooledAmount.plus(tokenAmount1Formatted);

  const token0TotalValuePooledUsd = token0TotalTokenPooledAmount.times(newPrices.token0UpdatedPrice);
  const token1TotalValuePooledUsd = token1TotalTokenPooledAmount.times(newPrices.token1UpdatedPrice);

  v4PoolEntity = {
    ...v4PoolEntity,
    sqrtPriceX96: sqrtPriceX96,
    tick: tick,
  };

  poolEntity = {
    ...poolEntity,
    totalValueLockedToken0: poolTotalValueLockedToken0,
    totalValueLockedToken1: poolTotalValueLockedToken1,
    totalValueLockedUSD: poolTotalValueLockedUSD,
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

  await v4PoolSetters.setHourlyData(
    eventTimestamp,
    context,
    token0Entity,
    token1Entity,
    poolEntity,
    amount0,
    amount1,
    swapFee
  );

  await v4PoolSetters.setDailyData(
    eventTimestamp,
    context,
    poolEntity,
    token0Entity,
    token1Entity,
    amount0,
    amount1,
    swapFee
  );

  context.Pool.set(poolEntity);
  context.Token.set(token0Entity);
  context.Token.set(token1Entity);
  context.V4PoolData.set(v4PoolEntity);
}
