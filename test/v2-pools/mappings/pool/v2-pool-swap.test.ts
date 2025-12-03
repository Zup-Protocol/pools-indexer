import assert from "assert";
import { BigDecimal, handlerContext, Pool, Token } from "generated";
import sinon from "sinon";
import {
  getPoolDailyDataId,
  getPoolHourlyDataId,
  getSwapFeesFromRawAmounts,
} from "../../../../src/common/pool-commons";
import { PoolSetters } from "../../../../src/common/pool-setters";
import { formatFromTokenAmount } from "../../../../src/common/token-commons";
import { poolReservesToPrice } from "../../../../src/v2-pools/common/v2-pool-converters";
import { handleV2PoolSwap } from "../../../../src/v2-pools/mappings/pool/v2-pool-swap";
import {
  handlerContextCustomMock,
  PoolDailyDataMock,
  PoolHourlyDataMock,
  PoolMock,
  TokenMock,
  V2PoolDataMock,
} from "../../../mocks";

describe("V2PoolSwapHandler", () => {
  let context: handlerContext;
  let eventTimestamp = BigInt(Date.now());
  let poolSetters: sinon.SinonStubbedInstance<PoolSetters>;

  beforeEach(() => {
    context = handlerContextCustomMock();
    poolSetters = sinon.createStubInstance(PoolSetters);

    poolSetters.updateTokenPricesFromPoolPrices.resolves([
      { ...new TokenMock(), usdPrice: BigDecimal("1200") },
      { ...new TokenMock(), usdPrice: BigDecimal("1300") },
    ]);

    poolSetters.updatePoolAccumulatedYield.resolvesArg(1);
  });

  afterEach(() => {
    sinon.restore();
  });

  it(`The handler should assign the correct usd prices got from 'updateTokenPricesFromPoolPrices' to the tokens`, async () => {
    const token0Id = "toko-cero";
    const token1Id = "toko-uno";
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    const token0ExpectedUsdPrice = BigDecimal("9836276.3222");
    const token1ExpectedUsdPrice = BigDecimal("0.91728716782");
    const amount0 = BigInt(100);
    const amount1 = BigInt(200);
    let v3PoolData = new V2PoolDataMock();

    v3PoolData = {
      ...v3PoolData,
      id: pool.id,
    };

    token0 = {
      ...token0,
      id: token0Id,
    };

    token1 = {
      ...token1,
      id: token1Id,
    };

    poolSetters.updateTokenPricesFromPoolPrices.resolves([
      { ...token0, usdPrice: token0ExpectedUsdPrice },
      { ...token1, usdPrice: token1ExpectedUsdPrice },
    ]);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolSwap({
      context,
      amount0In: amount0,
      amount0Out: 0n,
      amount1In: amount1,
      amount1Out: 0n,
      poolEntity: pool,
      updatedFeeTier: 100,
      v2PoolSetters: poolSetters,
      token0Entity: token0,
      token1Entity: token1,
      eventTimestamp: eventTimestamp,
    });

    const token0After = await context.Token.getOrThrow(token0Id);
    const token1After = await context.Token.getOrThrow(token1Id);

    assert.equal(token0After.usdPrice.toString(), token0ExpectedUsdPrice.toString(), "Token0 usd price is not correct");
    assert.equal(token1After.usdPrice.toString(), token1ExpectedUsdPrice.toString(), "Token1 usd price is not correct");
  });

  it(`The handler should call 'updateTokenPricesFromPoolPrices' in the pool setters with the corrent parameters`, async () => {
    const token0Id = "toko-cero";
    const token1Id = "toko-uno";
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    const token0ExpectedUsdPrice = BigDecimal("9836276.3222");
    const token1ExpectedUsdPrice = BigDecimal("0.91728716782");
    const amount0 = BigInt(100);
    const amount1 = BigInt(200);
    const amount0Formatted = formatFromTokenAmount(amount0, token0);
    const amount1Formatted = formatFromTokenAmount(amount1, token1);
    const newPoolTotalValueLocked0 = amount0Formatted.plus(pool.totalValueLockedToken0);
    const newPoolTotalValueLocked1 = amount1Formatted.plus(pool.totalValueLockedToken1);
    const poolPrices = poolReservesToPrice(newPoolTotalValueLocked0, newPoolTotalValueLocked1);

    token0 = {
      ...token0,
      id: token0Id,
    };

    token1 = {
      ...token1,
      id: token1Id,
    };

    poolSetters.updateTokenPricesFromPoolPrices.resolves([
      { ...token0, usdPrice: token0ExpectedUsdPrice },
      { ...token1, usdPrice: token1ExpectedUsdPrice },
    ]);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolSwap({
      context,
      amount0In: amount0,
      amount0Out: 0n,
      amount1In: amount1,
      amount1Out: 0n,
      poolEntity: pool,
      updatedFeeTier: 100,
      v2PoolSetters: poolSetters,
      token0Entity: token0,
      token1Entity: token1,
      eventTimestamp: eventTimestamp,
    });

    assert(
      poolSetters.updateTokenPricesFromPoolPrices.calledWith(
        token0,
        token1,
        {
          ...pool,
          totalValueLockedToken0: newPoolTotalValueLocked0,
          totalValueLockedToken1: newPoolTotalValueLocked1,
        },
        poolPrices
      )
    );
  });

  it(`When the handler is called, and the token0 amount in is not zero,
    it should increase pool token0 tvl by the amount passed in the event`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000002");

    let poolToken0TVLBefore = BigDecimal("325672.43");
    let amount0In = BigInt(200) * BigInt(10) ** BigInt(token0.decimals);
    let amount1In = BigInt(0);
    let amoun0Out = BigInt(0);
    let amoun1Out = BigInt(0);

    pool = {
      ...pool,
      token0_id: token0.id,
      totalValueLockedToken0: poolToken0TVLBefore,
    };

    context.Pool.set(pool);

    await handleV2PoolSwap({
      context: context,
      amount0In: amount0In,
      amount0Out: amoun0Out,
      amount1In: amount1In,
      amount1Out: amoun1Out,
      eventTimestamp: eventTimestamp,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: new TokenMock(),
      v2PoolSetters: poolSetters,
    });

    const updatedPool = await context.Pool.getOrThrow(pool.id);

    assert.deepEqual(
      updatedPool.totalValueLockedToken0,
      poolToken0TVLBefore.plus(formatFromTokenAmount(amount0In, token0))
    );
  });

  it(`When the handler is called, and the token0 amount out is not zero,
    it should decrease pool token0 tvl by the amount passed in the event`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000002");

    let poolToken0TVLBefore = BigDecimal("325672.43");
    let amount0In = BigInt(0);
    let amount1In = BigInt(0);
    let amount0Out = BigInt(200) * BigInt(10) ** BigInt(token0.decimals);
    let amount1Out = BigInt(0);

    pool = {
      ...pool,
      token0_id: token0.id,
      totalValueLockedToken0: poolToken0TVLBefore,
    };

    context.Pool.set(pool);

    await handleV2PoolSwap({
      context: context,
      amount0In: amount0In,
      amount0Out: amount0Out,
      amount1In: amount1In,
      amount1Out: amount1Out,
      eventTimestamp: eventTimestamp,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: new TokenMock(),
      v2PoolSetters: poolSetters,
    });

    const updatedPool = await context.Pool.getOrThrow(pool.id);

    assert.deepEqual(
      updatedPool.totalValueLockedToken0,
      poolToken0TVLBefore.minus(formatFromTokenAmount(amount0Out, token0))
    );
  });

  it(`When the handler is called, and the token1 amount in is not zero,
    it should increase pool token1 tvl by the amount passed in the event`, async () => {
    let pool = new PoolMock();
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");

    let poolToken1TVLBefore = BigDecimal("121320.43");
    let amount0In = BigInt(0);
    let amount1In = BigInt(98762) * BigInt(10) ** BigInt(token1.decimals);
    let amount0Out = BigInt(0);
    let amount1Out = BigInt(0);

    pool = {
      ...pool,
      token1_id: token1.id,
      totalValueLockedToken1: poolToken1TVLBefore,
    };

    await handleV2PoolSwap({
      context: context,
      amount0In: amount0In,
      amount0Out: amount0Out,
      amount1In: amount1In,
      amount1Out: amount1Out,
      eventTimestamp: eventTimestamp,
      poolEntity: pool,
      token0Entity: new TokenMock(),
      token1Entity: token1,
      v2PoolSetters: poolSetters,
    });

    const updatedPool = await context.Pool.getOrThrow(pool.id);

    assert.deepEqual(
      updatedPool.totalValueLockedToken1,
      poolToken1TVLBefore.plus(formatFromTokenAmount(amount1In, token1))
    );
  });

  it(`When the handler is called, and the token1 amount out is not zero,
    it should decrease the pool token1 tvl by the amount passed in the event`, async () => {
    let pool = new PoolMock();
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");

    let poolToken1TVLBefore = BigDecimal("121320.43");
    let amount0In = BigInt(0);
    let amount1In = BigInt(0);
    let amount0Out = BigInt(0);
    let amount1Out = BigInt(98762) * BigInt(10) ** BigInt(token1.decimals);

    pool = {
      ...pool,
      token1_id: token1.id,
      totalValueLockedToken1: poolToken1TVLBefore,
    };

    context.Pool.set(pool);

    await handleV2PoolSwap({
      context: context,
      amount0In: amount0In,
      amount0Out: amount0Out,
      amount1In: amount1In,
      amount1Out: amount1Out,
      eventTimestamp: eventTimestamp,
      poolEntity: pool,
      token0Entity: new TokenMock(),
      token1Entity: token1,
      v2PoolSetters: poolSetters,
    });

    const updatedPool = await context.Pool.getOrThrow(pool.id);

    assert.deepEqual(
      updatedPool.totalValueLockedToken1,
      poolToken1TVLBefore.minus(formatFromTokenAmount(amount1Out, token1))
    );
  });

  it(`When the handler is called, it should update the pool usd tvl after changing the tokens tvls
    and setting prices`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000012");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");

    let poolToken0TVLBefore = BigDecimal("91821.43");
    let poolToken1TVLBefore = BigDecimal("121320.43");

    let amount0In = BigInt(123) * BigInt(10) ** BigInt(token0.decimals);
    let amount1In = BigInt(0);
    let amount0Out = BigInt(0);
    let amount1Out = BigInt(87532) * BigInt(10) ** BigInt(token1.decimals);

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
      totalValueLockedToken0: poolToken0TVLBefore,
      totalValueLockedToken1: poolToken1TVLBefore,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    poolSetters.updateTokenPricesFromPoolPrices.resolves([token0, token1]);

    await handleV2PoolSwap({
      context: context,
      amount0In: amount0In,
      amount0Out: amount0Out,
      amount1In: amount1In,
      amount1Out: amount1Out,
      eventTimestamp: eventTimestamp,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      v2PoolSetters: poolSetters,
    });

    const updatedPool = await context.Pool.getOrThrow(pool.id);
    const updatedToken0 = await context.Token.getOrThrow(token0.id);
    const updatedToken1 = await context.Token.getOrThrow(token1.id);

    const expectedAmount = poolToken0TVLBefore
      .plus(formatFromTokenAmount(amount0In, updatedToken0))
      .times(updatedToken0.usdPrice)
      .plus(poolToken1TVLBefore.minus(formatFromTokenAmount(amount1Out, updatedToken1)).times(updatedToken1.usdPrice));

    console.log(updatedPool.totalValueLockedUSD.toString(), expectedAmount.toString());

    assert.deepEqual(updatedPool.totalValueLockedUSD, expectedAmount);
  });

  it(`When the handler is called, it should correctly call the
        pool setters to update the pool hourly data`, async () => {
    let token0Id = "0x0000000000000000000000000000000000000012";
    let token1Id = "0x0000000000000000000000000000000000000002";
    let pool = new PoolMock();
    let poolHoutlyDataId = getPoolHourlyDataId(eventTimestamp, pool);
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    let amount0 = 32n * 10n ** BigInt(token0.decimals);
    let amount1 = 199n * 10n ** BigInt(token1.decimals);
    let poolHourlyData = new PoolHourlyDataMock();
    let currentFees = BigDecimal("12.3");
    let swapFee = 500;

    pool = {
      ...pool,
      currentFeeTier: swapFee,
      token0_id: token0Id,
      token1_id: token1Id,
    };

    poolHourlyData = {
      ...poolHourlyData,
      id: poolHoutlyDataId,
      feesToken0: currentFees,
      pool_id: pool.id,
      hourStartTimestamp: eventTimestamp,
    };

    token0 = {
      ...token0,
      id: token0Id,
    };

    token1 = {
      ...token1,
      id: token1Id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.PoolHourlyData.set(poolHourlyData);

    await handleV2PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      amount0In: amount0,
      amount0Out: 0n,
      amount1In: 0n,
      amount1Out: amount1,
      v2PoolSetters: poolSetters,
      eventTimestamp,
      updatedFeeTier: swapFee,
    });

    assert(
      poolSetters.setIntervalSwapData.calledWithMatch(
        eventTimestamp,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        amount0,
        -amount1
      )
    );
  });

  it(`When the handler is called, it should correctly call the
        pool setters to update the pool daily data`, async () => {
    let token0Id = "0x0000000000000000000000000000000000000012";
    let token1Id = "0x0000000000000000000000000000000000000002";
    let pool = new PoolMock();
    let poolDailyDataId = getPoolDailyDataId(eventTimestamp, pool);
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    let amount0 = 32n * 10n ** BigInt(token0.decimals);
    let amount1 = 199n * 10n ** BigInt(token1.decimals);
    let poolDailyData = new PoolDailyDataMock();
    let currentFees = BigDecimal("12.3");
    let swapFee = 500;

    pool = {
      ...pool,
      currentFeeTier: swapFee,
      token0_id: token0Id,
      token1_id: token1Id,
    };

    poolDailyData = {
      ...poolDailyData,
      id: poolDailyDataId,
      feesToken0: currentFees,
      pool_id: pool.id,
      dayStartTimestamp: eventTimestamp,
    };

    token0 = {
      ...token0,
      id: token0Id,
    };

    token1 = {
      ...token1,
      id: token1Id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.PoolDailyData.set(poolDailyData);

    await handleV2PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      amount0In: amount0,
      amount0Out: 0n,
      amount1In: 0n,
      amount1Out: amount1,
      v2PoolSetters: poolSetters,
      eventTimestamp,
      updatedFeeTier: swapFee,
    });

    assert(
      poolSetters.setIntervalSwapData.calledWithMatch(
        eventTimestamp,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        amount0,
        -amount1
      )
    );
  });

  it(`when the user swaps token1 for token0, the token0 pooled usd amount should decrease
   by the amount swapped, as it is taken from the pool`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000012");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");
    let currentPooledTokenAmount = BigDecimal("321.7");
    let token0UsdPrice = BigDecimal("12.32");
    let currentToken0PooledUsdAmount = currentPooledTokenAmount.times(token0UsdPrice);

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);

    token0 = {
      ...token0,
      usdPrice: token0UsdPrice,
      totalValuePooledUsd: currentToken0PooledUsdAmount,
      totalTokenPooledAmount: currentPooledTokenAmount,
    };

    poolSetters.updateTokenPricesFromPoolPrices.resolves([token0, token1]);

    context.Token.set(token0);

    let amount0OutBigInt = BigInt(1765) * BigInt(10) ** BigInt(token0.decimals);
    let amount0InBigInt = BigInt(0);
    let amount1InBigInt = BigInt(12) * BigInt(10) ** BigInt(token1.decimals);
    let amount1OutBigInt = BigInt(0);

    await handleV2PoolSwap({
      context: context,
      amount0In: amount0InBigInt,
      amount0Out: amount0OutBigInt,
      amount1In: amount1InBigInt,
      amount1Out: amount1OutBigInt,
      eventTimestamp: eventTimestamp,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      v2PoolSetters: poolSetters,
    });

    const updatedToken0 = await context.Token.getOrThrow(token0.id);
    const expectedPooledAmountUSD = currentPooledTokenAmount
      .minus(formatFromTokenAmount(amount0OutBigInt, updatedToken0))
      .times(updatedToken0.usdPrice);

    assert.deepEqual(updatedToken0.totalValuePooledUsd, expectedPooledAmountUSD);
  });

  it(`when the user swaps token0 for token1, the token1 pooled usd amount should decrease
    by the amount swapped, as it is taken from the pool`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000012");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");
    let token1UsdPrice = BigDecimal("1200.32");
    let currentPooledTokenAmount = BigDecimal("321.7");
    let currentToken1PooledUsdAmount = currentPooledTokenAmount.times(token1UsdPrice);

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);

    token1 = {
      ...token1,
      usdPrice: token1UsdPrice,
      totalValuePooledUsd: currentToken1PooledUsdAmount,
      totalTokenPooledAmount: currentPooledTokenAmount,
    };

    context.Token.set(token0);
    context.Token.set(token1);

    poolSetters.updateTokenPricesFromPoolPrices.resolves([token0, token1]);

    let amount1OutBigInt = BigInt(3134) * BigInt(10) ** BigInt(token1.decimals);
    let amount0OutBigInt = BigInt(0);
    let amount0InBigInt = BigInt(12) * BigInt(10) ** BigInt(token1.decimals);
    let amount1InBigInt = BigInt(0);

    await handleV2PoolSwap({
      context: context,
      amount0In: amount0InBigInt,
      amount0Out: amount0OutBigInt,
      amount1In: amount1InBigInt,
      amount1Out: amount1OutBigInt,
      eventTimestamp: eventTimestamp,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      v2PoolSetters: poolSetters,
    });

    const updatedToken1 = await context.Token.getOrThrow(token1.id);

    assert.deepEqual(
      updatedToken1.totalValuePooledUsd,
      currentPooledTokenAmount
        .minus(formatFromTokenAmount(amount1OutBigInt, updatedToken1))
        .times(updatedToken1.usdPrice)
    );
  });

  it(`when the handler is called passing a custom fee tier,
    it should be applied to the pool in the 'currentFeeTier'
    variable. The 'initialFeeTier' should remain unchanged`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let amount1OutBigInt = BigInt(3134) * BigInt(10) ** BigInt(token1.decimals);
    let amount0OutBigInt = BigInt(0);
    let amount0InBigInt = BigInt(12) * BigInt(10) ** BigInt(token1.decimals);
    let amount1InBigInt = BigInt(0);
    let customFeeTier = 32567;

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolSwap({
      context: context,
      amount0In: amount0InBigInt,
      amount0Out: amount0OutBigInt,
      amount1In: amount1InBigInt,
      amount1Out: amount1OutBigInt,
      eventTimestamp: eventTimestamp,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: new TokenMock(),
      v2PoolSetters: poolSetters,
      updatedFeeTier: customFeeTier,
    });

    const updatedPool = await context.Pool.getOrThrow(pool.id);

    assert.deepEqual(updatedPool.currentFeeTier, customFeeTier, "custom fee tier should be applied");
    assert.deepEqual(updatedPool.initialFeeTier, pool.initialFeeTier, "initial fee tier should remain unchanged");
  });

  it(`should call the pool setters to update the token prices, after
    summing up or removing the token amounts from the pool based on
    the amounts swapped`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let amount1OutBigInt = BigInt(3134) * BigInt(10) ** BigInt(token1.decimals);
    let amount0OutBigInt = BigInt(0);
    let amount0InBigInt = BigInt(12) * BigInt(10) ** BigInt(token1.decimals);
    let amount1InBigInt = BigInt(0);
    let customFeeTier = 32567;
    const poolAmount0AfterSwap = pool.totalValueLockedToken0
      .plus(formatFromTokenAmount(amount0InBigInt, token1))
      .minus(formatFromTokenAmount(amount0OutBigInt, token0));

    const poolAmount1AfterSwap = pool.totalValueLockedToken1
      .plus(formatFromTokenAmount(amount1InBigInt, token0))
      .minus(formatFromTokenAmount(amount1OutBigInt, token1));

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolSwap({
      context: context,
      amount0In: amount0InBigInt,
      amount0Out: amount0OutBigInt,
      amount1In: amount1InBigInt,
      amount1Out: amount1OutBigInt,
      eventTimestamp: eventTimestamp,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: new TokenMock(),
      v2PoolSetters: poolSetters,
      updatedFeeTier: customFeeTier,
    });

    assert(
      poolSetters.updateTokenPricesFromPoolPrices.calledOnceWith(
        token0,
        token1,
        {
          ...pool,
          totalValueLockedToken0: poolAmount0AfterSwap,
          totalValueLockedToken1: poolAmount1AfterSwap,
        },
        poolReservesToPrice(poolAmount0AfterSwap, poolAmount1AfterSwap)
      )
    );
  });

  it(`should sum up the token0 swap volume in the pool if the amount0 is positive
    and amount1 is negative. The token1 swap volume should not change`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    // Set initial swap volumes
    pool = {
      ...pool,
      swapVolumeToken0: BigDecimal("100"),
      swapVolumeToken1: BigDecimal("200"),
      swapVolumeUSD: BigDecimal("0"),
    };

    // amount0 positive, amount1 negative
    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(-456) * 10n ** BigInt(token1.decimals);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      amount0In: amount0,
      amount0Out: 0n,
      amount1In: 0n,
      amount1Out: -amount1, // amount1Out is positive, so amount1 = 0 - amount1Out = negative
      v2PoolSetters: poolSetters,
      eventTimestamp,
    });

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;
    const expectedToken0SwapVolume = pool.swapVolumeToken0.plus(formatFromTokenAmount(amount0, token0));
    // token1 swap volume should not change
    assert.deepEqual(updatedPool.swapVolumeToken0, expectedToken0SwapVolume);
    assert.deepEqual(updatedPool.swapVolumeToken1, pool.swapVolumeToken1);
  });

  it(`should sum up the token1 swap volume in the pool if the amount1 is positive
    and amount0 is negative. The token0 swap volume should not change`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    pool = {
      ...pool,
      swapVolumeToken0: BigDecimal("100"),
      swapVolumeToken1: BigDecimal("200"),
      swapVolumeUSD: BigDecimal("0"),
    };

    // amount0 negative, amount1 positive
    const amount0 = BigInt(-123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      amount0In: 0n,
      amount0Out: -amount0, // amount0Out is positive, so amount0 = 0 - amount0Out = negative
      amount1In: amount1,
      amount1Out: 0n,
      v2PoolSetters: poolSetters,
      eventTimestamp,
    });

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;
    const expectedToken1SwapVolume = pool.swapVolumeToken1.plus(formatFromTokenAmount(amount1, token1));
    // token0 swap volume should not change
    assert.deepEqual(updatedPool.swapVolumeToken1, expectedToken1SwapVolume);
    assert.deepEqual(updatedPool.swapVolumeToken0, pool.swapVolumeToken0);
  });

  it(`should sum up the swap volume usd in the pool based on the amount1
    times the token1 usd price if the amount 1 is positive and amount 0 is negative`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    pool = {
      ...pool,
      swapVolumeUSD: BigDecimal("1000"),
    };

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    poolSetters.updateTokenPricesFromPoolPrices.resolves([
      { ...token0, usdPrice: BigDecimal("91919191") },
      { ...token1, usdPrice: BigDecimal("91818181") },
    ]);

    await handleV2PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      amount0In: 0n,
      amount0Out: amount0,
      amount1In: amount1,
      amount1Out: 0n,
      v2PoolSetters: poolSetters,
      eventTimestamp,
    });

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;
    const updatedToken1 = await context.Token.getOrThrow(token1.id)!;

    const expectedSwapVolumeUSD = pool.swapVolumeUSD.plus(
      formatFromTokenAmount(amount1, token1).times(updatedToken1.usdPrice)
    );
    assert.deepEqual(updatedPool.swapVolumeUSD, expectedSwapVolumeUSD);
  });

  it(`should sum up the swap volume usd in the pool based on the amount0
    times the token0 usd price if the amount 0 is positive and amount 1 is negative`, async () => {
    let token0 = new TokenMock("0x01");
    let token1 = new TokenMock("0x02");
    let pool = new PoolMock();

    pool = {
      ...pool,
      swapVolumeUSD: BigDecimal("1000"),
    };

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    poolSetters.updateTokenPricesFromPoolPrices.resolves([
      { ...token0, usdPrice: BigDecimal("1200") },
      { ...token1, usdPrice: BigDecimal("1300") },
    ]);

    await handleV2PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      amount0In: amount0,
      amount0Out: 0n,
      amount1In: 0n,
      amount1Out: amount1,
      v2PoolSetters: poolSetters,
      eventTimestamp,
    });

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;
    const updatedToken0 = await context.Token.getOrThrow(token0.id)!;

    const expectedSwapVolumeUSD = pool.swapVolumeUSD.plus(
      formatFromTokenAmount(amount0, token0).times(updatedToken0.usdPrice)
    );

    assert.deepEqual(updatedPool.swapVolumeUSD, expectedSwapVolumeUSD);
  });

  it(`should sum up the token 0 token swap volume by the amount 0
    if the amount0 is positive and amount1 is negative`, async () => {
    let token0 = new TokenMock("0x01");
    let token1 = new TokenMock("0x02");
    token0.tokenSwapVolume = BigDecimal("1000");
    token1.tokenSwapVolume = BigDecimal("2000");

    let pool = new PoolMock();
    pool.token0_id = token0.id;
    pool.token1_id = token1.id;

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    poolSetters.updateTokenPricesFromPoolPrices.resolves([
      { ...token0, usdPrice: BigDecimal("1200") },
      { ...token1, usdPrice: BigDecimal("1300") },
    ]);

    await handleV2PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      amount0In: amount0,
      amount0Out: 0n,
      amount1In: 0n,
      amount1Out: amount1,
      v2PoolSetters: poolSetters,
      eventTimestamp,
    });

    const updatedToken0 = await context.Token.getOrThrow(token0.id)!;

    assert.deepEqual(
      updatedToken0.tokenSwapVolume,
      token0.tokenSwapVolume.plus(formatFromTokenAmount(amount0, token0))
    );
  });

  it(`should sum up the token 1 token swap volume by the amount 1
      if the amount1 is positive and amount0 is negative`, async () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    token0.tokenSwapVolume = BigDecimal("1000");
    token1.tokenSwapVolume = BigDecimal("2000");

    let pool = new PoolMock();
    pool.token0_id = token0.id;
    pool.token1_id = token1.id;

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    poolSetters.updateTokenPricesFromPoolPrices.resolves([
      { ...token0, usdPrice: BigDecimal("1200") },
      { ...token1, usdPrice: BigDecimal("1300") },
    ]);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      amount0In: 0n,
      amount0Out: amount0,
      amount1In: amount1,
      amount1Out: 0n,
      v2PoolSetters: poolSetters,
      eventTimestamp,
    });

    const updatedToken1 = await context.Token.getOrThrow(token1.id)!;

    assert.deepEqual(
      updatedToken1.tokenSwapVolume,
      token1.tokenSwapVolume.plus(formatFromTokenAmount(amount1, token1))
    );
  });

  it(`should sum up the token 0 swap volume usd by the amount 0
    times the token0 usd price if the amount0 is positive and amount1 is negative`, async () => {
    let token0 = new TokenMock("0x01");
    let token1 = new TokenMock("0x02");
    token0.swapVolumeUSD = BigDecimal("1000");
    token1.swapVolumeUSD = BigDecimal("2000");

    let pool = new PoolMock();
    pool.token0_id = token0.id;
    pool.token1_id = token1.id;

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    poolSetters.updateTokenPricesFromPoolPrices.resolves([
      { ...token0, usdPrice: BigDecimal("1200") },
      { ...token1, usdPrice: BigDecimal("1300") },
    ]);

    await handleV2PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      amount0In: amount0,
      amount0Out: 0n,
      amount1In: 0n,
      amount1Out: amount1,
      v2PoolSetters: poolSetters,
      eventTimestamp,
    });

    const updatedToken0 = await context.Token.getOrThrow(token0.id)!;

    assert.deepEqual(
      updatedToken0.swapVolumeUSD,
      token0.swapVolumeUSD.plus(formatFromTokenAmount(amount0, token0).times(updatedToken0.usdPrice))
    );
  });

  it(`should sum up the token 1 swap volume usd by the amount 1
    times the token1 usd price if the amount1 is positive and amount0 is negative`, async () => {
    let token0 = new TokenMock("0x01");
    let token1 = new TokenMock("0x02");
    token0.swapVolumeUSD = BigDecimal("1000");
    token1.swapVolumeUSD = BigDecimal("2000");

    let pool = new PoolMock();
    pool.token0_id = token0.id;
    pool.token1_id = token1.id;

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    poolSetters.updateTokenPricesFromPoolPrices.resolves([
      { ...token0, usdPrice: BigDecimal("1200") },
      { ...token1, usdPrice: BigDecimal("1300") },
    ]);

    await handleV2PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      amount0In: 0n,
      amount0Out: amount0,
      amount1In: amount1,
      amount1Out: 0n,
      v2PoolSetters: poolSetters,
      eventTimestamp,
    });

    const updatedToken1 = await context.Token.getOrThrow(token1.id)!;

    assert.deepEqual(
      updatedToken1.swapVolumeUSD,
      token1.swapVolumeUSD.plus(formatFromTokenAmount(amount1, token1).times(updatedToken1.usdPrice))
    );
  });

  it("should sum the single swap yield to the accumulated yields in the pool entity", async () => {
    let token0 = new TokenMock("0x01");
    let token1 = new TokenMock("0x02");

    let pool = new PoolMock();
    pool.token0_id = token0.id;
    pool.token1_id = token1.id;

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    poolSetters.updateTokenPricesFromPoolPrices.resolves([
      { ...token0, usdPrice: BigDecimal("1200") },
      { ...token1, usdPrice: BigDecimal("1300") },
    ]);

    await handleV2PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      amount0In: 0n,
      amount0Out: amount0,
      amount1In: amount1,
      amount1Out: 0n,
      v2PoolSetters: poolSetters,
      eventTimestamp,
    });

    const updatedPool = await context.Pool.getOrThrow(pool.id);
    const updatedToken0 = await context.Token.getOrThrow(token0.id);
    const updatedToken1 = await context.Token.getOrThrow(token1.id);

    const swapFees = getSwapFeesFromRawAmounts(-amount0, amount1, pool.currentFeeTier, updatedToken0, updatedToken1);
    const swapYield = swapFees.feesUSD.div(updatedPool.totalValueLockedUSD).times(100);

    assert.deepEqual(
      updatedPool.accumulated24hYield,
      pool.accumulated24hYield.plus(swapYield),
      "accumulated 24h yield should be updated correctly"
    );

    assert.deepEqual(
      updatedPool.accumulated7dYield,
      pool.accumulated7dYield.plus(swapYield),
      "accumulated 7d yield should be updated correctly"
    );

    assert.deepEqual(
      updatedPool.accumulated30dYield,
      pool.accumulated30dYield.plus(swapYield),
      "accumulated 30d yield should be updated correctly"
    );

    assert.deepEqual(
      updatedPool.accumulated90dYield,
      pool.accumulated90dYield.plus(swapYield),
      "accumulated 90d yield should be updated correctly"
    );

    assert.deepEqual(
      updatedPool.totalAccumulatedYield,
      pool.totalAccumulatedYield.plus(swapYield),
      "total accumulated yield should be updated correctly"
    );
  });

  it("should update the pool entity with the result from 'updatePoolAccumulatedYield'", async () => {
    const token0: Token = {
      ...new TokenMock(),
    };

    const token1: Token = {
      ...new TokenMock(),
    };

    const pool: Pool = {
      ...new PoolMock(),
    };

    const resultPool: Pool = {
      ...pool,
      accumulated24hYield: BigDecimal("212121"),
      accumulated7dYield: BigDecimal("555555"),
      accumulated90dYield: BigDecimal("333333"),
      accumulated30dYield: BigDecimal("8181818"),
      totalAccumulatedYield: BigDecimal("9999999"),
      dataPointTimestamp24h: 0x10n,
      dataPointTimestamp7d: 0x20n,
      dataPointTimestamp30d: 0x30n,
      dataPointTimestamp90d: 0x40n,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    poolSetters.updatePoolAccumulatedYield.reset();
    poolSetters.updatePoolAccumulatedYield.resolves(resultPool);

    await handleV2PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      amount0In: 0n,
      amount0Out: 0n,
      amount1In: 0n,
      amount1Out: 0n,
      v2PoolSetters: poolSetters,
      eventTimestamp,
    });

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;
    assert.deepEqual(updatedPool, resultPool, "The pool should be updated with the accumulated yield data");
  });
});
