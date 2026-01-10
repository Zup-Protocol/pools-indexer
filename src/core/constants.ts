import { BigDecimal } from "generated";
import type { StatsTimeframe_t } from "generated/src/db/Enums.gen";

export const ZERO_BIG_DECIMAL = BigDecimal(0);

export const ONE_BIG_DECIMAL = BigDecimal(1);

export const HUNDRED_BIG_DECIMAL = BigDecimal(100);

export const MILLION_BIG_INT = BigInt(1_000_000);

export const ZERO_BIG_INT = BigInt(0);

export const MAX_UINT256 = BigInt(2) ** BigInt(256) - BigInt(1);

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const ONE_BIG_INT = BigInt(1);

export const Q96 = BigInt(2) ** BigInt(96);

export const ONE_HOUR_IN_SECONDS = 3_600;

export const ONE_DAY_IN_SECONDS = 86_400;

export const ONE_DAY_IN_HOURS = 24;

export const OUTLIER_TOKEN_PRICE_PERCENT_THRESHOLD = 10;

export const MAX_TVL_IMBALANCE_PERCENTAGE = 10_000; // 10k%

export const STATS_TIMEFRAME_IN_DAYS: Record<StatsTimeframe_t, number> = {
  DAY: 1,
  WEEK: 7,
  MONTH: 30,
  QUARTER: 90,
};

export const STATS_TIMEFRAME_IN_HOURS: Record<StatsTimeframe_t, number> = {
  DAY: ONE_DAY_IN_HOURS,
  WEEK: ONE_DAY_IN_HOURS * STATS_TIMEFRAME_IN_DAYS.WEEK,
  MONTH: ONE_DAY_IN_HOURS * STATS_TIMEFRAME_IN_DAYS.MONTH,
  QUARTER: ONE_DAY_IN_HOURS * STATS_TIMEFRAME_IN_DAYS.QUARTER,
};

export const MAX_PRICE_DISCOVERY_CAPITAL_USD = 100_000_000_000;
