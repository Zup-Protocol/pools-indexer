import type {
  Block_t,
  PoolHistoricalData as PoolHistoricalDataEntity,
  SingleChainToken as SingleChainTokenEntity,
} from "generated";
import type { HandlerContext } from "generated/src/Types";
import { Id } from "../core/entity";
import { IndexerNetwork } from "../core/network";
import { calculateNewLockedAmountsUSD, TokenDecimalMath } from "../lib/math";
import { DatabaseService } from "../services/database-service";
import { processLiquidityMetrics } from "./liquidity-metrics-processor";
import { processPoolTimeframedStatsUpdate } from "./pool-timeframed-stats-update-processor";

export async function processLiquidityChange(params: {
  context: HandlerContext;
  poolAddress: string;
  network: IndexerNetwork;
  amount0AddedOrRemoved: bigint;
  amount1AddedOrRemoved: bigint;
  eventBlock: Block_t;
  updateMetrics: boolean;
}) {
  let poolEntity = await params.context.Pool.getOrThrow(Id.fromAddress(params.network, params.poolAddress));

  let [token0Entity, token1Entity, poolHistoricalDataEntities]: [
    SingleChainTokenEntity,
    SingleChainTokenEntity,
    PoolHistoricalDataEntity[],
  ] = await Promise.all([
    params.context.SingleChainToken.getOrThrow(poolEntity.token0_id),
    params.context.SingleChainToken.getOrThrow(poolEntity.token1_id),
    DatabaseService.getOrCreateHistoricalPoolDataEntities({
      context: params.context,
      eventTimestamp: BigInt(params.eventBlock.timestamp),
      pool: poolEntity,
    }),
  ]);

  const amount0Formatted = TokenDecimalMath.rawToDecimal(params.amount0AddedOrRemoved, token0Entity);
  const amount1Formatted = TokenDecimalMath.rawToDecimal(params.amount1AddedOrRemoved, token1Entity);

  poolEntity = {
    ...poolEntity,
    totalValueLockedToken0: poolEntity.totalValueLockedToken0.plus(amount0Formatted),
    totalValueLockedToken1: poolEntity.totalValueLockedToken1.plus(amount1Formatted),
  };

  token0Entity = {
    ...token0Entity,
    tokenTotalValuePooled: token0Entity.tokenTotalValuePooled.plus(amount0Formatted),
  };

  token1Entity = {
    ...token1Entity,
    tokenTotalValuePooled: token1Entity.tokenTotalValuePooled.plus(amount1Formatted),
  };

  const newUsdLockedAmounts = calculateNewLockedAmountsUSD({
    poolEntity,
    token0: token0Entity,
    token1: token1Entity,
  });

  poolEntity = {
    ...poolEntity,
    totalValueLockedToken0Usd: newUsdLockedAmounts.newPoolTotalValueLockedToken0USD,
    trackedTotalValueLockedToken0Usd: newUsdLockedAmounts.newTrackedPoolTotalValueLockedToken0USD,

    totalValueLockedToken1Usd: newUsdLockedAmounts.newPoolTotalValueLockedToken1USD,
    trackedTotalValueLockedToken1Usd: newUsdLockedAmounts.newTrackedPoolTotalValueLockedToken1USD,

    totalValueLockedUsd: newUsdLockedAmounts.newPoolTotalValueLockedUSD,
    trackedTotalValueLockedUsd: newUsdLockedAmounts.newTrackedPoolTotalValueLockedUSD,

    lastActivityDayId: Id.buildLastActivityDayId(BigInt(params.eventBlock.number), params.network),
    lastActivityBlock: BigInt(params.eventBlock.number),
    lastActivityTimestamp: BigInt(params.eventBlock.timestamp),
  };

  token0Entity = {
    ...token0Entity,
    totalValuePooledUsd: newUsdLockedAmounts.newToken0TotalPooledAmountUSD,
    trackedTotalValuePooledUsd: newUsdLockedAmounts.newTrackedToken0TotalPooledAmountUSD,
  };

  token1Entity = {
    ...token1Entity,
    totalValuePooledUsd: newUsdLockedAmounts.newToken1TotalPooledAmountUSD,
    trackedTotalValuePooledUsd: newUsdLockedAmounts.newTrackedToken1TotalPooledAmountUSD,
  };

  poolHistoricalDataEntities = poolHistoricalDataEntities.map((historicalDataEntity) => ({
    ...historicalDataEntity,
    totalValueLockedToken0AtEnd: poolEntity.totalValueLockedToken0,
    totalValueLockedToken1AtEnd: poolEntity.totalValueLockedToken1,

    totalValueLockedUsdAtEnd: poolEntity.totalValueLockedUsd,
    trackedTotalValueLockedUsdAtEnd: poolEntity.trackedTotalValueLockedUsd,

    timestampAtEnd: BigInt(params.eventBlock.timestamp),
  }));

  params.context.Pool.set(poolEntity);
  params.context.SingleChainToken.set(token0Entity);
  params.context.SingleChainToken.set(token1Entity);
  poolHistoricalDataEntities.forEach((entity) => params.context.PoolHistoricalData.set(entity));

  if (params.updateMetrics) {
    await processLiquidityMetrics({
      context: params.context,
      poolAddress: params.poolAddress,
      network: params.network,
      eventBlock: params.eventBlock,
      amount0AddedOrRemoved: params.amount0AddedOrRemoved,
      amount1AddedOrRemoved: params.amount1AddedOrRemoved,
    });
  }

  await processPoolTimeframedStatsUpdate({
    context: params.context,
    eventTimestamp: BigInt(params.eventBlock.timestamp),
    poolEntity,
  });
}
