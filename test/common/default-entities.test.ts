import assert from "assert";
import {
  AlgebraPoolData,
  DeFiPoolDailyData,
  DeFiPoolData,
  DeFiPoolHourlyData,
  PoolDailyData,
  Pool as PoolEntity,
  PoolHourlyData,
} from "generated";
import { AlgebraVersion } from "../../src/algebra-style-pools/common/enums/algebra-version";
import { DEFI_POOL_DATA_ID, ZERO_ADDRESS, ZERO_BIG_DECIMAL, ZERO_BIG_INT } from "../../src/common/constants";
import {
  defaultAlgebraPoolData,
  defaultDeFiPoolDailyData,
  defaultDeFiPoolData,
  defaultDeFiPoolHourlyData,
  defaultPoolDailyData,
  defaultPoolHourlyData,
} from "../../src/common/default-entities";
import { getPoolDailyDataId, getPoolHourlyDataId } from "../../src/common/pool-commons";
import { PoolMock } from "../mocks";

describe("DefaultEntities", () => {
  let poolEntity: PoolEntity;

  beforeEach(() => {
    poolEntity = {
      ...new PoolMock(),
      id: "pool-id",
    };
  });

  it(`should return the correct default object when getting the default pool hourly data,
    assigning also the passed variables`, () => {
    const eventTimestamp = BigInt(1);

    const expectedObject: PoolHourlyData = {
      id: getPoolHourlyDataId(eventTimestamp, poolEntity),
      pool_id: poolEntity.id,
      hourStartTimestamp: eventTimestamp,
      totalAccumulatedYield: poolEntity.totalAccumulatedYield,
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
      totalValueLockedToken0: poolEntity.totalValueLockedToken0,
      totalValueLockedToken1: poolEntity.totalValueLockedToken1,
      totalValueLockedUSD: poolEntity.totalValueLockedUSD,
      liquidityNetInflowToken0: ZERO_BIG_DECIMAL,
      liquidityNetInflowToken1: ZERO_BIG_DECIMAL,
      liquidityNetInflowUSD: ZERO_BIG_DECIMAL,
      liquidityInflowToken0: ZERO_BIG_DECIMAL,
      liquidityInflowToken1: ZERO_BIG_DECIMAL,
      liquidityInflowUSD: ZERO_BIG_DECIMAL,
      liquidityOutflowToken0: ZERO_BIG_DECIMAL,
      liquidityOutflowToken1: ZERO_BIG_DECIMAL,
      liquidityOutflowUSD: ZERO_BIG_DECIMAL,
    };

    assert.deepEqual(
      defaultPoolHourlyData({
        poolEntity: poolEntity,
        eventTimestamp: eventTimestamp,
      }),
      expectedObject
    );
  });

  it(`should return the correct default object when getting the default pool daily data,
    assigning also the passed variables`, () => {
    const eventTimestamp = BigInt(2187521);

    const expectedObject: PoolDailyData = {
      id: getPoolDailyDataId(eventTimestamp, poolEntity),
      pool_id: poolEntity.id,
      dayStartTimestamp: eventTimestamp,
      totalAccumulatedYield: poolEntity.totalAccumulatedYield,
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
      totalValueLockedToken0: poolEntity.totalValueLockedToken0,
      totalValueLockedToken1: poolEntity.totalValueLockedToken0,
      totalValueLockedUSD: poolEntity.totalValueLockedUSD,
      liquidityNetInflowToken0: ZERO_BIG_DECIMAL,
      liquidityNetInflowToken1: ZERO_BIG_DECIMAL,
      liquidityNetInflowUSD: ZERO_BIG_DECIMAL,
      liquidityInflowToken0: ZERO_BIG_DECIMAL,
      liquidityInflowToken1: ZERO_BIG_DECIMAL,
      liquidityInflowUSD: ZERO_BIG_DECIMAL,
      liquidityOutflowToken0: ZERO_BIG_DECIMAL,
      liquidityOutflowToken1: ZERO_BIG_DECIMAL,
      liquidityOutflowUSD: ZERO_BIG_DECIMAL,
    };

    assert.deepEqual(
      defaultPoolDailyData({
        poolEntity: poolEntity,
        eventTimestamp: eventTimestamp,
      }),
      expectedObject
    );
  });

  it(`should return the correct default object when getting the default defi pool data,
    assigning also the passed variables, and using the constant defi pool data id as id`, () => {
    const startedAtTimestamp = BigInt("916298168726178261");

    const expectedObject: DeFiPoolData = {
      id: DEFI_POOL_DATA_ID,
      poolsCount: 0,
      startedAtTimestamp: startedAtTimestamp,
    };

    assert.deepEqual(defaultDeFiPoolData(startedAtTimestamp), expectedObject);
  });

  it(`should return the correct default object when getting the default defi pool daily data,
    assigning also the passed variables`, () => {
    const dayId = "day-id";
    const dayStartTimestamp = BigInt(2187521);

    const expectedObject: DeFiPoolDailyData = {
      id: dayId,
      liquidityInflowUSD: ZERO_BIG_DECIMAL,
      liquidityNetInflowUSD: ZERO_BIG_DECIMAL,
      liquidityOutflowUSD: ZERO_BIG_DECIMAL,
      liquidityVolumeUSD: ZERO_BIG_DECIMAL,
      dayStartTimestamp: dayStartTimestamp,
    };

    assert.deepEqual(
      defaultDeFiPoolDailyData({
        dayId: dayId,
        dayStartTimestamp: dayStartTimestamp,
      }),
      expectedObject
    );
  });

  it(`should return the correct default object when getting the default defi pool hourly data,
    assigning also the passed variables`, () => {
    const hourId = "xabas-id";
    const hourStartTimestamp = BigInt(1029719827891);

    const expectedObject: DeFiPoolHourlyData = {
      id: hourId,
      liquidityInflowUSD: ZERO_BIG_DECIMAL,
      liquidityNetInflowUSD: ZERO_BIG_DECIMAL,
      liquidityOutflowUSD: ZERO_BIG_DECIMAL,
      liquidityVolumeUSD: ZERO_BIG_DECIMAL,
      hourStartTimestamp: hourStartTimestamp,
    };

    assert.deepEqual(
      defaultDeFiPoolHourlyData({
        hourId: hourId,
        hourStartTimestamp: hourStartTimestamp,
      }),
      expectedObject
    );
  });

  it(`should return the correct object for algebra pool data`, () => {
    const id = "algebra-pool-data-id";

    const expectedObject: AlgebraPoolData = {
      id: id,
      communityFee: 0,
      plugin: ZERO_ADDRESS,
      pluginConfig: 0,
      sqrtPriceX96: ZERO_BIG_INT,
      tick: ZERO_BIG_INT,
      tickSpacing: 0,
      deployer: ZERO_ADDRESS,
      version: AlgebraVersion.UNKNOWN,
    };

    assert.deepEqual(
      defaultAlgebraPoolData({
        id: id,
      }),
      expectedObject
    );
  });
});
