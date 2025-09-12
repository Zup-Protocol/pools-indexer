import { HandlerContext, Pool as PoolEntity, Token as TokenEntity } from "generated";
import { PoolSetters } from "../../../common/pool-setters";
import { formatFromTokenAmount } from "../../../common/token-commons";

export async function handleV3PoolMint(
  context: HandlerContext,
  poolEntity: PoolEntity,
  token0Entity: TokenEntity,
  token1Entity: TokenEntity,
  amount0: bigint,
  amount1: bigint,
  eventTimestamp: bigint,
  v3PoolSetters: PoolSetters
): Promise<void> {
  const token0FormattedAmount = formatFromTokenAmount(amount0, token0Entity);
  const token1FormattedAmount = formatFromTokenAmount(amount1, token1Entity);

  const pooTotalValueLockedToken0 = poolEntity.totalValueLockedToken0.plus(token0FormattedAmount);
  const pooTotalValueLockedToken1 = poolEntity.totalValueLockedToken1.plus(token1FormattedAmount);

  const token0TotalTokenPooledAmount = token0Entity.totalTokenPooledAmount.plus(token0FormattedAmount);
  const token1TotalTokenPooledAmount = token1Entity.totalTokenPooledAmount.plus(token1FormattedAmount);

  const token0TotalValuePooledUsd = token0TotalTokenPooledAmount.times(token0Entity.usdPrice);
  const token1TotalValuePooledUsd = token1TotalTokenPooledAmount.times(token1Entity.usdPrice);

  const poolTotalValueLockedUSD = pooTotalValueLockedToken0
    .times(token0Entity.usdPrice)
    .plus(pooTotalValueLockedToken1.times(token1Entity.usdPrice));

  poolEntity = {
    ...poolEntity,
    totalValueLockedToken0: pooTotalValueLockedToken0,
    totalValueLockedToken1: pooTotalValueLockedToken1,
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
