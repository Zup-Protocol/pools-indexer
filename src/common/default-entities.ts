import {
  AlgebraPoolData as AlgebraPoolDataEntity,
  DeFiPoolDailyData as DeFiPoolDailyDataEntity,
  DeFiPoolData as DeFiPoolDataEntity,
  DeFiPoolHourlyData as DeFiPoolHourlyDataEntity,
  PoolDailyData as PoolDailyDataEntity,
  Pool as PoolEntity,
  PoolHourlyData as PoolHourlyDataEntity,
} from "generated";
import { AlgebraVersion } from "../algebra-style-pools/common/enums/algebra-version";
import { DEFI_POOL_DATA_ID, ZERO_ADDRESS, ZERO_BIG_DECIMAL, ZERO_BIG_INT } from "./constants";
import { getPoolDailyDataId, getPoolHourlyDataId } from "./pool-commons";

export const defaultPoolHourlyData = (params: {
  poolEntity: PoolEntity;
  eventTimestamp: bigint;
}): PoolHourlyDataEntity => ({
  id: getPoolHourlyDataId(params.eventTimestamp, params.poolEntity),
  pool_id: params.poolEntity.id,
  hourStartTimestamp: params.eventTimestamp,
  totalAccumulatedYield: params.poolEntity.totalAccumulatedYield,
  yearlyYield: ZERO_BIG_DECIMAL,
  feesToken0: ZERO_BIG_DECIMAL,
  feesToken1: ZERO_BIG_DECIMAL,
  feesUSD: ZERO_BIG_DECIMAL,
  swapVolumeToken0: ZERO_BIG_DECIMAL,
  liquidityVolumeToken0: ZERO_BIG_DECIMAL,
  swapVolumeToken1: ZERO_BIG_DECIMAL,
  liquidityVolumeToken1: ZERO_BIG_DECIMAL,
  swapVolumeUSD: ZERO_BIG_DECIMAL,
  liquidityVolumeUSD: ZERO_BIG_DECIMAL,
  totalValueLockedToken0: params.poolEntity.totalValueLockedToken0,
  totalValueLockedToken1: params.poolEntity.totalValueLockedToken1,
  totalValueLockedUSD: params.poolEntity.totalValueLockedUSD,
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
  poolEntity: PoolEntity;
  eventTimestamp: bigint;
}): PoolDailyDataEntity => ({
  id: getPoolDailyDataId(params.eventTimestamp, params.poolEntity),
  pool_id: params.poolEntity.id,
  dayStartTimestamp: params.eventTimestamp,
  totalAccumulatedYield: params.poolEntity.totalAccumulatedYield,
  yearlyYield: ZERO_BIG_DECIMAL,
  feesToken0: ZERO_BIG_DECIMAL,
  feesToken1: ZERO_BIG_DECIMAL,
  feesUSD: ZERO_BIG_DECIMAL,
  swapVolumeToken0: ZERO_BIG_DECIMAL,
  liquidityVolumeToken0: ZERO_BIG_DECIMAL,
  swapVolumeToken1: ZERO_BIG_DECIMAL,
  liquidityVolumeToken1: ZERO_BIG_DECIMAL,
  swapVolumeUSD: ZERO_BIG_DECIMAL,
  liquidityVolumeUSD: ZERO_BIG_DECIMAL,
  totalValueLockedToken0: params.poolEntity.totalValueLockedToken0,
  totalValueLockedToken1: params.poolEntity.totalValueLockedToken0,
  totalValueLockedUSD: params.poolEntity.totalValueLockedUSD,
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

export const defaultDeFiPoolData = (startedAtTimestamp: bigint): DeFiPoolDataEntity => ({
  id: DEFI_POOL_DATA_ID,
  poolsCount: 0,
  startedAtTimestamp: startedAtTimestamp,
});

export const defaultDeFiPoolDailyData = (params: {
  dayId: string;
  dayStartTimestamp: bigint;
}): DeFiPoolDailyDataEntity => ({
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
}): DeFiPoolHourlyDataEntity => ({
  id: params.hourId,
  liquidityInflowUSD: ZERO_BIG_DECIMAL,
  liquidityNetInflowUSD: ZERO_BIG_DECIMAL,
  liquidityOutflowUSD: ZERO_BIG_DECIMAL,
  liquidityVolumeUSD: ZERO_BIG_DECIMAL,
  hourStartTimestamp: params.hourStartTimestamp,
});

export const defaultAlgebraPoolData = (params: { id: string }): AlgebraPoolDataEntity => ({
  id: params.id,
  communityFee: 0,
  plugin: ZERO_ADDRESS,
  pluginConfig: 0,
  sqrtPriceX96: ZERO_BIG_INT,
  tick: ZERO_BIG_INT,
  tickSpacing: 0,
  deployer: ZERO_ADDRESS,
  version: AlgebraVersion.UNKNOWN,
});
