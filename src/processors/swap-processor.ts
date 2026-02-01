import {
  type Block_t,
  type PoolHistoricalData as PoolHistoricalDataEntity,
  type PoolTimeframedStats as PoolTimeframedStatsEntity,
  type SingleChainToken as SingleChainTokenEntity,
} from "generated";
import type { HandlerContext } from "generated/src/Types";
import { STATS_TIMEFRAME_IN_DAYS } from "../core/constants";
import { Id } from "../core/entity";
import { IndexerNetwork } from "../core/network";
import type { PoolPrices } from "../core/types";
import {
  calculateNewLockedAmountsUSD,
  calculateSwapFees,
  calculateSwapVolume,
  calculateSwapYield,
  YieldMath,
} from "../lib/math";
import { TokenDecimalMath } from "../lib/math/token/token-decimal-math";
import { PriceDiscover } from "../lib/pricing/price-discover";
import { DatabaseService } from "../services/database-service";
import { processPoolTimeframedStatsUpdate } from "./pool-timeframed-stats-update-processor";

export async function processSwap(params: {
  context: HandlerContext;
  poolAddress: string;
  network: IndexerNetwork;
  amount0: bigint;
  amount1: bigint;
  eventBlock: Block_t;
  newPoolPrices: PoolPrices;
  rawSwapFee: number;
  token0Entity?: SingleChainTokenEntity;
  token1Entity?: SingleChainTokenEntity;
}) {
  let poolEntity = await params.context.Pool.getOrThrow(Id.fromAddress(params.network, params.poolAddress));

  let [token0Entity, token1Entity, statsEntities, poolHistoricalDataEntities]: [
    SingleChainTokenEntity,
    SingleChainTokenEntity,
    PoolTimeframedStatsEntity[],
    PoolHistoricalDataEntity[],
  ] = await Promise.all([
    params.token0Entity
      ? Promise.resolve(params.token0Entity)
      : params.context.SingleChainToken.getOrThrow(poolEntity.token0_id),
    params.token1Entity
      ? Promise.resolve(params.token1Entity)
      : params.context.SingleChainToken.getOrThrow(poolEntity.token1_id),
    DatabaseService.getAllPooltimeframedStatsEntities(params.context, poolEntity),
    DatabaseService.getOrCreateHistoricalPoolDataEntities({
      context: params.context,
      eventTimestamp: BigInt(params.eventBlock.timestamp),
      pool: poolEntity,
    }),
  ]);

  const amount0Formatted = TokenDecimalMath.rawToDecimal(params.amount0, token0Entity);
  const amount1Formatted = TokenDecimalMath.rawToDecimal(params.amount1, token1Entity);

  poolEntity = {
    ...poolEntity,
    tokens0PerToken1: params.newPoolPrices.tokens0PerToken1,
    tokens1PerToken0: params.newPoolPrices.tokens1PerToken0,
    totalValueLockedToken0: poolEntity.totalValueLockedToken0.plus(amount0Formatted),
    totalValueLockedToken1: poolEntity.totalValueLockedToken1.plus(amount1Formatted),
    lastActivityDayId: Id.buildLastActivityDayId(BigInt(params.eventBlock.number), params.network),
    lastActivityBlock: BigInt(params.eventBlock.number),
    lastActivityTimestamp: BigInt(params.eventBlock.timestamp),
  };

  token0Entity = {
    ...token0Entity,
    swapsInCount: params.amount0 > 0 ? token0Entity.swapsInCount + 1n : token0Entity.swapsInCount,
    swapsOutCount: params.amount0 < 0 ? token0Entity.swapsOutCount + 1n : token0Entity.swapsOutCount,
    swapsCount: token0Entity.swapsCount + 1n,
    tokenTotalValuePooled: token0Entity.tokenTotalValuePooled.plus(amount0Formatted),
  };

  token1Entity = {
    ...token1Entity,
    swapsInCount: params.amount1 > 0 ? token1Entity.swapsInCount + 1n : token1Entity.swapsInCount,
    swapsOutCount: params.amount1 < 0 ? token1Entity.swapsOutCount + 1n : token1Entity.swapsOutCount,
    swapsCount: token1Entity.swapsCount + 1n,
    tokenTotalValuePooled: token1Entity.tokenTotalValuePooled.plus(amount1Formatted),
  };

  const {
    token0UsdPrice: token0MarketUsdPrice,
    token1UsdPrice: token1MarketUsdPrice,
    trackedToken0UsdPrice: trackedToken0MarketUsdPrice,
    trackedToken1UsdPrice: trackedToken1MarketUsdPrice,
  } = PriceDiscover.discoverTokenUsdPrices({
    network: params.network,
    poolToken0Entity: token0Entity,
    poolToken1Entity: token1Entity,
    newPoolPrices: params.newPoolPrices,
    rawSwapAmount0: params.amount0,
    rawSwapAmount1: params.amount1,
    pool: poolEntity,
  });

  const didToken0UsdPriceUpdate = !token0MarketUsdPrice.eq(token0Entity.usdPrice);
  const didToken1UsdPriceUpdate = !token1MarketUsdPrice.eq(token1Entity.usdPrice);
  const didToken0TrackedUsdPriceUpdate = !trackedToken0MarketUsdPrice.eq(token0Entity.trackedUsdPrice);
  const didToken1TrackedUsdPriceUpdate = !trackedToken1MarketUsdPrice.eq(token1Entity.trackedUsdPrice);

  token0Entity = {
    ...token0Entity,
    usdPrice: token0MarketUsdPrice,
    trackedUsdPrice: trackedToken0MarketUsdPrice,

    priceDiscoveryTokenAmount: didToken0TrackedUsdPriceUpdate
      ? token0Entity.priceDiscoveryTokenAmount.plus(
          poolEntity.totalValueLockedToken1.times(poolEntity.tokens1PerToken0),
        )
      : token0Entity.priceDiscoveryTokenAmount,
  };

  token1Entity = {
    ...token1Entity,
    usdPrice: token1MarketUsdPrice,
    trackedUsdPrice: trackedToken1MarketUsdPrice,

    priceDiscoveryTokenAmount: didToken1TrackedUsdPriceUpdate
      ? token1Entity.priceDiscoveryTokenAmount.plus(
          poolEntity.totalValueLockedToken0.times(poolEntity.tokens0PerToken1),
        )
      : token1Entity.priceDiscoveryTokenAmount,
  };

  const newLockedAmounts = calculateNewLockedAmountsUSD({
    poolEntity: poolEntity,
    token0: token0Entity,
    token1: token1Entity,
  });

  const swapVolume = calculateSwapVolume({
    swapAmount0: amount0Formatted,
    swapAmount1: amount1Formatted,
    poolEntity: poolEntity,
    token0: token0Entity,
    token1: token1Entity,
  });

  const swapFees = calculateSwapFees({
    rawSwapAmount0: params.amount0,
    rawSwapAmount1: params.amount1,
    rawSwapFee: params.rawSwapFee,
    token0: token0Entity,
    token1: token1Entity,
    poolEntity: poolEntity,
  });

  const swapYield = calculateSwapYield({
    swapFeesUsd: swapFees.feesUSD,
    poolTotalValueLockedUsd: newLockedAmounts.newPoolTotalValueLockedUSD,
  });

  poolEntity = {
    ...poolEntity,

    swapVolumeUsd: poolEntity.swapVolumeUsd.plus(swapVolume.volumeUSD),
    trackedSwapVolumeUsd: poolEntity.trackedSwapVolumeUsd.plus(swapVolume.trackedVolumeUSD),

    swapVolumeToken0: poolEntity.swapVolumeToken0.plus(swapVolume.volumeToken0),
    swapVolumeToken0Usd: poolEntity.swapVolumeToken0Usd.plus(swapVolume.volumeToken0USD),
    trackedSwapVolumeToken0Usd: poolEntity.trackedSwapVolumeToken0Usd.plus(swapVolume.trackedVolumeToken0USD),

    swapVolumeToken1: poolEntity.swapVolumeToken1.plus(swapVolume.volumeToken1),
    swapVolumeToken1Usd: poolEntity.swapVolumeToken1Usd.plus(swapVolume.volumeToken1USD),
    trackedSwapVolumeToken1Usd: poolEntity.trackedSwapVolumeToken1Usd.plus(swapVolume.trackedVolumeToken1USD),

    feesUsd: poolEntity.feesUsd.plus(swapFees.feesUSD),
    trackedFeesUsd: poolEntity.trackedFeesUsd.plus(swapFees.trackedFeesUSD),

    feesToken0: poolEntity.feesToken0.plus(swapFees.feesToken0),
    feesToken1: poolEntity.feesToken1.plus(swapFees.feesToken1),

    totalValueLockedUsd: newLockedAmounts.newPoolTotalValueLockedUSD,
    trackedTotalValueLockedUsd: newLockedAmounts.newTrackedPoolTotalValueLockedUSD,

    totalValueLockedToken0Usd: newLockedAmounts.newPoolTotalValueLockedToken0USD,
    trackedTotalValueLockedToken0Usd: newLockedAmounts.newTrackedPoolTotalValueLockedToken0USD,

    totalValueLockedToken1Usd: newLockedAmounts.newPoolTotalValueLockedToken1USD,
    trackedTotalValueLockedToken1Usd: newLockedAmounts.newTrackedPoolTotalValueLockedToken1USD,

    accumulatedYield: poolEntity.accumulatedYield.plus(swapYield),
    swapsCount: poolEntity.swapsCount + 1n,

    token0UsdPrice: didToken0UsdPriceUpdate ? token0MarketUsdPrice : poolEntity.token0UsdPrice,
    token1UsdPrice: didToken1UsdPriceUpdate ? token1MarketUsdPrice : poolEntity.token1UsdPrice,

    trackedToken0UsdPrice: didToken0TrackedUsdPriceUpdate
      ? trackedToken0MarketUsdPrice
      : poolEntity.trackedToken0UsdPrice,
    trackedToken1UsdPrice: didToken1TrackedUsdPriceUpdate
      ? trackedToken1MarketUsdPrice
      : poolEntity.trackedToken1UsdPrice,
  };

  token0Entity = {
    ...token0Entity,
    tokenSwapVolume: token0Entity.tokenSwapVolume.plus(swapVolume.volumeToken0),
    swapVolumeUsd: token0Entity.swapVolumeUsd.plus(swapVolume.volumeToken0USD),
    trackedSwapVolumeUsd: token0Entity.trackedSwapVolumeUsd.plus(swapVolume.trackedVolumeToken0USD),

    totalValuePooledUsd: newLockedAmounts.newToken0TotalPooledAmountUSD,
    trackedTotalValuePooledUsd: newLockedAmounts.newTrackedToken0TotalPooledAmountUSD,

    tokenFees: token0Entity.tokenFees.plus(swapFees.feesToken0),
    feesUsd: token0Entity.feesUsd.plus(swapFees.feesToken0USD),
    trackedFeesUsd: token0Entity.trackedFeesUsd.plus(swapFees.trackedFeesToken0USD),
  };

  token1Entity = {
    ...token1Entity,
    swapVolumeUsd: token1Entity.swapVolumeUsd.plus(swapVolume.volumeToken1USD),
    trackedSwapVolumeUsd: token1Entity.trackedSwapVolumeUsd.plus(swapVolume.trackedVolumeToken1USD),
    tokenSwapVolume: token1Entity.tokenSwapVolume.plus(swapVolume.volumeToken1),

    totalValuePooledUsd: newLockedAmounts.newToken1TotalPooledAmountUSD,
    trackedTotalValuePooledUsd: newLockedAmounts.newTrackedToken1TotalPooledAmountUSD,

    tokenFees: token1Entity.tokenFees.plus(swapFees.feesToken1),
    feesUsd: token1Entity.feesUsd.plus(swapFees.feesToken1USD),
    trackedFeesUsd: token1Entity.trackedFeesUsd.plus(swapFees.trackedFeesToken1USD),
  };

  poolHistoricalDataEntities = poolHistoricalDataEntities.map((historicalDataEntity) => ({
    ...historicalDataEntity,
    swapVolumeUsdAtEnd: poolEntity.swapVolumeUsd,
    trackedSwapVolumeUsdAtEnd: poolEntity.trackedSwapVolumeUsd,

    totalValueLockedUsdAtEnd: poolEntity.totalValueLockedUsd,
    trackedTotalValueLockedUsdAtEnd: poolEntity.trackedTotalValueLockedUsd,

    totalValueLockedToken0AtEnd: poolEntity.totalValueLockedToken0,
    totalValueLockedToken1AtEnd: poolEntity.totalValueLockedToken1,

    feesUsdAtEnd: poolEntity.feesUsd,
    trackedFeesUsdAtEnd: poolEntity.trackedFeesUsd,

    intervalSwapVolumeUsd: historicalDataEntity.intervalSwapVolumeUsd.plus(swapVolume.volumeUSD),
    intervalSwapVolumeToken0: historicalDataEntity.intervalSwapVolumeToken0.plus(swapVolume.volumeToken0),
    intervalSwapVolumeToken1: historicalDataEntity.intervalSwapVolumeToken1.plus(swapVolume.volumeToken1),

    intervalFeesUsd: historicalDataEntity.intervalFeesUsd.plus(swapFees.feesUSD),
    intervalFeesToken0: historicalDataEntity.intervalFeesToken0.plus(swapFees.feesToken0),
    intervalFeesToken1: historicalDataEntity.intervalFeesToken1.plus(swapFees.feesToken1),

    accumulatedYieldAtEnd: poolEntity.accumulatedYield,
    timestampAtEnd: BigInt(params.eventBlock.timestamp),
  }));

  statsEntities = statsEntities.map((statEntity) => {
    const yearlyYield = YieldMath.yearlyYieldFromAccumulated({
      accumulatedYield: statEntity.accumulatedYield.plus(swapYield),
      daysAccumulated: STATS_TIMEFRAME_IN_DAYS[statEntity.timeframe],
      eventTimestamp: BigInt(params.eventBlock.timestamp),
      pool: poolEntity,
    });

    return {
      ...statEntity,
      swapVolumeUsd: statEntity.swapVolumeUsd.plus(swapVolume.volumeUSD),
      trackedSwapVolumeUsd: statEntity.trackedSwapVolumeUsd.plus(swapVolume.trackedVolumeUSD),

      feesUsd: statEntity.feesUsd.plus(swapFees.feesUSD),
      trackedFeesUsd: statEntity.trackedFeesUsd.plus(swapFees.trackedFeesUSD),

      accumulatedYield: statEntity.accumulatedYield.plus(swapYield),
      yearlyYield: yearlyYield,
    };
  });

  params.context.Pool.set(poolEntity);
  params.context.SingleChainToken.set(token0Entity);
  params.context.SingleChainToken.set(token1Entity);
  statsEntities.forEach((entity) => params.context.PoolTimeframedStats.set(entity));
  poolHistoricalDataEntities.forEach((entity) => params.context.PoolHistoricalData.set(entity));

  await processPoolTimeframedStatsUpdate({
    context: params.context,
    eventTimestamp: BigInt(params.eventBlock.timestamp),
    poolEntity,
  });
}
