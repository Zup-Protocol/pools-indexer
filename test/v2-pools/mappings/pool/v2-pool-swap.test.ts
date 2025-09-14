import assert from "assert";
import { BigDecimal, HandlerContext } from "generated";
import sinon from "sinon";
import { getPoolDailyDataId, getPoolHourlyDataId } from "../../../../src/common/pool-commons";
import { PoolSetters } from "../../../../src/common/pool-setters";
import { formatFromTokenAmount } from "../../../../src/common/token-commons";
import { poolReservesToPrice } from "../../../../src/v2-pools/common/v2-pool-converters";
import { handleV2PoolSwap } from "../../../../src/v2-pools/mappings/pool/v2-pool-swap";
import {
  HandlerContextCustomMock,
  PoolDailyDataMock,
  PoolHourlyDataMock,
  PoolMock,
  TokenMock,
  V2PoolDataMock,
} from "../../../mocks";

describe("V2PoolSwapHandler", () => {
  let context: HandlerContext;
  let eventTimestamp = BigInt(Date.now());
  let poolSetters: sinon.SinonStubbedInstance<PoolSetters>;

  beforeEach(() => {
    context = HandlerContextCustomMock();
    poolSetters = sinon.createStubInstance(PoolSetters);

    poolSetters.getPricesForPoolWhitelistedTokens.returns({
      token0UpdatedPrice: BigDecimal("1200"),
      token1UpdatedPrice: BigDecimal("1300"),
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it(`The handler should assign the correct usd prices got from 'getPricesForPoolWhitelistedTokens' to the tokens`, async () => {
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

    poolSetters.getPricesForPoolWhitelistedTokens.returns({
      token0UpdatedPrice: token0ExpectedUsdPrice,
      token1UpdatedPrice: token1ExpectedUsdPrice,
    });

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

  it(`The handler should call 'getPricesForPoolWhitelistedTokens' in the pool setters with the corrent parameters`, async () => {
    const token0Id = "toko-cero";
    const token1Id = "toko-uno";
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    const token0ExpectedUsdPrice = BigDecimal("9836276.3222");
    const token1ExpectedUsdPrice = BigDecimal("0.91728716782");
    const amount0 = BigInt(100);
    const amount1 = BigInt(200);

    let poolPrices = poolReservesToPrice(
      formatFromTokenAmount(amount0, token0).plus(pool.totalValueLockedToken0),
      formatFromTokenAmount(amount1, token1).plus(pool.totalValueLockedToken1)
    );

    poolSetters.getPricesForPoolWhitelistedTokens.returns({
      token0UpdatedPrice: token0ExpectedUsdPrice,
      token1UpdatedPrice: token1ExpectedUsdPrice,
    });

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

    assert(poolSetters.getPricesForPoolWhitelistedTokens.calledWith(token0, token1, poolPrices));
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
      poolSetters.setHourlyData.calledWithMatch(
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
      poolSetters.setDailyData.calledWithMatch(
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
});
