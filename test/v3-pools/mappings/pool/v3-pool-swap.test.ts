import assert from "assert";
import { BigDecimal, handlerContext, Pool, Token } from "generated";
import sinon from "sinon";
import { sqrtPriceX96toPrice } from "../../../../src/common/cl-pool-converters";
import {
  getPoolDailyDataId,
  getPoolHourlyDataId,
  getSwapFeesFromRawAmounts,
} from "../../../../src/common/pool-commons";
import { PoolSetters } from "../../../../src/common/pool-setters";
import { formatFromTokenAmount } from "../../../../src/common/token-commons";
import { handleV3PoolSwap } from "../../../../src/v3-pools/mappings/pool/v3-pool-swap";
import {
  handlerContextCustomMock,
  PoolDailyDataMock,
  PoolHourlyDataMock,
  PoolMock,
  TokenMock,
  V3PoolDataMock,
} from "../../../mocks";

describe("V3PoolSwapHandler", () => {
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

  it(`The handler should assign the correct usd prices got from 'getPricesForPoolWhitelistedTokens' to the tokens`, async () => {
    const token0Id = "toko-cero";
    const token1Id = "toko-uno";
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    const sqrtPriceX96 = BigInt(3432);
    const token0ExpectedUsdPrice = BigDecimal("9836276.3222");
    const token1ExpectedUsdPrice = BigDecimal("0.91728716782");
    const tick = BigInt(989756545);
    const amount0 = BigInt(100);
    const amount1 = BigInt(200);
    let v3PoolData = new V3PoolDataMock();

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
      {
        ...token0,
        usdPrice: token0ExpectedUsdPrice,
      },
      {
        ...token1,
        usdPrice: token1ExpectedUsdPrice,
      },
    ]);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V3PoolData.set(v3PoolData);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3PoolData,
    });

    const token0After = await context.Token.getOrThrow(token0Id);
    const token1After = await context.Token.getOrThrow(token1Id);

    assert.equal(token0After.usdPrice.toString(), token0ExpectedUsdPrice.toString(), "Token0 usd price is not correct");
    assert.equal(token1After.usdPrice.toString(), token1ExpectedUsdPrice.toString(), "Token1 usd price is not correct");
  });

  it(`The handler should call 'getPricesForPoolWhitelistedTokens' in the pool setters with the corrent parameters`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let v3PoolData = new V3PoolDataMock();

    const token0Id = "toko-cero";
    const token1Id = "toko-uno";
    const sqrtPriceX96 = BigInt(3432);
    const poolPrices = sqrtPriceX96toPrice(sqrtPriceX96, token0, token1);
    const token0ExpectedUsdPrice = BigDecimal("9836276.3222");
    const token1ExpectedUsdPrice = BigDecimal("0.91728716782");
    const tick = BigInt(989756545);
    const amount0 = BigInt(100);
    const amount1 = BigInt(200);

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
      {
        ...token0,
        usdPrice: token0ExpectedUsdPrice,
      },
      {
        ...token1,
        usdPrice: token1ExpectedUsdPrice,
      },
    ]);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V3PoolData.set(v3PoolData);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3PoolData,
    });

    assert(
      poolSetters.updateTokenPricesFromPoolPrices.calledWith(
        token0,
        token1,
        {
          ...pool,
          totalValueLockedToken0: pool.totalValueLockedToken0.plus(formatFromTokenAmount(amount0, token0)),
          totalValueLockedToken1: pool.totalValueLockedToken1.plus(formatFromTokenAmount(amount1, token1)),
        },
        poolPrices
      )
    );
  });

  it(`When the handler is called, and the token0 amount is a positive number,
      it should increase pool token0 tvl by the amount passed in the event`, async () => {
    let token0Id = "0x0000000000000000000000000000000000000002";
    let token1Id = "0x0000000000000000000000000000000000000003";
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    let poolToken0TVLBefore = BigDecimal("325672.43");
    let amount0 = BigInt(200) * BigInt(10) ** BigInt(token0.decimals);
    let amount1 = BigInt(0);
    let sqrtPriceX96 = BigInt(3432);
    let tick = BigInt(989756545);
    let v3PoolData = new V3PoolDataMock();

    pool = {
      ...pool,
      token0_id: token0Id,
      totalValueLockedToken0: poolToken0TVLBefore,
    };

    token0 = {
      ...token0,
      id: token0Id,
    };

    token1 = {
      ...token1,
      id: token1Id,
    };

    v3PoolData = {
      ...v3PoolData,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V3PoolData.set(v3PoolData);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3PoolData,
    });

    const poolAfter = await context.Pool.getOrThrow(pool.id);

    assert.equal(
      poolAfter.totalValueLockedToken0.toString(),
      poolToken0TVLBefore.plus(formatFromTokenAmount(amount0, token0)).toString()
    );
  });

  it(`When the handler is called, and the token0 amount is a negative number,
      it should decrease pool token0 tvl by the amount passed in the event`, async () => {
    let token0Id = "0x0000000000000000000000000000000000000002";
    let token1Id = "0x0000000000000000000000000000000000000003";
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    let poolToken0TVLBefore = BigDecimal("325672.43");
    let amount0 = BigInt(200) * BigInt(10) ** BigInt(token0.decimals) * BigInt(-1);
    let amount1 = BigInt(0);
    let sqrtPriceX96 = BigInt(3432);
    let tick = BigInt(989756545);
    let v3PoolData = new V3PoolDataMock();

    pool = {
      ...pool,
      token0_id: token0Id,
      totalValueLockedToken0: poolToken0TVLBefore,
    };

    token0 = {
      ...token0,
      id: token0Id,
    };

    token1 = {
      ...token1,
      id: token1Id,
    };

    v3PoolData = {
      ...v3PoolData,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V3PoolData.set(v3PoolData);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3PoolData,
    });

    const poolAfter = await context.Pool.getOrThrow(pool.id);

    assert.equal(
      poolAfter.totalValueLockedToken0.toString(),
      poolToken0TVLBefore.plus(formatFromTokenAmount(amount0, token0)).toString() // using plus because the value is negative, so plus a negative is minus
    );
  });

  it(`When the handler is called, and the token1 amount is a positive number,
      it should increase pool token1 tvl by the amount passed in the event`, async () => {
    let token0Id = "0x0000000000000000000000000000000000000002";
    let token1Id = "0x0000000000000000000000000000000000000003";
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    let poolToken1TVLBefore = BigDecimal("325672.43");
    let amount0 = BigInt(0);
    let amount1 = BigInt(200) * BigInt(10) ** BigInt(token1.decimals);
    let sqrtPriceX96 = BigInt(3432);
    let tick = BigInt(989756545);
    let v3PoolData = new V3PoolDataMock();

    pool = {
      ...pool,
      token1_id: token1Id,
      totalValueLockedToken1: poolToken1TVLBefore,
    };

    token0 = {
      ...token0,
      id: token0Id,
    };

    token1 = {
      ...token1,
      id: token1Id,
    };

    v3PoolData = {
      ...v3PoolData,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V3PoolData.set(v3PoolData);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3PoolData,
    });

    const poolAfter = await context.Pool.getOrThrow(pool.id);

    assert.equal(
      poolAfter.totalValueLockedToken1.toString(),
      poolToken1TVLBefore.plus(formatFromTokenAmount(amount1, token1)).toString()
    );
  });

  it(`When the handler is called, and the token1 amount is a negative number,
      it should decrease pool token1 tvl by the amount passed in the event`, async () => {
    let token0Id = "0x0000000000000000000000000000000000000002";
    let token1Id = "0x0000000000000000000000000000000000000003";
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    let poolToken1TVLBefore = BigDecimal("325672.43");
    let amount0 = BigInt(0);
    let amount1 = BigInt(6526) * BigInt(10) ** BigInt(token1.decimals);
    let sqrtPriceX96 = BigInt(3432);
    let tick = BigInt(989756545);
    let swapFee = 500;
    let v3PoolData = new V3PoolDataMock();

    pool = {
      ...pool,
      token1_id: token1Id,
      totalValueLockedToken1: poolToken1TVLBefore,
    };

    token0 = {
      ...token0,
      id: token0Id,
    };

    token1 = {
      ...token1,
      id: token1Id,
    };

    v3PoolData = {
      ...v3PoolData,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V3PoolData.set(v3PoolData);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3PoolData,
    });

    const poolAfter = await context.Pool.getOrThrow(pool.id);

    assert.equal(
      poolAfter.totalValueLockedToken1.toString(),
      poolToken1TVLBefore.plus(formatFromTokenAmount(amount1, token1)).toString() // using plus because the value is negative, so plus a negative is minus
    );
  });

  it(`When the handler is called, it should update the pool usd tvl based on the new token0 and token1 amounts and prices`, async () => {
    let token0Id = "0x0000000000000000000000000000000000000012";
    let token1Id = "0x0000000000000000000000000000000000000002";
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let v3PoolData = new V3PoolDataMock();
    let poolToken0TVLBefore = BigDecimal("91821.43");
    let poolToken1TVLBefore = BigDecimal("121320.43");
    let amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    let amount1 = BigInt(87532) * 10n ** BigInt(token1.decimals);
    let sqrtPriceX96 = BigInt(3432);
    let tick = BigInt(989756545);
    let token0Price = BigDecimal("3278");
    let token1Price = BigDecimal("91");

    token0 = {
      ...token0,
      id: token0Id,
      usdPrice: token0Price,
    };

    token1 = {
      ...token1,
      id: token1Id,
      usdPrice: token1Price,
    };

    poolSetters.updateTokenPricesFromPoolPrices.resolves([token0, token1]);

    pool = {
      ...pool,
      token0_id: token0Id,
      token1_id: token1Id,
      totalValueLockedToken0: poolToken0TVLBefore,
      totalValueLockedToken1: poolToken1TVLBefore,
    };

    v3PoolData = {
      ...v3PoolData,
      id: pool.id,
    };

    context.V3PoolData.set(v3PoolData);
    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3PoolData,
    });

    let poolAfter = await context.Pool.getOrThrow(pool.id);

    assert.equal(
      poolAfter.totalValueLockedUSD.toString(),
      poolToken0TVLBefore
        .plus(formatFromTokenAmount(amount0, token0))
        .times(token0Price)
        .plus(poolToken1TVLBefore.plus(formatFromTokenAmount(amount1, token1)).times(token1Price))
        .toString()
    );
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
    let amount1 = 199n * 10n ** BigInt(token1.decimals) * -1n; // by making this negative, we can simulate a swap of token0 by token1, as token1 have benn removed from the pool
    let sqrtPriceX96 = BigInt(3432);
    let v3PoolData = new V3PoolDataMock();
    let poolHourlyData = new PoolHourlyDataMock();
    let currentFees = BigDecimal("12.3");
    let swapFee = 500;
    let tick = BigInt(989756545);

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
    context.PoolHourlyData.set(poolHourlyData);
    context.V3PoolData.set(v3PoolData);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3PoolData,
    });

    assert(
      poolSetters.setIntervalSwapData.calledWithMatch(
        eventTimestamp,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        amount0,
        amount1
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
    let sqrtPriceX96 = BigInt(3432);
    let amount0 = 32n * 10n ** BigInt(token0.decimals);
    let amount1 = 199n * 10n ** BigInt(token1.decimals) * -1n; // by making this negative, we can simulate a swap of token0 by token1, as token1 have benn removed from the pool
    let poolDailyData = new PoolDailyDataMock();
    let currentFees = BigDecimal("12.3");
    let swapFee = 500;
    let tick = BigInt(989756545);

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

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: new V3PoolDataMock(),
    });

    assert(
      poolSetters.setIntervalSwapData.calledWithMatch(
        eventTimestamp,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        amount0,
        amount1
      )
    );
  });

  it(`When the user swaps token0 for token1, the token1 pooled usd amount should decrease
      by the amount swapped, as it is taken from the pool`, async () => {
    let token0Id = "0x0000000000000000000000000000000000000012";
    let token1Id = "0x0000000000000000000000000000000000000002";
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let v3PoolData = new V3PoolDataMock();
    let token1UsdPrice = BigDecimal("1200.32");
    let currentPooledTokenAmount = BigDecimal("321.7");
    let currentToken1PooledUsdAmount = currentPooledTokenAmount.times(token1UsdPrice);
    let amount1BigInt = BigInt(3134) * BigInt(10) ** BigInt(token1.decimals) * -1n;
    let amount0BigInt = BigInt(12) * BigInt(10) ** BigInt(token0.decimals);
    let sqrtPriceX96 = BigInt(100) * BigInt(10n ** 96n);
    let tick = BigInt(989756545);

    pool = {
      ...pool,
      token0_id: token0Id,
      token1_id: token1Id,
    };

    token0 = {
      ...token0,
      id: token0Id,
    };

    token1 = {
      ...token1,
      id: token1Id,
      usdPrice: token1UsdPrice,
      totalValuePooledUsd: currentToken1PooledUsdAmount,
      totalTokenPooledAmount: currentPooledTokenAmount,
    };

    v3PoolData = {
      ...v3PoolData,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V3PoolData.set(v3PoolData);

    poolSetters.updateTokenPricesFromPoolPrices.resolves([token0, token1]);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0BigInt,
      swapAmount1: amount1BigInt,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3PoolData,
    });

    const updatedToken1 = await context.Token.getOrThrow(token1.id);

    const expectedNewToken1AmountUsd = currentPooledTokenAmount
      .plus(formatFromTokenAmount(amount1BigInt, token1)) // using plus because the value is negative, so plus a negative is minus
      .times(updatedToken1.usdPrice);

    assert.deepEqual(updatedToken1.totalValuePooledUsd, expectedNewToken1AmountUsd);
  });

  it(`when the user swaps token1 for token0, the token0 pooled usd amount should decrease
     by the amount swapped, as it is taken from the pool`, async () => {
    let token0Id = "0x0000000000000000000000000000000000000012";
    let token1Id = "0x0000000000000000000000000000000000000002";
    let pool = new PoolMock();
    let v3Pool = new V3PoolDataMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let currentPooledTokenAmount = BigDecimal("321.7");
    let token0UsdPrice = BigDecimal("12.32");
    let currentToken0PooledUsdAmount = currentPooledTokenAmount.times(token0UsdPrice);

    pool = {
      ...pool,
      token0_id: token0Id,
      token1_id: token1Id,
    };

    v3Pool = {
      ...v3Pool,
      id: pool.id,
      sqrtPriceX96: BigInt("3955354761159110023762541"),
      tick: BigInt("-198111"),
    };

    token0 = {
      ...token0,
      id: token0Id,
      usdPrice: token0UsdPrice,
      totalValuePooledUsd: currentToken0PooledUsdAmount,
      totalTokenPooledAmount: currentPooledTokenAmount,
    };

    token1 = {
      ...token1,
      id: token1Id,
    };

    poolSetters.updateTokenPricesFromPoolPrices.resolves([token0, token1]);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V3PoolData.set(v3Pool);

    let amount0BigInt = BigInt(1765) * BigInt(10) ** BigInt(token0.decimals) * -1n;
    let amount1BigInt = BigInt(12) * BigInt(10) ** BigInt(token1.decimals);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0BigInt,
      swapAmount1: amount1BigInt,
      sqrtPriceX96: v3Pool.sqrtPriceX96,
      tick: v3Pool.tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3Pool,
    });

    const updatedToken0 = await context.Token.getOrThrow(token0.id);
    const expectedNewToken0AmountUsd = currentPooledTokenAmount
      .plus(formatFromTokenAmount(amount0BigInt, token0)) // using plus because the value is negative, so plus a negative is minus
      .times(updatedToken0.usdPrice);

    assert.deepEqual(updatedToken0.totalValuePooledUsd, expectedNewToken0AmountUsd);
  });

  it("When the handler is called, it should assign the sqrtPriceX96 to the pool", async () => {
    let pool = new PoolMock();
    let v3Pool = new V3PoolDataMock();
    let sqrtPriceX96 = BigInt(23456111);
    let tick = BigInt(989756545);
    let amount0 = BigInt(100);
    let amount1 = BigInt(200);

    v3Pool = {
      ...v3Pool,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.V3PoolData.set(v3Pool);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: new TokenMock(),
      token1Entity: new TokenMock(),
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3Pool,
    });

    let updatedV3Pool = await context.V3PoolData.getOrThrow(v3Pool.id);

    assert.equal(updatedV3Pool.sqrtPriceX96, sqrtPriceX96);
  });

  it("When the handler is called, it should assign the tick to the pool", async () => {
    let pool = new PoolMock();
    let v3Pool = new V3PoolDataMock();
    let sqrtPriceX96 = BigInt(23456111);
    let tick = BigInt(989756545);
    let amount0 = BigInt(100);
    let amount1 = BigInt(200);
    let swapFee = 500;

    v3Pool = {
      ...v3Pool,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.V3PoolData.set(v3Pool);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: new TokenMock(),
      token1Entity: new TokenMock(),
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3Pool,
    });

    let updatedV3Pool = await context.V3PoolData.getOrThrow(v3Pool.id);
    assert.equal(updatedV3Pool.tick, tick);
  });

  it("should sum up the token0 swap volume in the pool if the amount0 is positive and amount1 is negative. The token1 swap volume should not change", async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let v3PoolData = new V3PoolDataMock();

    const initialSwapVolumeToken0 = pool.swapVolumeToken0;
    const initialSwapVolumeToken1 = pool.swapVolumeToken1;
    const amount0 = BigInt(100) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(-50) * 10n ** BigInt(token1.decimals);
    const sqrtPriceX96 = BigInt(3432);
    const tick = BigInt(989756545);

    pool = {
      ...pool,
      swapVolumeToken0: initialSwapVolumeToken0,
      swapVolumeToken1: initialSwapVolumeToken1,
    };

    v3PoolData = {
      ...v3PoolData,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V3PoolData.set(v3PoolData);

    poolSetters.updateTokenPricesFromPoolPrices.resolves([token0, token1]);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3PoolData,
    });

    const poolAfter = await context.Pool.getOrThrow(pool.id);

    const expectedToken0Volume = initialSwapVolumeToken0.plus(formatFromTokenAmount(amount0, token0));
    assert.equal(poolAfter.swapVolumeToken0.toString(), expectedToken0Volume.toString());
    assert.equal(poolAfter.swapVolumeToken1.toString(), initialSwapVolumeToken1.toString());
  });

  it("should sum up the token1 swap volume in the pool if the amount1 is positive and amount0 is negative. The token0 swap volume should not change", async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let v3PoolData = new V3PoolDataMock();

    const initialSwapVolumeToken0 = pool.swapVolumeToken0;
    const initialSwapVolumeToken1 = pool.swapVolumeToken1;
    const amount0 = BigInt(-100) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(50) * 10n ** BigInt(token1.decimals);
    const sqrtPriceX96 = BigInt(3432);
    const tick = BigInt(989756545);

    pool = {
      ...pool,
      swapVolumeToken0: initialSwapVolumeToken0,
      swapVolumeToken1: initialSwapVolumeToken1,
    };

    v3PoolData = {
      ...v3PoolData,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V3PoolData.set(v3PoolData);

    poolSetters.updateTokenPricesFromPoolPrices.resolves([token0, token1]);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3PoolData,
    });

    const poolAfter = await context.Pool.getOrThrow(pool.id);

    const expectedToken1Volume = initialSwapVolumeToken1.plus(formatFromTokenAmount(amount1, token1));
    assert.equal(poolAfter.swapVolumeToken1.toString(), expectedToken1Volume.toString());
    assert.equal(poolAfter.swapVolumeToken0.toString(), initialSwapVolumeToken0.toString());
  });

  it("should sum up the swap volume usd in the pool based on the amount1 times the token1 usd price if the amount1 is positive and amount0 is negative", async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let v3PoolData = new V3PoolDataMock();

    const initialSwapVolumeUSD = pool.swapVolumeUSD;
    const amount0 = BigInt(-100) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(50) * 10n ** BigInt(token1.decimals);
    token1.usdPrice = BigDecimal("2.5");
    const sqrtPriceX96 = BigInt(3432);
    const tick = BigInt(989756545);

    v3PoolData = {
      ...v3PoolData,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V3PoolData.set(v3PoolData);

    poolSetters.updateTokenPricesFromPoolPrices.resolves([token0, token1]);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3PoolData,
    });

    const poolAfter = await context.Pool.getOrThrow(pool.id);

    const expectedVolumeUSD = initialSwapVolumeUSD.plus(formatFromTokenAmount(amount1, token1).times(token1.usdPrice));
    assert.equal(poolAfter.swapVolumeUSD.toString(), expectedVolumeUSD.toString());
  });

  it("should sum up the swap volume usd in the pool based on the amount0 times the token0 usd price if the amount0 is positive and amount1 is negative", async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let v3PoolData = new V3PoolDataMock();

    const initialSwapVolumeUSD = pool.swapVolumeUSD;
    const amount0 = BigInt(100) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(-50) * 10n ** BigInt(token1.decimals);
    token0.usdPrice = BigDecimal("3.7");
    const sqrtPriceX96 = BigInt(3432);
    const tick = BigInt(989756545);

    v3PoolData = {
      ...v3PoolData,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V3PoolData.set(v3PoolData);

    poolSetters.updateTokenPricesFromPoolPrices.resolves([token0, token1]);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3PoolData,
    });

    const poolAfter = await context.Pool.getOrThrow(pool.id);

    const expectedVolumeUSD = initialSwapVolumeUSD.plus(formatFromTokenAmount(amount0, token0).times(token0.usdPrice));
    assert.equal(poolAfter.swapVolumeUSD.toString(), expectedVolumeUSD.toString());
  });

  it("should sum up the token 0 token swap volume by the amount 0 if the amount0 is positive and amount1 is negative", async () => {
    let token0 = new TokenMock("0x1");
    token0.tokenSwapVolume = BigDecimal("9271902710");
    let token1 = new TokenMock("0x2");
    let pool = new PoolMock();
    let v3PoolData = new V3PoolDataMock();

    const initialToken0SwapVolume = token0.tokenSwapVolume;
    const amount0 = BigInt(100) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(50) * 10n ** BigInt(token1.decimals) * -1n;
    const sqrtPriceX96 = BigInt(3432);
    const tick = BigInt(989756545);

    v3PoolData = {
      ...v3PoolData,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V3PoolData.set(v3PoolData);

    poolSetters.updateTokenPricesFromPoolPrices.resolves([token0, token1]);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3PoolData,
    });

    const token0After = await context.Token.getOrThrow(token0.id);

    const expectedToken0SwapVolume = initialToken0SwapVolume.plus(formatFromTokenAmount(amount0, token0));
    assert.equal(token0After.tokenSwapVolume.toString(), expectedToken0SwapVolume.toString());
  });

  it("should sum up the token 1 token swap volume by the amount 1 if the amount1 is positive and amount0 is negative", async () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    token1.tokenSwapVolume = BigDecimal("11111");
    let pool = new PoolMock();
    let v3PoolData = new V3PoolDataMock();

    const initialToken1SwapVolume = token1.tokenSwapVolume;
    const amount0 = BigInt(-100) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(50) * 10n ** BigInt(token1.decimals);
    const sqrtPriceX96 = BigInt(3432);
    const tick = BigInt(989756545);

    v3PoolData = {
      ...v3PoolData,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V3PoolData.set(v3PoolData);

    poolSetters.updateTokenPricesFromPoolPrices.resolves([token0, token1]);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3PoolData,
    });

    const token1After = await context.Token.getOrThrow(token1.id);

    const expectedToken1SwapVolume = initialToken1SwapVolume.plus(formatFromTokenAmount(amount1, token1));
    assert.equal(token1After.tokenSwapVolume.toString(), expectedToken1SwapVolume.toString());
  });

  it("should sum up the token 0 swap volume usd by the amount 0 times the token0 usd price if the amount0 is positive and amount1 is negative", async () => {
    let token0 = new TokenMock("0x1");
    token0.totalTokenPooledAmount = BigDecimal("2162917092");

    let token1 = new TokenMock("0x2");
    let pool = new PoolMock();
    let v3PoolData = new V3PoolDataMock();

    const initialToken0SwapVolumeUSD = token0.swapVolumeUSD;
    const amount0 = BigInt(100) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(-50) * 10n ** BigInt(token1.decimals);
    token0.usdPrice = BigDecimal("3.7");
    const sqrtPriceX96 = BigInt(3432);
    const tick = BigInt(989756545);

    v3PoolData = {
      ...v3PoolData,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V3PoolData.set(v3PoolData);

    poolSetters.updateTokenPricesFromPoolPrices.resolves([token0, token1]);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3PoolData,
    });

    const token0After = await context.Token.getOrThrow(token0.id);

    const expectedToken0SwapVolumeUSD = initialToken0SwapVolumeUSD.plus(
      formatFromTokenAmount(amount0, token0).times(token0.usdPrice)
    );
    assert.equal(token0After.swapVolumeUSD.toString(), expectedToken0SwapVolumeUSD.toString());
  });

  it("should sum up the token 1 swap volume usd by the amount 1 times the token1 usd price if the amount1 is positive and amount0 is negative", async () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    token1.tokenSwapVolume = BigDecimal("88911");
    let pool = new PoolMock();
    let v3PoolData = new V3PoolDataMock();

    const initialToken1SwapVolumeUSD = token1.swapVolumeUSD;
    const amount0 = BigInt(-100) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(50) * 10n ** BigInt(token1.decimals);
    token1.usdPrice = BigDecimal("2.5");
    const sqrtPriceX96 = BigInt(3432);
    const tick = BigInt(989756545);

    v3PoolData = {
      ...v3PoolData,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V3PoolData.set(v3PoolData);

    poolSetters.updateTokenPricesFromPoolPrices.resolves([token0, token1]);

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: v3PoolData,
    });

    const token1After = await context.Token.getOrThrow(token1.id);

    const expectedToken1SwapVolumeUSD = initialToken1SwapVolumeUSD.plus(
      formatFromTokenAmount(amount1, token1).times(token1.usdPrice)
    );
    assert.equal(token1After.swapVolumeUSD.toString(), expectedToken1SwapVolumeUSD.toString());
  });

  it("should sum the single swap yield to the accumulated yields in the pool entity", async () => {
    let token0 = new TokenMock("0x01");
    let token1 = new TokenMock("0x02");

    const sqrtPriceX96 = BigInt(3432);
    const tick = BigInt(989756545);

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

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: amount0,
      swapAmount1: amount1,
      sqrtPriceX96,
      tick,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: new V3PoolDataMock(),
    });

    const updatedPool = await context.Pool.getOrThrow(pool.id);
    const updatedToken0 = await context.Token.getOrThrow(token0.id);
    const updatedToken1 = await context.Token.getOrThrow(token1.id);

    const swapFees = getSwapFeesFromRawAmounts(amount0, amount1, pool.currentFeeTier, updatedToken0, updatedToken1);
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

    await handleV3PoolSwap({
      context,
      poolEntity: pool,
      token0Entity: token0,
      token1Entity: token1,
      swapAmount0: 0n,
      swapAmount1: 0n,
      sqrtPriceX96: 0n,
      tick: 0n,
      eventTimestamp,
      v3PoolSetters: poolSetters,
      v3PoolEntity: new V3PoolDataMock(),
    });

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;
    assert.deepEqual(updatedPool, resultPool, "The pool should be updated with the accumulated yield data");
  });
});
