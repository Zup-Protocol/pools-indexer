import assert from "assert";
import { BigDecimal, DeFiPoolData } from "generated";
import { HandlerContext } from "generated/src/Types";
import { ONE_HOUR_IN_SECONDS, ZERO_BIG_DECIMAL } from "../../src/common/constants";
import { getDeFiPoolDailyDataId, getDeFiPoolHourlyDataId } from "../../src/common/defi-pool-data-commons";
import { DeFiPoolDataSetters } from "../../src/common/defi-pool-data-setters";
import { getLiquidityInflowAndOutflowFromRawAmounts } from "../../src/common/pool-commons";
import { formatFromTokenAmount } from "../../src/common/token-commons";
import {
  DeFiPoolDailyDataMock,
  DeFiPoolDataMock,
  DeFiPoolHourlyDataMock,
  handlerContextCustomMock,
  TokenMock,
} from "../mocks";

describe("DeFiPoolDataSetters", () => {
  let context: HandlerContext;
  let sut: DeFiPoolDataSetters;
  let defiPoolData: DeFiPoolData;

  beforeEach(() => {
    defiPoolData = new DeFiPoolDataMock();
    context = handlerContextCustomMock();
    sut = new DeFiPoolDataSetters(context);
  });

  it(`should modify a single daily liquidity data entity if calling 'setIntervalLiquidityData'
    multiple times within 24h of each other adding liquidity`, async () => {
    let existingDailyLiquidityData = new DeFiPoolDailyDataMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("10");

    const currentLiquidityInflowUSD = BigDecimal("78152761");
    const currentLiquidityOutflowUSD = BigDecimal("1291072981");
    const currentLiquidityVolumeUSD = BigDecimal("12451");
    const currentLiquidityNetInflowUSD = BigDecimal("-1892");
    const eventTimestamp = existingDailyLiquidityData.dayStartTimestamp;
    const amount0Added = BigInt(12516) * 10n ** BigInt(token0.decimals);
    const amount1Added = BigInt(222) * 10n ** BigInt(token0.decimals);
    const amount0AddedFormatted = formatFromTokenAmount(amount0Added, token0);
    const amount1AddedFormatted = formatFromTokenAmount(amount1Added, token1);
    const timesCalled = 8;

    existingDailyLiquidityData = {
      ...existingDailyLiquidityData,
      id: getDeFiPoolDailyDataId(eventTimestamp, defiPoolData),
      liquidityInflowUSD: currentLiquidityInflowUSD,
      liquidityNetInflowUSD: currentLiquidityNetInflowUSD,
      liquidityOutflowUSD: currentLiquidityOutflowUSD,
      liquidityVolumeUSD: currentLiquidityVolumeUSD,
    };

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const liquidityInflowsAndOutflows = getLiquidityInflowAndOutflowFromRawAmounts(
      amount0Added,
      amount1Added,
      token0,
      token1
    );

    const liquidityVolume = amount0AddedFormatted
      .times(token0.usdPrice)
      .plus(amount1AddedFormatted.times(token1.usdPrice))
      .times(timesCalled);

    context.DeFiPoolDailyData.set(existingDailyLiquidityData);

    for (let i = 0; i < timesCalled; i++) {
      await sut.setIntervalLiquidityData(
        eventTimestamp + BigInt(i * ONE_HOUR_IN_SECONDS),
        defiPoolData,
        amount0Added,
        amount1Added,
        token0,
        token1
      );
    }

    const updatedDailyData = await context.DeFiPoolDailyData.getOrThrow(existingDailyLiquidityData.id);

    assert.deepEqual(
      updatedDailyData.liquidityInflowUSD,
      currentLiquidityInflowUSD.plus(liquidityInflowsAndOutflows.inflowUSD.times(timesCalled)),
      "liquidityInflowUSD should be correctly updated"
    );

    assert.deepEqual(
      updatedDailyData.liquidityOutflowUSD,
      currentLiquidityOutflowUSD.plus(liquidityInflowsAndOutflows.outflowUSD.times(timesCalled)),
      "liquidityOutflowUSD should be correctly updated"
    );

    assert.deepEqual(
      updatedDailyData.liquidityVolumeUSD,
      currentLiquidityVolumeUSD.plus(liquidityVolume),
      "liquidityVolumeUSD should be correctly updated"
    );

    assert.deepEqual(
      updatedDailyData.liquidityNetInflowUSD,
      currentLiquidityNetInflowUSD.plus(liquidityInflowsAndOutflows.netInflowUSD.times(timesCalled)),
      "liquidityNetInflowUSD should be correctly updated"
    );
  });

  it(`should modify a single daily liquidity data entity if calling 'setIntervalLiquidityData'
    multiple times within 24h of each other removing liquidity`, async () => {
    let existingDailyLiquidityData = new DeFiPoolDailyDataMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("10");

    const currentLiquidityInflowUSD = BigDecimal("9999999");
    const currentLiquidityOutflowUSD = BigDecimal("222126");
    const currentLiquidityVolumeUSD = BigDecimal("219072891");
    const currentLiquidityNetInflowUSD = BigDecimal("12861782617826125617");
    const eventTimestamp = existingDailyLiquidityData.dayStartTimestamp;
    const amount0removed = BigInt(891698231689) * 10n ** BigInt(token0.decimals) * -1n;
    const amount1removed = BigInt(23232) * 10n ** BigInt(token0.decimals) * -1n;
    const amount0RemovedFormatted = formatFromTokenAmount(amount0removed, token0);
    const amount1RemovedFormatted = formatFromTokenAmount(amount1removed, token1);
    const timesCalled = 15;

    existingDailyLiquidityData = {
      ...existingDailyLiquidityData,
      id: getDeFiPoolDailyDataId(eventTimestamp, defiPoolData),
      liquidityInflowUSD: currentLiquidityInflowUSD,
      liquidityNetInflowUSD: currentLiquidityNetInflowUSD,
      liquidityOutflowUSD: currentLiquidityOutflowUSD,
      liquidityVolumeUSD: currentLiquidityVolumeUSD,
    };

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const liquidityInflowsAndOutflows = getLiquidityInflowAndOutflowFromRawAmounts(
      amount0removed,
      amount1removed,
      token0,
      token1
    );

    const liquidityVolume = amount0RemovedFormatted
      .abs()
      .times(token0.usdPrice)
      .plus(amount1RemovedFormatted.abs().times(token1.usdPrice))
      .times(timesCalled);

    context.DeFiPoolDailyData.set(existingDailyLiquidityData);

    for (let i = 0; i < timesCalled; i++) {
      await sut.setIntervalLiquidityData(
        eventTimestamp + BigInt(i * ONE_HOUR_IN_SECONDS),
        defiPoolData,
        amount0removed,
        amount1removed,
        token0,
        token1
      );
    }

    const updatedDailyData = await context.DeFiPoolDailyData.getOrThrow(existingDailyLiquidityData.id);

    assert.deepEqual(
      updatedDailyData.liquidityInflowUSD,
      currentLiquidityInflowUSD.plus(liquidityInflowsAndOutflows.inflowUSD.times(timesCalled)),
      "liquidityInflowUSD should be correctly updated"
    );

    assert.deepEqual(
      updatedDailyData.liquidityOutflowUSD,
      currentLiquidityOutflowUSD.plus(liquidityInflowsAndOutflows.outflowUSD.times(timesCalled)),
      "liquidityOutflowUSD should be correctly updated"
    );

    assert.deepEqual(
      updatedDailyData.liquidityVolumeUSD,
      currentLiquidityVolumeUSD.plus(liquidityVolume),
      "liquidityVolumeUSD should be correctly updated"
    );

    assert.deepEqual(
      updatedDailyData.liquidityNetInflowUSD,
      currentLiquidityNetInflowUSD.plus(liquidityInflowsAndOutflows.netInflowUSD.times(timesCalled)),
      "liquidityNetInflowUSD should be correctly updated"
    );
  });

  it(`should create many daily liquidity data entities and modify them
   with the liquidity values if calling 'setIntervalLiquidityData'
   multiple times with more than 24h of each other adding liquidity`, async () => {
    const defiPoolData = new DeFiPoolDataMock();
    let eventTimestamp = defiPoolData.startedAtTimestamp;
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("10");

    const amount0addded = BigInt(891698231689) * 10n ** BigInt(token0.decimals);
    const amount1added = BigInt(23232) * 10n ** BigInt(token1.decimals);
    const amount0AddedFormatted = formatFromTokenAmount(amount0addded, token0);
    const amount1AddedFormatted = formatFromTokenAmount(amount1added, token1);
    const timesCalled = 15;

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    for (let i = 0; i < timesCalled; i++) {
      eventTimestamp = eventTimestamp + BigInt(ONE_HOUR_IN_SECONDS * 25);
      await sut.setIntervalLiquidityData(eventTimestamp, defiPoolData, amount0addded, amount1added, token0, token1);

      const updatedPoolDailyData = await context.DeFiPoolDailyData.getOrThrow(
        getDeFiPoolDailyDataId(eventTimestamp, defiPoolData)
      );

      assert.deepEqual(
        updatedPoolDailyData.liquidityVolumeUSD,
        amount0AddedFormatted.times(token0.usdPrice).plus(amount1AddedFormatted.times(token1.usdPrice)),
        "liquidityVolumeUSD should be correctly updated"
      );

      assert.deepEqual(
        updatedPoolDailyData.liquidityNetInflowUSD,
        amount0AddedFormatted.times(token0.usdPrice).plus(amount1AddedFormatted.times(token1.usdPrice)),
        "liquidityNetInflowUSD should be correctly updated"
      );

      assert.deepEqual(
        updatedPoolDailyData.liquidityInflowUSD,
        amount0AddedFormatted.times(token0.usdPrice).plus(amount1AddedFormatted.times(token1.usdPrice)),
        "liquidityInflowUSD should be correctly updated"
      );

      assert.deepEqual(
        updatedPoolDailyData.liquidityOutflowUSD,
        ZERO_BIG_DECIMAL,
        "liquidityOutflowUSD should be correctly updated"
      );
    }
  });

  it(`should create many daily liquidity data entities and modify them
   with the liquidity values if calling 'setIntervalLiquidityData'
   multiple times with more than 24h of each other removing liquidity`, async () => {
    const defiPoolData = new DeFiPoolDataMock();
    let eventTimestamp = defiPoolData.startedAtTimestamp;
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("10");

    const amount0Removed = BigInt(891698231689) * 10n ** BigInt(token0.decimals) * -1n;
    const amount1Removed = BigInt(23232) * 10n ** BigInt(token1.decimals) * -1n;
    const amount0RemovedFormatted = formatFromTokenAmount(amount0Removed, token0);
    const amount1RemovedFormatted = formatFromTokenAmount(amount1Removed, token1);
    const timesCalled = 15;

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    for (let i = 0; i < timesCalled; i++) {
      eventTimestamp = eventTimestamp + BigInt(ONE_HOUR_IN_SECONDS * 25);
      await sut.setIntervalLiquidityData(eventTimestamp, defiPoolData, amount0Removed, amount1Removed, token0, token1);

      const updatedPoolDailyData = await context.DeFiPoolDailyData.getOrThrow(
        getDeFiPoolDailyDataId(eventTimestamp, defiPoolData)
      );

      assert.deepEqual(
        updatedPoolDailyData.liquidityVolumeUSD,
        amount0RemovedFormatted.abs().times(token0.usdPrice).plus(amount1RemovedFormatted.abs().times(token1.usdPrice)),
        "liquidityVolumeUSD should be correctly updated"
      );

      assert.deepEqual(
        updatedPoolDailyData.liquidityNetInflowUSD,
        amount0RemovedFormatted.times(token0.usdPrice).plus(amount1RemovedFormatted.times(token1.usdPrice)),
        "liquidityNetInflowUSD should be correctly updated"
      );

      assert.deepEqual(
        updatedPoolDailyData.liquidityInflowUSD,
        ZERO_BIG_DECIMAL,
        "liquidityInflowUSD should be correctly updated"
      );

      assert.deepEqual(
        updatedPoolDailyData.liquidityOutflowUSD,
        amount0RemovedFormatted.abs().times(token0.usdPrice).plus(amount1RemovedFormatted.abs().times(token1.usdPrice)),
        "liquidityOutflowUSD should be correctly updated"
      );
    }
  });

  it(`should create many hourly liquidity data entities and modify them
   with the liquidity values if calling 'setIntervalLiquidityData'
   multiple times with more than 1h of each other removing liquidity`, async () => {
    const defiPoolData = new DeFiPoolDataMock();
    let eventTimestamp = defiPoolData.startedAtTimestamp;
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("10");

    const amount0Removed = BigInt(1111) * 10n ** BigInt(token0.decimals) * -1n;
    const amount1Removed = BigInt(1927109) * 10n ** BigInt(token1.decimals) * -1n;
    const amount0RemovedFormatted = formatFromTokenAmount(amount0Removed, token0);
    const amount1RemovedFormatted = formatFromTokenAmount(amount1Removed, token1);
    const timesCalled = 15;

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    for (let i = 0; i < timesCalled; i++) {
      eventTimestamp = eventTimestamp + BigInt(ONE_HOUR_IN_SECONDS);
      await sut.setIntervalLiquidityData(eventTimestamp, defiPoolData, amount0Removed, amount1Removed, token0, token1);

      const updatedPoolHourlyData = await context.DeFiPoolHourlyData.getOrThrow(
        getDeFiPoolHourlyDataId(eventTimestamp, defiPoolData)
      );

      assert.deepEqual(
        updatedPoolHourlyData.liquidityVolumeUSD,
        amount0RemovedFormatted.abs().times(token0.usdPrice).plus(amount1RemovedFormatted.abs().times(token1.usdPrice)),
        "liquidityVolumeUSD should be correctly updated"
      );

      assert.deepEqual(
        updatedPoolHourlyData.liquidityNetInflowUSD,
        amount0RemovedFormatted.times(token0.usdPrice).plus(amount1RemovedFormatted.times(token1.usdPrice)),
        "liquidityNetInflowUSD should be correctly updated"
      );

      assert.deepEqual(
        updatedPoolHourlyData.liquidityInflowUSD,
        ZERO_BIG_DECIMAL,
        "liquidityInflowUSD should be correctly updated"
      );

      assert.deepEqual(
        updatedPoolHourlyData.liquidityOutflowUSD,
        amount0RemovedFormatted.abs().times(token0.usdPrice).plus(amount1RemovedFormatted.abs().times(token1.usdPrice)),
        "liquidityOutflowUSD should be correctly updated"
      );
    }
  });

  it(`should create many hourly liquidity data entities and modify them
   with the liquidity values if calling 'setIntervalLiquidityData'
   multiple times with more than 1h of each other adding liquidity`, async () => {
    const defiPoolData = new DeFiPoolDataMock();
    let eventTimestamp = defiPoolData.startedAtTimestamp;
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("10");

    const amount0Added = BigInt(1) * 10n ** BigInt(token0.decimals);
    const amount1Added = BigInt(8269) * 10n ** BigInt(token1.decimals);
    const amount0AddedFormatted = formatFromTokenAmount(amount0Added, token0);
    const amount1AddedFormatted = formatFromTokenAmount(amount1Added, token1);
    const timesCalled = 15;

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    for (let i = 0; i < timesCalled; i++) {
      eventTimestamp = eventTimestamp + BigInt(ONE_HOUR_IN_SECONDS);
      await sut.setIntervalLiquidityData(eventTimestamp, defiPoolData, amount0Added, amount1Added, token0, token1);

      const updatedPoolHourlyData = await context.DeFiPoolHourlyData.getOrThrow(
        getDeFiPoolHourlyDataId(eventTimestamp, defiPoolData)
      );

      assert.deepEqual(
        updatedPoolHourlyData.liquidityVolumeUSD,
        amount0AddedFormatted.abs().times(token0.usdPrice).plus(amount1AddedFormatted.abs().times(token1.usdPrice)),
        "liquidityVolumeUSD should be correctly updated"
      );

      assert.deepEqual(
        updatedPoolHourlyData.liquidityNetInflowUSD,
        amount0AddedFormatted.times(token0.usdPrice).plus(amount1AddedFormatted.times(token1.usdPrice)),
        "liquidityNetInflowUSD should be correctly updated"
      );

      assert.deepEqual(
        updatedPoolHourlyData.liquidityInflowUSD,
        amount0AddedFormatted.abs().times(token0.usdPrice).plus(amount1AddedFormatted.abs().times(token1.usdPrice)),
        "liquidityInflowUSD should be correctly updated"
      );

      assert.deepEqual(
        updatedPoolHourlyData.liquidityOutflowUSD,
        ZERO_BIG_DECIMAL,
        "liquidityOutflowUSD should be correctly updated"
      );
    }
  });

  it(`should modify a single hourly liquidity data entity if calling 'setIntervalLiquidityData'
      multiple times within 1h of each other adding liquidity`, async () => {
    let existingHourlyLiquidityData = new DeFiPoolHourlyDataMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("10");

    const currentLiquidityInflowUSD = BigDecimal("78152761");
    const currentLiquidityOutflowUSD = BigDecimal("1291072981");
    const currentLiquidityVolumeUSD = BigDecimal("12451");
    const currentLiquidityNetInflowUSD = BigDecimal("-1892");
    const eventTimestamp = existingHourlyLiquidityData.hourStartTimestamp;
    const amount0Added = BigInt(12516) * 10n ** BigInt(token0.decimals);
    const amount1Added = BigInt(222) * 10n ** BigInt(token0.decimals);
    const amount0AddedFormatted = formatFromTokenAmount(amount0Added, token0);
    const amount1AddedFormatted = formatFromTokenAmount(amount1Added, token1);
    const timesCalled = 8;

    existingHourlyLiquidityData = {
      ...existingHourlyLiquidityData,
      id: getDeFiPoolHourlyDataId(eventTimestamp, defiPoolData),
      liquidityInflowUSD: currentLiquidityInflowUSD,
      liquidityNetInflowUSD: currentLiquidityNetInflowUSD,
      liquidityOutflowUSD: currentLiquidityOutflowUSD,
      liquidityVolumeUSD: currentLiquidityVolumeUSD,
    };

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const liquidityInflowsAndOutflows = getLiquidityInflowAndOutflowFromRawAmounts(
      amount0Added,
      amount1Added,
      token0,
      token1
    );

    const liquidityVolume = amount0AddedFormatted
      .times(token0.usdPrice)
      .plus(amount1AddedFormatted.times(token1.usdPrice))
      .times(timesCalled);

    context.DeFiPoolHourlyData.set(existingHourlyLiquidityData);

    for (let i = 0; i < timesCalled; i++) {
      await sut.setIntervalLiquidityData(
        eventTimestamp + BigInt((i * ONE_HOUR_IN_SECONDS) / timesCalled),
        defiPoolData,
        amount0Added,
        amount1Added,
        token0,
        token1
      );
    }

    const updatedHourlyData = await context.DeFiPoolHourlyData.getOrThrow(existingHourlyLiquidityData.id);

    assert.deepEqual(
      updatedHourlyData.liquidityInflowUSD,
      currentLiquidityInflowUSD.plus(liquidityInflowsAndOutflows.inflowUSD.times(timesCalled)),
      "liquidityInflowUSD should be correctly updated"
    );

    assert.deepEqual(
      updatedHourlyData.liquidityOutflowUSD,
      currentLiquidityOutflowUSD.plus(liquidityInflowsAndOutflows.outflowUSD.times(timesCalled)),
      "liquidityOutflowUSD should be correctly updated"
    );

    assert.deepEqual(
      updatedHourlyData.liquidityVolumeUSD,
      currentLiquidityVolumeUSD.plus(liquidityVolume),
      "liquidityVolumeUSD should be correctly updated"
    );

    assert.deepEqual(
      updatedHourlyData.liquidityNetInflowUSD,
      currentLiquidityNetInflowUSD.plus(liquidityInflowsAndOutflows.netInflowUSD.times(timesCalled)),
      "liquidityNetInflowUSD should be correctly updated"
    );
  });

  it(`should modify a single hourly liquidity data entity if calling 'setIntervalLiquidityData'
      multiple times within 1h of each other removing liquidity`, async () => {
    let existingHourlyLiquidityData = new DeFiPoolHourlyDataMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("10");

    const currentLiquidityInflowUSD = BigDecimal("78152761");
    const currentLiquidityOutflowUSD = BigDecimal("1291072981");
    const currentLiquidityVolumeUSD = BigDecimal("12451");
    const currentLiquidityNetInflowUSD = BigDecimal("-1892");
    const eventTimestamp = existingHourlyLiquidityData.hourStartTimestamp;
    const amount0Removed = BigInt(11) * 10n ** BigInt(token0.decimals) * -1n;
    const amount1Removed = BigInt(99) * 10n ** BigInt(token0.decimals) * -1n;
    const amount0RemovedFormatted = formatFromTokenAmount(amount0Removed, token0);
    const amount1RemovedFormatted = formatFromTokenAmount(amount1Removed, token1);
    const timesCalled = 8;

    existingHourlyLiquidityData = {
      ...existingHourlyLiquidityData,
      id: getDeFiPoolHourlyDataId(eventTimestamp, defiPoolData),
      liquidityInflowUSD: currentLiquidityInflowUSD,
      liquidityNetInflowUSD: currentLiquidityNetInflowUSD,
      liquidityOutflowUSD: currentLiquidityOutflowUSD,
      liquidityVolumeUSD: currentLiquidityVolumeUSD,
    };

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const liquidityInflowsAndOutflows = getLiquidityInflowAndOutflowFromRawAmounts(
      amount0Removed,
      amount1Removed,
      token0,
      token1
    );

    const liquidityVolume = amount0RemovedFormatted
      .abs()
      .times(token0.usdPrice)
      .plus(amount1RemovedFormatted.abs().times(token1.usdPrice))
      .times(timesCalled);

    context.DeFiPoolHourlyData.set(existingHourlyLiquidityData);

    for (let i = 0; i < timesCalled; i++) {
      await sut.setIntervalLiquidityData(
        eventTimestamp + BigInt((i * ONE_HOUR_IN_SECONDS) / timesCalled),
        defiPoolData,
        amount0Removed,
        amount1Removed,
        token0,
        token1
      );
    }

    const updatedHourlyData = await context.DeFiPoolHourlyData.getOrThrow(existingHourlyLiquidityData.id);

    assert.deepEqual(
      updatedHourlyData.liquidityInflowUSD,
      currentLiquidityInflowUSD.plus(liquidityInflowsAndOutflows.inflowUSD.times(timesCalled)),
      "liquidityInflowUSD should be correctly updated"
    );

    assert.deepEqual(
      updatedHourlyData.liquidityOutflowUSD,
      currentLiquidityOutflowUSD.plus(liquidityInflowsAndOutflows.outflowUSD.times(timesCalled)),
      "liquidityOutflowUSD should be correctly updated"
    );

    assert.deepEqual(
      updatedHourlyData.liquidityVolumeUSD,
      currentLiquidityVolumeUSD.plus(liquidityVolume),
      "liquidityVolumeUSD should be correctly updated"
    );

    assert.deepEqual(
      updatedHourlyData.liquidityNetInflowUSD,
      currentLiquidityNetInflowUSD.plus(liquidityInflowsAndOutflows.netInflowUSD.times(timesCalled)),
      "liquidityNetInflowUSD should be correctly updated"
    );
  });
});
