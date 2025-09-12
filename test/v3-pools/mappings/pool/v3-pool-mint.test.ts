import assert from "assert";
import { BigDecimal, HandlerContext } from "generated";
import sinon from "sinon";
import { PoolSetters } from "../../../../src/common/pool-setters";
import { handleV3PoolMint } from "../../../../src/v3-pools/mappings/pool/v3-pool-mint";
import { HandlerContextCustomMock, PoolMock, TokenMock } from "../../../mocks";

describe("V3PoolMintHandler", () => {
  let context: HandlerContext;
  let poolSetters: sinon.SinonStubbedInstance<PoolSetters>;
  let eventTimestamp = BigInt(Math.floor(Date.now() / 1000));

  beforeEach(() => {
    context = HandlerContextCustomMock();
    poolSetters = sinon.createStubInstance(PoolSetters);
  });

  it(`Should sum the pool token0 tvl with the amount passed in the event`, async () => {
    let expectedAmount0In = BigDecimal("9.325");
    let expectedPoolToken0TvlAfterSum = BigDecimal("21.3");

    let pool = new PoolMock();
    let token0 = new TokenMock(pool.token0_id)!;
    let token1 = new TokenMock("0x0000000000000000000000000000000000000122");

    pool = {
      ...pool,
      totalValueLockedToken0: expectedPoolToken0TvlAfterSum.minus(expectedAmount0In),
    };

    let amount0 = BigInt(expectedAmount0In.times(BigDecimal((10 ** token0.decimals).toString())).toString());

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV3PoolMint(context, pool, token0, token1, amount0, BigInt(0), eventTimestamp, poolSetters);

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;

    assert.deepEqual(updatedPool.totalValueLockedToken0, expectedPoolToken0TvlAfterSum);
  });

  it(`should sum the token0 pooled usd value by the amount passed in the event`, async () => {
    let currentPooledTokenAmount = BigDecimal("321.7");
    let amount0In = BigDecimal("12.3");
    let token0UsdPrice = BigDecimal("1200");
    let pool = new PoolMock();
    let currentPooledToken0USD = currentPooledTokenAmount.times(token0UsdPrice);

    let token0 = new TokenMock(pool.token0_id);
    let token1 = new TokenMock("0x0000000000000000000000000000000000000221");

    token0 = {
      ...token0,
      totalTokenPooledAmount: currentPooledTokenAmount,
      totalValuePooledUsd: currentPooledToken0USD,
      usdPrice: token0UsdPrice,
    };

    let amount0InBigInt = BigInt(amount0In.times(BigDecimal((10 ** token0.decimals).toString())).toString());

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV3PoolMint(context, pool, token0, token1, amount0InBigInt, BigInt(0), eventTimestamp, poolSetters);

    const updatedToken0 = await context.Token.getOrThrow(token0.id);
    const expectedTotalValuePooledUsd = currentPooledToken0USD.plus(amount0In.times(token0UsdPrice));

    assert.deepEqual(updatedToken0.totalValuePooledUsd, expectedTotalValuePooledUsd);
  });

  it(`should sum the token1 pooled usd value by the amount passed in the event`, async () => {
    let currentTokenAmountPooled = BigDecimal("321.7");
    let amount1In = BigDecimal("942.75");
    let token1UsdPrice = BigDecimal("10");
    let pool = new PoolMock();
    let currentPooledToken1USD = currentTokenAmountPooled.times(token1UsdPrice);

    let token0 = new TokenMock("0x0000000000000000000000000000000000000221");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000122");

    token1 = {
      ...token1,
      totalTokenPooledAmount: currentTokenAmountPooled,
      totalValuePooledUsd: currentPooledToken1USD,
      usdPrice: token1UsdPrice,
    };

    let amount1InBigInt = BigInt(amount1In.times(BigDecimal((10 ** token1.decimals).toString())).toString());

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV3PoolMint(context, pool, token0, token1, BigInt(0), amount1InBigInt, eventTimestamp, poolSetters);

    const updatedToken1 = await context.Token.getOrThrow(token1.id);
    const expectedNewToken1AmountUsd = currentPooledToken1USD.plus(amount1In.times(token1UsdPrice));

    assert.deepEqual(updatedToken1.totalValuePooledUsd, expectedNewToken1AmountUsd);
  });

  it(`should deduct the pool token1 tvl with the amount passed in the event`, async () => {
    let expectedAmount1In = BigDecimal("7.325");
    let expectedPoolToken1TvlAfterSum = BigDecimal("12.3");

    let pool = new PoolMock();
    let token0 = new TokenMock(pool.token0_id);
    let token1 = new TokenMock("0x0000000000000000000000000000000000000122");

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
      totalValueLockedToken1: expectedPoolToken1TvlAfterSum.minus(expectedAmount1In),
    };

    let amount1 = BigInt(expectedAmount1In.times(BigDecimal((10 ** token0.decimals).toString())).toString());

    await handleV3PoolMint(context, pool, token0, token1, BigInt(0), amount1, eventTimestamp, poolSetters);

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;

    assert.deepEqual(updatedPool.totalValueLockedToken1, expectedPoolToken1TvlAfterSum);
  });

  it(`should update the pool usd tvl after summing the token amounts from the pool`, async () => {
    let amount0In = BigDecimal("12.3");
    let amount1In = BigDecimal("7.325");
    let poolToken0TVLAfterSum = BigDecimal("7.3");
    let poolToken1TVLAfterSum = BigDecimal("1.325");
    let token0USDPrice = BigDecimal("1200");
    let token1USDPrice = BigDecimal("10");

    let token0 = new TokenMock("0x0000000000000000000000000000000000000001");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    let pool = new PoolMock();

    pool = {
      ...pool,
      totalValueLockedToken0: poolToken0TVLAfterSum.minus(amount0In),
      totalValueLockedToken1: poolToken1TVLAfterSum.minus(amount1In),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    let amount1 = BigInt(amount1In.times(BigDecimal((10 ** token0.decimals).toString())).toString());
    let amount0 = BigInt(amount0In.times(BigDecimal((10 ** token0.decimals).toString())).toString());

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV3PoolMint(context, pool, token0, token1, amount0, amount1, eventTimestamp, poolSetters);

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;

    assert.deepEqual(
      updatedPool.totalValueLockedUSD,
      poolToken0TVLAfterSum.times(token0USDPrice).plus(poolToken1TVLAfterSum.times(token1USDPrice))
    );
  });

  it("should call the pool setters to update the pool daily data after updating the pool TVLs", async () => {
    let amount0In = BigDecimal("12.3");
    let amount1In = BigDecimal("7.325");
    let poolToken0TVLAfterSum = BigDecimal("7.3");
    let poolToken1TVLAfterSum = BigDecimal("1.325");
    let token0USDPrice = BigDecimal("1200");
    let token1USDPrice = BigDecimal("10");

    let token0 = new TokenMock("0x0000000000000000000000000000000000000001");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    let pool = new PoolMock();

    pool = {
      ...pool,
      totalValueLockedToken0: poolToken0TVLAfterSum.minus(amount0In),
      totalValueLockedToken1: poolToken1TVLAfterSum.plus(amount1In),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    let amount1 = BigInt(amount0In.times(BigDecimal((10 ** token0.decimals).toString())).toString());
    let amount0 = BigInt(amount1In.times(BigDecimal((10 ** token0.decimals).toString())).toString());

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV3PoolMint(context, pool, token0, token1, amount0, amount1, eventTimestamp, poolSetters);

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;

    assert(poolSetters.setPoolDailyDataTVL.calledWith(eventTimestamp, updatedPool));
  });
});
