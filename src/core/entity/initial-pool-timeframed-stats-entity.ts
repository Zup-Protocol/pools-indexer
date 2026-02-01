import type { BigDecimal, PoolTimeframedStats as PoolTimeframedStatsEntity } from "generated";
import type { StatsTimeframe_t } from "generated/src/db/Enums.gen";
import { ZERO_BIG_DECIMAL } from "../constants";

export class InitialPoolTimeframedStatsEntity implements PoolTimeframedStatsEntity {
  constructor(
    readonly params: { id: string; dataPointTimestamp: bigint; poolId: string; timeframe: StatsTimeframe_t },
  ) {
    this.id = this.params.id;
    this.timeframe = this.params.timeframe;
    this.pool_id = this.params.poolId;
    this.dataPointTimestamp = this.params.dataPointTimestamp;
  }

  readonly id: string;
  readonly timeframe: StatsTimeframe_t;
  readonly pool_id: string;
  readonly dataPointTimestamp: bigint;
  readonly accumulatedYield: BigDecimal = ZERO_BIG_DECIMAL;
  readonly feesUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly liquidityNetInflowUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly swapVolumeUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly yearlyYield: BigDecimal = ZERO_BIG_DECIMAL;
  readonly trackedLiquidityNetInflowUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly trackedSwapVolumeUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly liquidityVolumeUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly trackedLiquidityVolumeUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly trackedFeesUsd: BigDecimal = ZERO_BIG_DECIMAL;
}
