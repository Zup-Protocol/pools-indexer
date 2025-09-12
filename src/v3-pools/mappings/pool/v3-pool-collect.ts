import { HandlerContext, Pool as PoolEntity, Token as TokenEntity } from "generated";
import { PoolSetters } from "../../../common/pool-setters";
import { formatFromTokenAmount } from "../../../common/token-commons";

export async function handleV3PoolCollect(
  context: HandlerContext,
  poolEntity: PoolEntity,
  token0Entity: TokenEntity,
  token1Entity: TokenEntity,
  amount0: bigint,
  amount1: bigint,
  eventTimestamp: bigint,
  v3PoolSetters: PoolSetters
): Promise<void> {
  const formattedToken0CollectedAmount = formatFromTokenAmount(amount0, token0Entity);
  const formattedToken1CollectAmount = formatFromTokenAmount(amount1, token1Entity);

  const poolTotalValueLockedToken0 = poolEntity.totalValueLockedToken0.minus(formattedToken0CollectedAmount);
  const poolTotalValueLockedToken1 = poolEntity.totalValueLockedToken1.minus(formattedToken1CollectAmount);

  const token0TotalTokenPooledAmount = token0Entity.totalTokenPooledAmount.minus(formattedToken0CollectedAmount);
  const token1TotalTokenPooledAmount = token1Entity.totalTokenPooledAmount.minus(formattedToken1CollectAmount);

  const token0TotalValuePooledUsd = token0TotalTokenPooledAmount.times(token0Entity.usdPrice);
  const token1TotalValuePooledUsd = token1TotalTokenPooledAmount.times(token1Entity.usdPrice);

  const poolTotalValueLockedUSD = poolTotalValueLockedToken0
    .times(token0Entity.usdPrice)
    .plus(poolTotalValueLockedToken1.times(token1Entity.usdPrice));

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
  };

  token1Entity = {
    ...token1Entity,
    totalTokenPooledAmount: token1TotalTokenPooledAmount,
    totalValuePooledUsd: token1TotalValuePooledUsd,
  };

  await v3PoolSetters.setPoolDailyDataTVL(eventTimestamp, poolEntity);

  context.Pool.set(poolEntity);
  context.Token.set(token0Entity);
  context.Token.set(token1Entity);
}
