import type { BigDecimal, Pool as PoolEntity, PoolHistoricalData as PoolHistoricalDataEntity } from "generated";
import type { HistoricalDataInterval_t } from "generated/src/db/Enums.gen";
import { ZERO_BIG_DECIMAL } from "../constants";
import { Id } from "../id";

export class InitialPoolHistoricalDataEntity implements PoolHistoricalDataEntity {
  constructor(
    readonly params: {
      poolEntity: PoolEntity;
      interval: HistoricalDataInterval_t;
      eventTimestamp: bigint;
    },
  ) {
    switch (params.interval) {
      case "DAILY":
        this.id = Id.buildDailyDataId(params.eventTimestamp, params.poolEntity.chainId, params.poolEntity.poolAddress);
        break;

      case "HOURLY":
        this.id = Id.buildHourlyDataId(params.eventTimestamp, params.poolEntity.chainId, params.poolEntity.poolAddress);
        break;
    }

    this.pool_id = params.poolEntity.id;
    this.interval = params.interval;
    this.timestampAtStart = params.eventTimestamp;
    this.timestampAtEnd = params.eventTimestamp;

    this.accumulatedYieldAtStart = params.poolEntity.accumulatedYield;
    this.accumulatedYieldAtEnd = params.poolEntity.accumulatedYield;

    this.feesUsdAtStart = params.poolEntity.feesUsd;
    this.feesUsdAtEnd = params.poolEntity.feesUsd;

    this.liquidityNetInflowUsdAtStart = params.poolEntity.liquidityNetInflowUsd;
    this.liquidityNetInflowUsdAtEnd = params.poolEntity.liquidityNetInflowUsd;

    this.swapVolumeUsdAtStart = params.poolEntity.swapVolumeUsd;
    this.swapVolumeUsdAtEnd = params.poolEntity.swapVolumeUsd;

    this.totalValueLockedToken0AtStart = params.poolEntity.totalValueLockedToken0;
    this.totalValueLockedToken0AtEnd = params.poolEntity.totalValueLockedToken0;

    this.totalValueLockedToken1AtStart = params.poolEntity.totalValueLockedToken1;
    this.totalValueLockedToken1AtEnd = params.poolEntity.totalValueLockedToken1;

    this.totalValueLockedUsdAtStart = params.poolEntity.totalValueLockedUsd;
    this.totalValueLockedUsdAtEnd = params.poolEntity.totalValueLockedUsd;

    this.trackedFeesUsdAtStart = params.poolEntity.trackedFeesUsd;
    this.trackedFeesUsdAtEnd = params.poolEntity.trackedFeesUsd;

    this.trackedSwapVolumeUsdAtStart = params.poolEntity.trackedSwapVolumeUsd;
    this.trackedSwapVolumeUsdAtEnd = params.poolEntity.trackedSwapVolumeUsd;

    this.trackedLiquidityNetInflowUsdAtStart = params.poolEntity.trackedLiquidityNetInflowUsd;
    this.trackedLiquidityNetInflowUsdAtEnd = params.poolEntity.trackedLiquidityNetInflowUsd;

    this.trackedTotalValueLockedUsdAtStart = params.poolEntity.trackedTotalValueLockedUsd;
    this.trackedTotalValueLockedUsdAtEnd = params.poolEntity.trackedTotalValueLockedUsd;

    this.liquidityVolumeUsdAtStart = params.poolEntity.liquidityVolumeUsd;
    this.liquidityVolumeUsdAtEnd = params.poolEntity.liquidityVolumeUsd;

    this.trackedLiquidityVolumeUsdAtStart = params.poolEntity.trackedLiquidityVolumeUsd;
    this.trackedLiquidityVolumeUsdAtEnd = params.poolEntity.trackedLiquidityVolumeUsd;
  }

  readonly id: string;
  readonly pool_id: string;
  readonly interval: HistoricalDataInterval_t;
  readonly timestampAtStart: bigint;
  readonly timestampAtEnd: bigint;
  readonly accumulatedYieldAtStart: BigDecimal;
  readonly accumulatedYieldAtEnd: BigDecimal;
  readonly feesUsdAtStart: BigDecimal;
  readonly feesUsdAtEnd: BigDecimal;
  readonly liquidityNetInflowUsdAtStart: BigDecimal;
  readonly liquidityNetInflowUsdAtEnd: BigDecimal;
  readonly swapVolumeUsdAtStart: BigDecimal;
  readonly swapVolumeUsdAtEnd: BigDecimal;
  readonly totalValueLockedToken0AtStart: BigDecimal;
  readonly totalValueLockedToken0AtEnd: BigDecimal;
  readonly totalValueLockedToken1AtStart: BigDecimal;
  readonly totalValueLockedToken1AtEnd: BigDecimal;
  readonly totalValueLockedUsdAtStart: BigDecimal;
  readonly totalValueLockedUsdAtEnd: BigDecimal;

  readonly trackedFeesUsdAtStart: BigDecimal;
  readonly trackedFeesUsdAtEnd: BigDecimal;
  readonly trackedSwapVolumeUsdAtStart: BigDecimal;
  readonly trackedSwapVolumeUsdAtEnd: BigDecimal;
  readonly trackedLiquidityNetInflowUsdAtStart: BigDecimal;
  readonly trackedLiquidityNetInflowUsdAtEnd: BigDecimal;
  readonly trackedTotalValueLockedUsdAtStart: BigDecimal;
  readonly trackedTotalValueLockedUsdAtEnd: BigDecimal;
  readonly liquidityVolumeUsdAtStart: BigDecimal;
  readonly liquidityVolumeUsdAtEnd: BigDecimal;
  readonly trackedLiquidityVolumeUsdAtStart: BigDecimal;
  readonly trackedLiquidityVolumeUsdAtEnd: BigDecimal;

  readonly intervalFeesToken0: BigDecimal = ZERO_BIG_DECIMAL;
  readonly intervalFeesToken1: BigDecimal = ZERO_BIG_DECIMAL;
  readonly intervalFeesUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly intervalLiquidityInflowToken0: BigDecimal = ZERO_BIG_DECIMAL;
  readonly intervalLiquidityInflowToken1: BigDecimal = ZERO_BIG_DECIMAL;
  readonly intervalLiquidityInflowUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly intervalLiquidityNetInflowToken0: BigDecimal = ZERO_BIG_DECIMAL;
  readonly intervalLiquidityNetInflowToken1: BigDecimal = ZERO_BIG_DECIMAL;
  readonly intervalLiquidityNetInflowUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly intervalLiquidityOutflowToken0: BigDecimal = ZERO_BIG_DECIMAL;
  readonly intervalLiquidityOutflowToken1: BigDecimal = ZERO_BIG_DECIMAL;
  readonly intervalLiquidityOutflowUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly intervalLiquidityVolumeToken0: BigDecimal = ZERO_BIG_DECIMAL;
  readonly intervalLiquidityVolumeToken1: BigDecimal = ZERO_BIG_DECIMAL;
  readonly intervalLiquidityVolumeUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly intervalSwapVolumeToken0: BigDecimal = ZERO_BIG_DECIMAL;
  readonly intervalSwapVolumeToken1: BigDecimal = ZERO_BIG_DECIMAL;
  readonly intervalSwapVolumeUsd: BigDecimal = ZERO_BIG_DECIMAL;
}
