import assert from "assert";
import { BigDecimal, HandlerContext } from "generated";
import sinon from "sinon";
import { sqrtPriceX96toPrice } from "../../../../src/common/cl-pool-converters";
import { getPoolHourlyDataId } from "../../../../src/common/pool-commons";
import { PoolSetters } from "../../../../src/common/pool-setters";
import { formatFromTokenAmount } from "../../../../src/common/token-commons";
import { handleV4PoolSwap } from "../../../../src/v4-pools/mappings/pool-manager/v4-pool-swap";
import { HandlerContextCustomMock, PoolHourlyDataMock, PoolMock, TokenMock, V4PoolDataMock } from "../../../mocks";

describe("V4PoolSwap handler", () => {
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
    const sqrtPriceX96 = BigInt(3432);
    let poolPrices = sqrtPriceX96toPrice(sqrtPriceX96, token0, token1);
    const token0ExpectedUsdPrice = BigDecimal("9836276.3222");
    const token1ExpectedUsdPrice = BigDecimal("0.91728716782");
    const tick = BigInt(989756545);
    const amount0 = BigInt(100);
    const amount1 = BigInt(200);
    const swapFee = 500;
    let v4PoolData = new V4PoolDataMock();

    poolSetters.getPricesForPoolWhitelistedTokens.returns({
      token0UpdatedPrice: token0ExpectedUsdPrice,
      token1UpdatedPrice: token1ExpectedUsdPrice,
    });

    v4PoolData = {
      ...v4PoolData,
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
    context.V4PoolData.set(v4PoolData);

    await handleV4PoolSwap(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      sqrtPriceX96,
      tick,
      swapFee,
      eventTimestamp,
      poolSetters
    );

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
    const sqrtPriceX96 = BigInt(3432);
    let poolPrices = sqrtPriceX96toPrice(sqrtPriceX96, token0, token1);
    const token0ExpectedUsdPrice = BigDecimal("9836276.3222");
    const token1ExpectedUsdPrice = BigDecimal("0.91728716782");
    const tick = BigInt(989756545);
    const amount0 = BigInt(100);
    const amount1 = BigInt(200);
    const swapFee = 500;
    let v4PoolData = new V4PoolDataMock();

    poolSetters.getPricesForPoolWhitelistedTokens.returns({
      token0UpdatedPrice: token0ExpectedUsdPrice,
      token1UpdatedPrice: token1ExpectedUsdPrice,
    });

    v4PoolData = {
      ...v4PoolData,
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
    context.V4PoolData.set(v4PoolData);

    await handleV4PoolSwap(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      sqrtPriceX96,
      tick,
      swapFee,
      eventTimestamp,
      poolSetters
    );

    assert(poolSetters.getPricesForPoolWhitelistedTokens.calledWith(token0, token1, poolPrices));
  });

  it(`When the handler is called, and the token0 amount is a negative number,
    it should increase pool token0 tvl by the amount passed in the event`, async () => {
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
    let swapFee = 500;
    let v4PoolData = new V4PoolDataMock();

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

    v4PoolData = {
      ...v4PoolData,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V4PoolData.set(v4PoolData);

    await handleV4PoolSwap(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      sqrtPriceX96,
      tick,
      swapFee,
      eventTimestamp,
      poolSetters
    );

    const poolAfter = await context.Pool.getOrThrow(pool.id);

    assert.equal(
      poolAfter.totalValueLockedToken0.toString(),
      poolToken0TVLBefore.minus(formatFromTokenAmount(amount0, token0)).toString() // using minus because amount0 is negative, so minus a negative is addition
    );
  });

  it(`When the handler is called, and the token0 amount is a positive number,
    it should decrease pool token0 tvl by the amount passed in the event`, async () => {
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
    let swapFee = 500;
    let v4PoolData = new V4PoolDataMock();

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

    v4PoolData = {
      ...v4PoolData,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V4PoolData.set(v4PoolData);

    await handleV4PoolSwap(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      sqrtPriceX96,
      tick,
      swapFee,
      eventTimestamp,
      poolSetters
    );

    const poolAfter = await context.Pool.getOrThrow(pool.id);

    assert.equal(
      poolAfter.totalValueLockedToken0.toString(),
      poolToken0TVLBefore.minus(formatFromTokenAmount(amount0, token0)).toString()
    );
  });

  it(`When the handler is called, and the token1 amount is a negative number,
    it should increase pool token1 tvl by the amount passed in the event`, async () => {
    let token0Id = "0x0000000000000000000000000000000000000002";
    let token1Id = "0x0000000000000000000000000000000000000003";
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    let poolToken1TVLBefore = BigDecimal("325672.43");
    let amount0 = BigInt(0);
    let amount1 = BigInt(200) * BigInt(10) ** BigInt(token1.decimals) * BigInt(-1);
    let sqrtPriceX96 = BigInt(3432);
    let tick = BigInt(989756545);
    let swapFee = 500;
    let v4PoolData = new V4PoolDataMock();

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

    v4PoolData = {
      ...v4PoolData,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V4PoolData.set(v4PoolData);

    await handleV4PoolSwap(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      sqrtPriceX96,
      tick,
      swapFee,
      eventTimestamp,
      poolSetters
    );

    const poolAfter = await context.Pool.getOrThrow(pool.id);

    assert.equal(
      poolAfter.totalValueLockedToken1.toString(),
      poolToken1TVLBefore.minus(formatFromTokenAmount(amount1, token1)).toString() // using minus because amount1 is negative, so minus a negative is addition
    );
  });

  it(`When the handler is called, and the token1 amount is a positive number,
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
    let v4PoolData = new V4PoolDataMock();

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

    v4PoolData = {
      ...v4PoolData,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V4PoolData.set(v4PoolData);

    await handleV4PoolSwap(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      sqrtPriceX96,
      tick,
      swapFee,
      eventTimestamp,
      poolSetters
    );

    const poolAfter = await context.Pool.getOrThrow(pool.id);

    assert.equal(
      poolAfter.totalValueLockedToken1.toString(),
      poolToken1TVLBefore.minus(formatFromTokenAmount(amount1, token1)).toString()
    );
  });

  it(`When the handler is called, it should update the pool usd tvl based on the new token0 and token1 amounts and prices`, async () => {
    let token0Id = "0x0000000000000000000000000000000000000012";
    let token1Id = "0x0000000000000000000000000000000000000002";
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let v4PoolData = new V4PoolDataMock();
    let poolToken0TVLBefore = BigDecimal("91821.43");
    let poolToken1TVLBefore = BigDecimal("121320.43");
    let amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    let amount1 = BigInt(87532) * 10n ** BigInt(token1.decimals);
    let sqrtPriceX96 = BigInt(3432);
    let tick = BigInt(989756545);
    let swapFee = 500;
    let token0Price = BigDecimal("3278");
    let token1Price = BigDecimal("91");

    poolSetters.getPricesForPoolWhitelistedTokens.returns({
      token0UpdatedPrice: token0Price,
      token1UpdatedPrice: token1Price,
    });

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

    pool = {
      ...pool,
      token0_id: token0Id,
      token1_id: token1Id,
      totalValueLockedToken0: poolToken0TVLBefore,
      totalValueLockedToken1: poolToken1TVLBefore,
    };

    v4PoolData = {
      ...v4PoolData,
      id: pool.id,
    };

    context.V4PoolData.set(v4PoolData);
    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolSwap(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      sqrtPriceX96,
      tick,
      swapFee,
      eventTimestamp,
      poolSetters
    );

    let poolAfter = await context.Pool.getOrThrow(pool.id);

    assert.equal(
      poolAfter.totalValueLockedUSD.toString(),
      poolToken0TVLBefore
        .minus(formatFromTokenAmount(amount0, token0))
        .times(token0Price)
        .plus(poolToken1TVLBefore.minus(formatFromTokenAmount(amount1, token1)).times(token1Price))
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
    let v4PoolData = new V4PoolDataMock();
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

    v4PoolData = {
      ...v4PoolData,
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
    context.V4PoolData.set(v4PoolData);

    await handleV4PoolSwap(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      sqrtPriceX96,
      tick,
      swapFee,
      eventTimestamp,
      poolSetters
    );

    assert(
      poolSetters.setHourlyData.calledWithMatch(
        eventTimestamp,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        amount0,
        amount1,
        swapFee
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
    let v4PoolData = new V4PoolDataMock();
    let token1UsdPrice = BigDecimal("1200.32");
    let currentPooledTokenAmount = BigDecimal("321.7");
    let currentToken1PooledUsdAmount = currentPooledTokenAmount.times(token1UsdPrice);
    let amount1BigInt = BigInt(3134) * BigInt(10) ** BigInt(token1.decimals);
    let amount0BigInt = BigInt(12) * BigInt(10) ** BigInt(token0.decimals) * -1n; // unlike v3, a negative amount in v4 means thet the token has been sent to the pool
    let sqrtPriceX96 = BigInt(100) * BigInt(10n ** 96n);
    let tick = BigInt(989756545);
    let swapFee = 500;

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

    v4PoolData = {
      ...v4PoolData,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V4PoolData.set(v4PoolData);

    await handleV4PoolSwap(
      context,
      pool,
      token0,
      token1,
      amount0BigInt,
      amount1BigInt,
      sqrtPriceX96,
      tick,
      swapFee,
      eventTimestamp,
      poolSetters
    );

    const updatedToken1 = await context.Token.getOrThrow(token1.id);
    const expectedNewToken1AmountUsd = currentPooledTokenAmount
      .minus(formatFromTokenAmount(amount1BigInt, token1))
      .times(updatedToken1.usdPrice);

    assert.deepEqual(updatedToken1.totalValuePooledUsd, expectedNewToken1AmountUsd);
  });

  it(`when the user swaps token1 for token0, the token0 pooled usd amount should decrease
   by the amount swapped, as it is taken from the pool`, async () => {
    let token0Id = "0x0000000000000000000000000000000000000012";
    let token1Id = "0x0000000000000000000000000000000000000002";
    let pool = new PoolMock();
    let v4Pool = new V4PoolDataMock();
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

    v4Pool = {
      ...v4Pool,
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

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V4PoolData.set(v4Pool);

    let amount0BigInt = BigInt(1765) * BigInt(10) ** BigInt(token0.decimals);
    let amount1BigInt = BigInt(12) * BigInt(10) ** BigInt(token1.decimals) * -1n; // unlike v3, a negative amount in v4 means thet the token has been sent to the pool
    let swapFee = 500;

    await handleV4PoolSwap(
      context,
      pool,
      token0,
      token1,
      amount0BigInt,
      amount1BigInt,
      v4Pool.sqrtPriceX96,
      v4Pool.tick,
      swapFee,
      eventTimestamp,
      poolSetters
    );

    const updatedToken0 = await context.Token.getOrThrow(token0.id);
    const expectedNewToken0AmountUsd = currentPooledTokenAmount
      .minus(formatFromTokenAmount(amount0BigInt, token0))
      .times(updatedToken0.usdPrice);

    assert.deepEqual(updatedToken0.totalValuePooledUsd, expectedNewToken0AmountUsd);
  });

  it("When the handler is called, it should assign the sqrtPriceX96 to the pool", async () => {
    let pool = new PoolMock();
    let v4Pool = new V4PoolDataMock();
    let sqrtPriceX96 = BigInt(23456111);
    let tick = BigInt(989756545);
    let amount0 = BigInt(100);
    let amount1 = BigInt(200);
    let swapFee = 500;

    v4Pool = {
      ...v4Pool,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);

    await handleV4PoolSwap(
      context,
      pool,
      new TokenMock(),
      new TokenMock(),
      amount0,
      amount1,
      sqrtPriceX96,
      tick,
      swapFee,
      eventTimestamp,
      poolSetters
    );

    let updatedV4Pool = await context.V4PoolData.getOrThrow(v4Pool.id);
    assert.equal(updatedV4Pool.sqrtPriceX96, sqrtPriceX96);
  });

  it("When the handler is called, it should assign the tick to the pool", async () => {
    let pool = new PoolMock();
    let v4Pool = new V4PoolDataMock();
    let sqrtPriceX96 = BigInt(23456111);
    let tick = BigInt(989756545);
    let amount0 = BigInt(100);
    let amount1 = BigInt(200);
    let swapFee = 500;

    v4Pool = {
      ...v4Pool,
      id: pool.id,
    };

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);

    await handleV4PoolSwap(
      context,
      pool,
      new TokenMock(),
      new TokenMock(),
      amount0,
      amount1,
      sqrtPriceX96,
      tick,
      swapFee,
      eventTimestamp,
      poolSetters
    );

    let updatedV4Pool = await context.V4PoolData.getOrThrow(v4Pool.id);
    assert.equal(updatedV4Pool.tick, tick);
  });
});
