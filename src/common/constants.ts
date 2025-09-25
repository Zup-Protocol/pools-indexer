import {
  BigDecimal,
  DeFiPoolDailyData,
  DeFiPoolData,
  DeFiPoolHourlyData,
  PoolDailyData,
  PoolHourlyData,
} from "generated";

export const ZERO_BIG_DECIMAL = BigDecimal(0);

export const ZERO_BIG_INT = BigInt(0);

export const MAX_UINT256 = BigInt(2) ** BigInt(256) - BigInt(1);

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const ONE_BIG_INT = BigInt(1);

export const Q96 = BigInt(2) ** BigInt(96);

export const ONE_HOUR_IN_SECONDS = 3_600;

export const OUTLIER_TOKEN_PRICE_PERCENT_THRESHOLD = 1000;

export const OUTLIER_TOKEN_VOLUME_PERCENT_THRESHOLD = 5000;

export const OUTLIER_POOL_TVL_PERCENT_THRESHOLD = 20000;

export const DEFI_POOL_DATA_ID = "defi-pool-data";

export const defaultPoolHourlyData = (params: {
  hourlyDataId: string;
  hourStartTimestamp: bigint;
  poolId: string;
}): PoolHourlyData => ({
  id: params.hourlyDataId,
  pool_id: params.poolId,
  hourStartTimestamp: params.hourStartTimestamp,
  feesToken0: ZERO_BIG_DECIMAL,
  feesToken1: ZERO_BIG_DECIMAL,
  feesUSD: ZERO_BIG_DECIMAL,
  swapVolumeToken0: ZERO_BIG_DECIMAL,
  liquidityVolumeToken0: ZERO_BIG_DECIMAL,
  swapVolumeToken1: ZERO_BIG_DECIMAL,
  liquidityVolumeToken1: ZERO_BIG_DECIMAL,
  swapVolumeUSD: ZERO_BIG_DECIMAL,
  liquidityVolumeUSD: ZERO_BIG_DECIMAL,
  totalValueLockedToken0: ZERO_BIG_DECIMAL,
  totalValueLockedToken1: ZERO_BIG_DECIMAL,
  totalValueLockedUSD: ZERO_BIG_DECIMAL,
  liquidityNetInflowToken0: ZERO_BIG_DECIMAL,
  liquidityNetInflowToken1: ZERO_BIG_DECIMAL,
  liquidityNetInflowUSD: ZERO_BIG_DECIMAL,
  liquidityInflowToken0: ZERO_BIG_DECIMAL,
  liquidityInflowToken1: ZERO_BIG_DECIMAL,
  liquidityInflowUSD: ZERO_BIG_DECIMAL,
  liquidityOutflowToken0: ZERO_BIG_DECIMAL,
  liquidityOutflowToken1: ZERO_BIG_DECIMAL,
  liquidityOutflowUSD: ZERO_BIG_DECIMAL,
});

export const defaultPoolDailyData = (params: {
  dayDataId: string;
  dayStartTimestamp: bigint;
  poolId: string;
}): PoolDailyData => ({
  id: params.dayDataId,
  pool_id: params.poolId,
  dayStartTimestamp: params.dayStartTimestamp,
  feesToken0: ZERO_BIG_DECIMAL,
  feesToken1: ZERO_BIG_DECIMAL,
  feesUSD: ZERO_BIG_DECIMAL,
  swapVolumeToken0: ZERO_BIG_DECIMAL,
  liquidityVolumeToken0: ZERO_BIG_DECIMAL,
  swapVolumeToken1: ZERO_BIG_DECIMAL,
  liquidityVolumeToken1: ZERO_BIG_DECIMAL,
  swapVolumeUSD: ZERO_BIG_DECIMAL,
  liquidityVolumeUSD: ZERO_BIG_DECIMAL,
  totalValueLockedToken0: ZERO_BIG_DECIMAL,
  totalValueLockedToken1: ZERO_BIG_DECIMAL,
  totalValueLockedUSD: ZERO_BIG_DECIMAL,
  liquidityNetInflowToken0: ZERO_BIG_DECIMAL,
  liquidityNetInflowToken1: ZERO_BIG_DECIMAL,
  liquidityNetInflowUSD: ZERO_BIG_DECIMAL,
  liquidityInflowToken0: ZERO_BIG_DECIMAL,
  liquidityInflowToken1: ZERO_BIG_DECIMAL,
  liquidityInflowUSD: ZERO_BIG_DECIMAL,
  liquidityOutflowToken0: ZERO_BIG_DECIMAL,
  liquidityOutflowToken1: ZERO_BIG_DECIMAL,
  liquidityOutflowUSD: ZERO_BIG_DECIMAL,
});

export const defaultDeFiPoolData = (startedAtTimestamp: bigint): DeFiPoolData => ({
  id: DEFI_POOL_DATA_ID,
  poolsCount: 0,
  startedAtTimestamp: startedAtTimestamp,
});

export const defaultDeFiPoolDailyData = (params: { dayId: string; dayStartTimestamp: bigint }): DeFiPoolDailyData => ({
  id: params.dayId,
  liquidityInflowUSD: ZERO_BIG_DECIMAL,
  liquidityNetInflowUSD: ZERO_BIG_DECIMAL,
  liquidityOutflowUSD: ZERO_BIG_DECIMAL,
  liquidityVolumeUSD: ZERO_BIG_DECIMAL,
  dayStartTimestamp: params.dayStartTimestamp,
});

export const defaultDeFiPoolHourlyData = (params: {
  hourId: string;
  hourStartTimestamp: bigint;
}): DeFiPoolHourlyData => ({
  id: params.hourId,
  liquidityInflowUSD: ZERO_BIG_DECIMAL,
  liquidityNetInflowUSD: ZERO_BIG_DECIMAL,
  liquidityOutflowUSD: ZERO_BIG_DECIMAL,
  liquidityVolumeUSD: ZERO_BIG_DECIMAL,
  hourStartTimestamp: params.hourStartTimestamp,
});
