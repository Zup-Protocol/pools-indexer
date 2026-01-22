import type { Pool as PoolEntity, PoolTimeframedStats } from "generated";
import type { HandlerContext } from "generated/src/Types";
import { STATS_TIMEFRAME_IN_DAYS, STATS_TIMEFRAME_IN_HOURS } from "../core/constants";
import { InitialPoolTimeframedStatsEntity } from "../core/entity";
import { YieldMath } from "../lib/math";
import { isSecondsTimestampMoreThanDaysAgo, isSecondsTimestampMoreThanHoursAgo } from "../lib/timestamp";
import { DatabaseService } from "../services/database-service";

export async function processPoolTimeframedStatsUpdate(params: {
  context: HandlerContext;
  eventTimestamp: bigint;
  poolEntity: PoolEntity;
}) {
  if (isSecondsTimestampMoreThanDaysAgo(params.eventTimestamp, 100)) return;
  if (!isSecondsTimestampMoreThanHoursAgo(params.poolEntity.lastStatsRefreshTimestamp, 1)) return;

  const statsEntities = await DatabaseService.getAllPooltimeframedStatsEntities(params.context, params.poolEntity);
  const updatedStats = await Promise.all(statsEntities.map((stat) => _updatePoolTimeframedStat(stat, params)));

  updatedStats.forEach((updatedStat) => params.context.PoolTimeframedStats.set(updatedStat));

  if (updatedStats.length > 0) {
    params.context.Pool.set({
      ...params.poolEntity,
      lastStatsRefreshTimestamp: params.eventTimestamp,
    });
  }
}

async function _updatePoolTimeframedStat(
  stat: PoolTimeframedStats,
  params: {
    context: HandlerContext;
    eventTimestamp: bigint;
    poolEntity: PoolEntity;
  },
): Promise<PoolTimeframedStats> {
  const timeframe = stat.timeframe;
  const isRefreshingOneDayStats = timeframe === "DAY";

  let dataAgo = await DatabaseService.getPoolHourlyDataAgo(
    STATS_TIMEFRAME_IN_HOURS[timeframe],
    params.eventTimestamp,
    params.context,
    params.poolEntity,
  );

  if (!dataAgo && !isRefreshingOneDayStats) {
    dataAgo = await DatabaseService.getOldestPoolDailyDataAgo(
      STATS_TIMEFRAME_IN_DAYS[timeframe],
      params.eventTimestamp,
      params.context,
      params.poolEntity,
    );
  } else if (!dataAgo) {
    dataAgo = await DatabaseService.getOldestPoolHourlyDataAgo(
      STATS_TIMEFRAME_IN_HOURS[timeframe],
      params.eventTimestamp,
      params.context,
      params.poolEntity,
    );
  }

  if (dataAgo) {
    const yieldAtStart = dataAgo.accumulatedYieldAtStart;
    const accumulatedYield = params.poolEntity.accumulatedYield.minus(yieldAtStart);

    return {
      ...stat,
      dataPointTimestamp: dataAgo.timestampAtStart,
      lastRefreshTimestamp: params.eventTimestamp,
      liquidityVolumeUsd: params.poolEntity.liquidityVolumeUsd.minus(dataAgo.liquidityVolumeUsdAtStart),
      trackedLiquidityVolumeUsd: params.poolEntity.trackedLiquidityVolumeUsd.minus(
        dataAgo.trackedLiquidityVolumeUsdAtStart,
      ),
      liquidityNetInflowUsd: params.poolEntity.liquidityNetInflowUsd.minus(dataAgo.liquidityNetInflowUsdAtStart),
      trackedLiquidityNetInflowUsd: params.poolEntity.trackedLiquidityNetInflowUsd.minus(
        dataAgo.trackedLiquidityNetInflowUsdAtStart,
      ),
      feesUsd: params.poolEntity.feesUsd.minus(dataAgo.feesUsdAtStart),
      trackedFeesUsd: params.poolEntity.trackedFeesUsd.minus(dataAgo.trackedFeesUsdAtStart),
      swapVolumeUsd: params.poolEntity.swapVolumeUsd.minus(dataAgo.swapVolumeUsdAtStart),
      trackedSwapVolumeUsd: params.poolEntity.trackedSwapVolumeUsd.minus(dataAgo.trackedSwapVolumeUsdAtStart),
      accumulatedYield,
      yearlyYield: YieldMath.yearlyYieldFromAccumulated({
        accumulatedYield,
        daysAccumulated: STATS_TIMEFRAME_IN_DAYS[timeframe],
        pool: params.poolEntity,
        eventTimestamp: params.eventTimestamp,
      }),
    };
  }

  return new InitialPoolTimeframedStatsEntity({
    id: stat.id,
    poolId: stat.pool_id,
    timeframe,
    dataPointTimestamp: params.eventTimestamp,
  });
}
