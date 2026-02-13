import type {
  Block_t,
  PoolHistoricalData as PoolHistoricalDataEntity,
  SingleChainToken as SingleChainTokenEntity,
} from "generated";
import type { HandlerContext } from "generated/src/Types";
import { ZERO_BIG_DECIMAL } from "../core/constants";
import { Id } from "../core/entity";
import { IndexerNetwork } from "../core/network";
import { calculateNewLockedAmountsUSD, TokenDecimalMath } from "../lib/math";
import { PriceDiscover } from "../lib/pricing/price-discover";
import { PriceFormatter } from "../lib/pricing/price-formatter";
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

  const isToken0DiscoveryEligible = PriceDiscover.isTokenDiscoveryEligible(token0Entity, poolEntity);
  const isToken1DiscoveryEligible = PriceDiscover.isTokenDiscoveryEligible(token1Entity, poolEntity);

  token0Entity = {
    ...token0Entity,
    tokenTotalValuePooled: token0Entity.tokenTotalValuePooled.plus(amount0Formatted),
    priceDiscoveryTokenAmount:
      isToken1DiscoveryEligible && amount1Formatted.gt(ZERO_BIG_DECIMAL)
        ? token0Entity.priceDiscoveryTokenAmount.plus(
            PriceDiscover.calculateDiscoveryAmountFromOtherToken(amount1Formatted, poolEntity.tokens0PerToken1),
          )
        : token0Entity.priceDiscoveryTokenAmount,
  };

  token1Entity = {
    ...token1Entity,
    tokenTotalValuePooled: token1Entity.tokenTotalValuePooled.plus(amount1Formatted),
    priceDiscoveryTokenAmount:
      isToken0DiscoveryEligible && amount0Formatted.gt(ZERO_BIG_DECIMAL)
        ? token1Entity.priceDiscoveryTokenAmount.plus(
            PriceDiscover.calculateDiscoveryAmountFromOtherToken(amount0Formatted, poolEntity.tokens1PerToken0),
          )
        : token1Entity.priceDiscoveryTokenAmount,
  };

  const newUsdLockedAmounts = calculateNewLockedAmountsUSD({
    poolEntity,
    token0: token0Entity,
    token1: token1Entity,
  });

  poolEntity = {
    ...poolEntity,
    totalValueLockedToken0Usd: PriceFormatter.formatUsdValue(newUsdLockedAmounts.newPoolTotalValueLockedToken0USD),
    trackedTotalValueLockedToken0Usd: PriceFormatter.formatUsdValue(
      newUsdLockedAmounts.newTrackedPoolTotalValueLockedToken0USD,
    ),

    totalValueLockedToken1Usd: PriceFormatter.formatUsdValue(newUsdLockedAmounts.newPoolTotalValueLockedToken1USD),
    trackedTotalValueLockedToken1Usd: PriceFormatter.formatUsdValue(
      newUsdLockedAmounts.newTrackedPoolTotalValueLockedToken1USD,
    ),

    totalValueLockedUsd: PriceFormatter.formatUsdValue(newUsdLockedAmounts.newPoolTotalValueLockedUSD),
    trackedTotalValueLockedUsd: PriceFormatter.formatUsdValue(newUsdLockedAmounts.newTrackedPoolTotalValueLockedUSD),

    lastActivityDayId: Id.buildLastActivityDayId(BigInt(params.eventBlock.number), params.network),
    lastActivityBlock: BigInt(params.eventBlock.number),
    lastActivityTimestamp: BigInt(params.eventBlock.timestamp),
  };

  token0Entity = {
    ...token0Entity,
    totalValuePooledUsd: PriceFormatter.formatUsdValue(newUsdLockedAmounts.newToken0TotalPooledAmountUSD),
    trackedTotalValuePooledUsd: PriceFormatter.formatUsdValue(newUsdLockedAmounts.newTrackedToken0TotalPooledAmountUSD),
  };

  token1Entity = {
    ...token1Entity,
    totalValuePooledUsd: PriceFormatter.formatUsdValue(newUsdLockedAmounts.newToken1TotalPooledAmountUSD),
    trackedTotalValuePooledUsd: PriceFormatter.formatUsdValue(newUsdLockedAmounts.newTrackedToken1TotalPooledAmountUSD),
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
  await DatabaseService.setTokenWithNativeCompatibility(params.context, token0Entity);
  await DatabaseService.setTokenWithNativeCompatibility(params.context, token1Entity);
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
