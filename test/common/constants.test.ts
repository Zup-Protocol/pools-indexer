import assert from "assert";
import {
  BigDecimal,
  DeFiPoolDailyData,
  DeFiPoolData,
  DeFiPoolHourlyData,
  PoolDailyData,
  PoolHourlyData,
} from "generated";
import {
  defaultDeFiPoolDailyData,
  defaultDeFiPoolData,
  defaultDeFiPoolHourlyData,
  defaultPoolDailyData,
  defaultPoolHourlyData,
  DEFI_POOL_DATA_ID,
  MAX_UINT256,
  ONE_BIG_INT,
  ONE_HOUR_IN_SECONDS,
  OUTLIER_POOL_TVL_PERCENT_THRESHOLD,
  OUTLIER_TOKEN_PRICE_PERCENT_THRESHOLD,
  OUTLIER_TOKEN_VOLUME_PERCENT_THRESHOLD,
  ZERO_ADDRESS,
  ZERO_BIG_DECIMAL,
  ZERO_BIG_INT,
} from "../../src/common/constants";

describe("Constants", () => {
  it("Zero big decimal should return zero as Big Decimal", () => {
    assert(ZERO_BIG_DECIMAL.eq(BigDecimal("0")));
  });

  it("Zero big int should return zero as big int", () => {
    assert.equal(ZERO_BIG_INT, BigInt(0));
  });

  it("MAX_UINT256 should return the correct value", () => {
    assert.equal(
      BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935").toString(),
      MAX_UINT256.toString()
    );
  });

  it("ZERO_ADDRESS should return the correct value", () => {
    assert.equal("0x0000000000000000000000000000000000000000", ZERO_ADDRESS);
  });

  it("ONE_BIG_INT should return the correct value", () => {
    assert.equal(BigInt(1), ONE_BIG_INT);
  });

  it("Q96 should return the correct value", () => {
    assert.equal(BigInt(2) ** 96n, BigInt(2) ** 96n);
  });

  it("ONE_HOUR_IN_SECONDS should return the correct value", () => {
    assert.equal(ONE_HOUR_IN_SECONDS, BigInt(3600));
  });

  it("should return the correct value for OUTLIER_TOKEN_PRICE_PERCENT_THRESHOLD", () => {
    assert.equal(OUTLIER_TOKEN_PRICE_PERCENT_THRESHOLD, 1000);
  });

  it("should return the correct value for OUTLIER_TOKEN_VOLUME_PERCENT_THRESHOLD", () => {
    assert.equal(OUTLIER_TOKEN_VOLUME_PERCENT_THRESHOLD, 5000);
  });

  it("should return the correct value for OUTLIER_POOL_TVL_PERCENT_THRESHOLD", () => {
    assert.equal(OUTLIER_POOL_TVL_PERCENT_THRESHOLD, 20000);
  });

  it("should return the correct value for DEFI_POOL_DATA_ID", () => {
    assert.equal(DEFI_POOL_DATA_ID, "defi-pool-data");
  });

  it(`should return the correct default object when getting the default pool hourly data,
    assigning also the passed variables`, () => {
    const hourlyId = "hourly-id";
    const hourStartTimestamp = BigInt(1);
    const poolId = "pool-id";

    const expectedObject: PoolHourlyData = {
      id: hourlyId,
      pool_id: poolId,
      hourStartTimestamp: hourStartTimestamp,
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
    };

    assert.deepEqual(
      defaultPoolHourlyData({
        hourlyDataId: hourlyId,
        hourStartTimestamp: hourStartTimestamp,
        poolId: poolId,
      }),
      expectedObject
    );
  });

  it(`should return the correct default object when getting the default pool daily data,
    assigning also the passed variables`, () => {
    const dailyId = "day-id";
    const dayStartTimestamp = BigInt(2187521);
    const poolId = "pool-id";

    const expectedObject: PoolDailyData = {
      id: dailyId,
      pool_id: poolId,
      dayStartTimestamp: dayStartTimestamp,
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
    };

    assert.deepEqual(
      defaultPoolDailyData({
        dayDataId: dailyId,
        dayStartTimestamp: dayStartTimestamp,
        poolId: poolId,
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
});
