import type {
  handlerContext,
  PoolHistoricalData as PoolHistoricalDataEntity,
  PoolTimeframedStats as PoolTimeframedStatsEntity,
  SingleChainToken as SingleChainTokenEntity,
} from "generated";
import { ZERO_BIG_DECIMAL } from "../core/constants";
import { Id } from "../core/entity";
import { IndexerNetwork } from "../core/network";
import { calculateLiquidityFlow, PriceConverter } from "../lib/math";
import { TokenDecimalMath } from "../lib/math/token/token-decimal-math";
import { DatabaseService } from "../services/database-service";

import type { Block_t } from "generated";

export async function processLiquidityMetrics(params: {
  context: handlerContext;
  poolAddress: string;
  network: IndexerNetwork;
  eventBlock: Block_t;
  amount0AddedOrRemoved: bigint;
  amount1AddedOrRemoved: bigint;
}) {
  let poolEntity = await params.context.Pool.getOrThrow(Id.fromAddress(params.network, params.poolAddress));

  let [token0Entity, token1Entity, statsEntities, poolHistoricalDataEntities]: [
    SingleChainTokenEntity,
    SingleChainTokenEntity,
    PoolTimeframedStatsEntity[],
    PoolHistoricalDataEntity[],
  ] = await Promise.all([
    params.context.SingleChainToken.getOrThrow(poolEntity.token0_id),
    params.context.SingleChainToken.getOrThrow(poolEntity.token1_id),
    DatabaseService.getAllPooltimeframedStatsEntities(params.context, poolEntity),
    DatabaseService.getOrCreateHistoricalPoolDataEntities({
      context: params.context,
      eventTimestamp: BigInt(params.eventBlock.timestamp),
      pool: poolEntity,
    }),
  ]);

  const amount0Formatted = TokenDecimalMath.rawToDecimal(params.amount0AddedOrRemoved, token0Entity);
  const amount1Formatted = TokenDecimalMath.rawToDecimal(params.amount1AddedOrRemoved, token1Entity);

  const amount0Usd = amount0Formatted.times(token0Entity.usdPrice);
  const trackedAmount0Usd = PriceConverter.convertTokenAmountToTrackedUsd({
    amount: amount0Formatted,
    token: token0Entity,
    poolEntity: poolEntity,
    comparisonToken: token1Entity,
    fallbackUsdValue: ZERO_BIG_DECIMAL,
  });

  const amount1Usd = amount1Formatted.times(token1Entity.usdPrice);
  const trackedAmount1Usd = PriceConverter.convertTokenAmountToTrackedUsd({
    amount: amount1Formatted,
    token: token1Entity,
    poolEntity: poolEntity,
    comparisonToken: token0Entity,
    fallbackUsdValue: ZERO_BIG_DECIMAL,
  });

  const token0VolumeUsd = amount0Usd.abs();
  const token1VolumeUsd = amount1Usd.abs();

  const trackedToken0VolumeUsd = trackedAmount0Usd.abs();
  const trackedToken1VolumeUsd = trackedAmount1Usd.abs();

  const operationVolumeUsd = token0VolumeUsd.plus(token1VolumeUsd);
  const trackedOperationVolumeUsd = trackedToken0VolumeUsd.plus(trackedToken1VolumeUsd);

  const operationNetChangeUsd = amount0Usd.plus(amount1Usd);
  const trackedOperationNetChangeUsd = trackedAmount0Usd.plus(trackedAmount1Usd);

  const liquidityFlow = calculateLiquidityFlow({
    amount0AddedOrRemoved: params.amount0AddedOrRemoved,
    amount1AddedOrRemoved: params.amount1AddedOrRemoved,
    pool: poolEntity,
    token0: token0Entity,
    token1: token1Entity,
  });

  poolEntity = {
    ...poolEntity,
    liquidityVolumeToken0: poolEntity.liquidityVolumeToken0.plus(amount0Formatted.abs()),
    liquidityVolumeToken0Usd: poolEntity.liquidityVolumeToken0Usd.plus(token0VolumeUsd),
    trackedLiquidityVolumeToken0Usd: poolEntity.trackedLiquidityVolumeToken0Usd.plus(trackedToken0VolumeUsd),

    liquidityVolumeToken1: poolEntity.liquidityVolumeToken1.plus(amount1Formatted.abs()),
    liquidityVolumeToken1Usd: poolEntity.liquidityVolumeToken1Usd.plus(token1VolumeUsd),
    trackedLiquidityVolumeToken1Usd: poolEntity.trackedLiquidityVolumeToken1Usd.plus(trackedToken1VolumeUsd),

    liquidityVolumeUsd: poolEntity.liquidityVolumeUsd.plus(operationVolumeUsd),
    trackedLiquidityVolumeUsd: poolEntity.trackedLiquidityVolumeUsd.plus(trackedOperationVolumeUsd),

    liquidityNetInflowUsd: poolEntity.liquidityNetInflowUsd.plus(operationNetChangeUsd),
    trackedLiquidityNetInflowUsd: poolEntity.trackedLiquidityNetInflowUsd.plus(trackedOperationNetChangeUsd),
  };

  token0Entity = {
    ...token0Entity,
    tokenLiquidityVolume: token0Entity.tokenLiquidityVolume.plus(amount0Formatted.abs()),
    liquidityVolumeUsd: token0Entity.liquidityVolumeUsd.plus(token0VolumeUsd),
    trackedLiquidityVolumeUsd: token0Entity.trackedLiquidityVolumeUsd.plus(trackedToken0VolumeUsd),
  };

  token1Entity = {
    ...token1Entity,
    tokenLiquidityVolume: token1Entity.tokenLiquidityVolume.plus(amount1Formatted.abs()),
    liquidityVolumeUsd: token1Entity.liquidityVolumeUsd.plus(token1VolumeUsd),
    trackedLiquidityVolumeUsd: token1Entity.trackedLiquidityVolumeUsd.plus(trackedToken1VolumeUsd),
  };

  poolHistoricalDataEntities = poolHistoricalDataEntities.map((historicalDataEntity) => ({
    ...historicalDataEntity,
    timestampAtEnd: BigInt(params.eventBlock.timestamp),

    liquidityNetInflowUsdAtEnd: poolEntity.liquidityNetInflowUsd,
    trackedLiquidityNetInflowUsdAtEnd: poolEntity.trackedLiquidityNetInflowUsd,

    liquidityVolumeUsdAtEnd: poolEntity.liquidityVolumeUsd,
    trackedLiquidityVolumeUsdAtEnd: poolEntity.trackedLiquidityVolumeUsd,

    intervalLiquidityVolumeToken0: historicalDataEntity.intervalLiquidityVolumeToken0.plus(amount0Formatted),
    intervalLiquidityVolumeToken1: historicalDataEntity.intervalLiquidityVolumeToken1.plus(amount1Formatted),
    intervalLiquidityVolumeUsd: historicalDataEntity.intervalLiquidityVolumeUsd.plus(operationVolumeUsd),
    intervalLiquidityInflowToken0: historicalDataEntity.intervalLiquidityInflowToken0.plus(liquidityFlow.inflowToken0),
    intervalLiquidityInflowToken1: historicalDataEntity.intervalLiquidityInflowToken1.plus(liquidityFlow.inflowToken1),
    intervalLiquidityInflowUsd: historicalDataEntity.intervalLiquidityInflowUsd.plus(liquidityFlow.inflowUSD),
    intervalLiquidityNetInflowUsd: historicalDataEntity.intervalLiquidityNetInflowUsd.plus(liquidityFlow.netInflowUSD),
    intervalLiquidityOutflowUsd: historicalDataEntity.intervalLiquidityOutflowUsd.plus(liquidityFlow.outflowUSD),
    intervalLiquidityNetInflowToken0: historicalDataEntity.intervalLiquidityNetInflowToken0.plus(
      liquidityFlow.netInflowToken0,
    ),
    intervalLiquidityNetInflowToken1: historicalDataEntity.intervalLiquidityNetInflowToken1.plus(
      liquidityFlow.netInflowToken1,
    ),

    intervalLiquidityOutflowToken0: historicalDataEntity.intervalLiquidityOutflowToken0.plus(
      liquidityFlow.outflowToken0,
    ),
    intervalLiquidityOutflowToken1: historicalDataEntity.intervalLiquidityOutflowToken1.plus(
      liquidityFlow.outflowToken1,
    ),
  }));

  statsEntities = statsEntities.map((statEntity) => ({
    ...statEntity,

    liquidityVolumeUsd: statEntity.liquidityVolumeUsd.plus(operationVolumeUsd),
    trackedLiquidityVolumeUsd: statEntity.trackedLiquidityVolumeUsd.plus(trackedOperationVolumeUsd),

    liquidityNetInflowUsd: statEntity.liquidityNetInflowUsd.plus(operationNetChangeUsd),
    trackedLiquidityNetInflowUsd: statEntity.trackedLiquidityNetInflowUsd.plus(trackedOperationNetChangeUsd),
  }));

  params.context.Pool.set(poolEntity);
  await DatabaseService.setTokenWithNativeCompatibility(params.context, token0Entity);
  await DatabaseService.setTokenWithNativeCompatibility(params.context, token1Entity);
  statsEntities.forEach((entity) => params.context.PoolTimeframedStats.set(entity));
  poolHistoricalDataEntities.forEach((entity) => params.context.PoolHistoricalData.set(entity));
}
