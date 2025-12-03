import assert from "assert";
import { BigDecimal, handlerContext, Pool, Token } from "generated";
import sinon from "sinon";
import { DeFiPoolDataSetters } from "../../../../src/common/defi-pool-data-setters";
import { PoolSetters } from "../../../../src/common/pool-setters";
import { formatFromTokenAmount } from "../../../../src/common/token-commons";
import { handleV2PoolBurn } from "../../../../src/v2-pools/mappings/pool/v2-pool-burn";
import { handlerContextCustomMock, PoolMock, TokenMock } from "../../../mocks";

describe("V2PoolBurnHandler", () => {
  let context: handlerContext;
  let poolSetters: sinon.SinonStubbedInstance<PoolSetters>;
  let defiPoolSetters: sinon.SinonStubbedInstance<DeFiPoolDataSetters>;
  let eventTimestamp = BigInt(Math.floor(Date.now() / 1000));

  beforeEach(() => {
    context = handlerContextCustomMock();
    poolSetters = sinon.createStubInstance(PoolSetters);
    defiPoolSetters = sinon.createStubInstance(DeFiPoolDataSetters);

    poolSetters.updatePoolAccumulatedYield.resolvesArg(1);
  });

  afterEach(() => {
    sinon.restore();
  });

  it(`Should deduct the pool token0 tvl with the amount passed in the event`, async () => {
    let expectedAmount0Out = BigDecimal("9.325");
    let expectedPoolToken0TvlAfterDeduction = BigDecimal("21.3");

    let pool = new PoolMock();
    let token0 = new TokenMock(pool.token0_id)!;
    let token1 = new TokenMock("0x0000000000000000000000000000000000000122");

    pool = {
      ...pool,
      totalValueLockedToken0: expectedAmount0Out.plus(expectedPoolToken0TvlAfterDeduction),
    };

    let amount0 = BigInt(expectedAmount0Out.times(BigDecimal((10 ** token0.decimals).toString())).toString());

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      BigInt(0),
      eventTimestamp,
      poolSetters,
      defiPoolSetters
    );

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;

    assert.deepEqual(updatedPool.totalValueLockedToken0, expectedPoolToken0TvlAfterDeduction);
  });

  it(`should deduct the token0 pooled usd value by the amount passed in the event`, async () => {
    let currentPooledTokenAmount = BigDecimal("321.7");
    let amount0Out = BigDecimal("12.3");
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

    let amount0OutBigInt = BigInt(amount0Out.times(BigDecimal((10 ** token0.decimals).toString())).toString());

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0OutBigInt,
      BigInt(0),
      eventTimestamp,
      poolSetters,
      defiPoolSetters
    );

    const updatedToken0 = await context.Token.getOrThrow(token0.id);
    const expectedTotalValuePooledUsd = currentPooledToken0USD.minus(amount0Out.times(token0UsdPrice));

    assert.deepEqual(updatedToken0.totalValuePooledUsd, expectedTotalValuePooledUsd);
  });

  it(`should deduct the token1 pooled usd value by the amount passed in the event`, async () => {
    let currentTokenAmountPooled = BigDecimal("321.7");
    let amount1Out = BigDecimal("942.75");
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

    let amount1OutBigInt = BigInt(amount1Out.times(BigDecimal((10 ** token1.decimals).toString())).toString());

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolBurn(
      context,
      pool,
      token0,
      token1,
      BigInt(0),
      amount1OutBigInt,
      eventTimestamp,
      poolSetters,
      defiPoolSetters
    );

    const updatedToken1 = await context.Token.getOrThrow(token1.id);
    const expectedNewToken1AmountUsd = currentPooledToken1USD.minus(amount1Out.times(token1UsdPrice));

    assert.deepEqual(updatedToken1.totalValuePooledUsd, expectedNewToken1AmountUsd);
  });

  it(`should deduct the pool token1 tvl with the amount passed in the event`, async () => {
    let expectedAmount1Out = BigDecimal("7.325");
    let expectedPoolToken1TvlAfterDeduction = BigDecimal("12.3");

    let pool = new PoolMock();
    let token0 = new TokenMock(pool.token0_id);
    let token1 = new TokenMock("0x0000000000000000000000000000000000000122");

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
      totalValueLockedToken1: expectedAmount1Out.plus(expectedPoolToken1TvlAfterDeduction),
    };

    let amount1 = BigInt(expectedAmount1Out.times(BigDecimal((10 ** token0.decimals).toString())).toString());

    await handleV2PoolBurn(
      context,
      pool,
      token0,
      token1,
      BigInt(0),
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolSetters
    );

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;

    assert.deepEqual(updatedPool.totalValueLockedToken1, expectedPoolToken1TvlAfterDeduction);
  });

  it(`should update the pool usd tvl after deducting the token amounts from the pool`, async () => {
    let amount0Out = BigDecimal("12.3");
    let amount1Out = BigDecimal("7.325");
    let poolToken0TVLAfterDeduction = BigDecimal("7.3");
    let poolToken1TVLAfterDeduction = BigDecimal("1.325");
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
      totalValueLockedToken0: amount0Out.plus(poolToken0TVLAfterDeduction),
      totalValueLockedToken1: amount1Out.plus(poolToken1TVLAfterDeduction),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    let amount1 = BigInt(amount1Out.times(BigDecimal((10 ** token0.decimals).toString())).toString());
    let amount0 = BigInt(amount0Out.times(BigDecimal((10 ** token0.decimals).toString())).toString());

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolSetters
    );

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;

    assert.deepEqual(
      updatedPool.totalValueLockedUSD,
      poolToken0TVLAfterDeduction.times(token0USDPrice).plus(poolToken1TVLAfterDeduction.times(token1USDPrice))
    );
  });

  it("should call the pool setters to update the pool interval data tvl after updating the pool TVLs", async () => {
    let amount0Out = BigDecimal("12.3");
    let amount1Out = BigDecimal("7.325");
    let poolToken0TVLAfterDeduction = BigDecimal("7.3");
    let poolToken1TVLAfterDeduction = BigDecimal("1.325");
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
      totalValueLockedToken0: amount0Out.plus(poolToken0TVLAfterDeduction),
      totalValueLockedToken1: amount1Out.plus(poolToken1TVLAfterDeduction),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    let amount1 = BigInt(amount1Out.times(BigDecimal((10 ** token0.decimals).toString())).toString());
    let amount0 = BigInt(amount0Out.times(BigDecimal((10 ** token0.decimals).toString())).toString());

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolSetters
    );

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;

    assert(poolSetters.setIntervalDataTVL.calledWith(eventTimestamp, updatedPool));
  });

  it(`should add up the liquidity volume for token 1, token0 with the same amounts
    as passed in the handler`, async () => {
    const pool: Pool = {
      ...new PoolMock(),
      liquidityVolumeToken0: BigDecimal("398628921928961"),
      liquidityVolumeToken1: BigDecimal("111111"),
    };

    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolSetters
    );

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;
    const expectedNewToken0LiquidityVolume = pool.liquidityVolumeToken0.plus(formatFromTokenAmount(amount0, token0));
    const expectedNewToken1LiquidityVolume = pool.liquidityVolumeToken1.plus(formatFromTokenAmount(amount1, token1));

    assert.deepEqual(
      updatedPool.liquidityVolumeToken0,
      expectedNewToken0LiquidityVolume,
      "Liquidity volume token 0 should be added up"
    );

    assert.deepEqual(
      updatedPool.liquidityVolumeToken1,
      expectedNewToken1LiquidityVolume,
      "Liquidity volume token 1 should be added up"
    );
  });

  it(`should add up the liquidity volume usd with the same amounts
    as passed in the handler times the tokens usd price`, async () => {
    const token0: Token = {
      ...new TokenMock(),
      usdPrice: BigDecimal("1200.72"),
    };

    const token1: Token = {
      ...new TokenMock(),
      usdPrice: BigDecimal("10.72"),
    };

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    const pool: Pool = {
      ...new PoolMock(),
      token0_id: token0.id,
      token1_id: token1.id,
      liquidityVolumeToken0: BigDecimal("398628921928961"),
      liquidityVolumeToken1: BigDecimal("111111"),
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolSetters
    );

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;
    const expectedNewLiquidityVolumeUSD = pool.liquidityVolumeUSD.plus(
      formatFromTokenAmount(amount0, token0)
        .times(token0.usdPrice)
        .plus(formatFromTokenAmount(amount1, token1).times(token1.usdPrice))
    );

    assert.deepEqual(updatedPool.liquidityVolumeUSD, expectedNewLiquidityVolumeUSD);
  });

  it("should sum up the token0 token liquidity volume with the same amount as passed in the handler", async () => {
    const token0: Token = {
      ...new TokenMock(),
      id: "0x0000000000000000000000000000000000000001",
      usdPrice: BigDecimal("1200.72"),
      tokenLiquidityVolume: BigDecimal("777"),
    };

    const token1: Token = {
      ...new TokenMock(),
      id: "0x0000000000000000000000000000000000000002",
      usdPrice: BigDecimal("10.72"),
      tokenLiquidityVolume: BigDecimal("999"),
    };

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    const pool: Pool = {
      ...new PoolMock(),
      token0_id: token0.id,
      token1_id: token1.id,
      liquidityVolumeToken0: BigDecimal("398628921928961"),
      liquidityVolumeToken1: BigDecimal("111111"),
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolSetters
    );

    const updatedToken0 = await context.Token.getOrThrow(token0.id)!;
    const expectedNewToken0TokenLiquidityVolume = token0.tokenLiquidityVolume.plus(
      formatFromTokenAmount(amount0, token0)
    );

    assert.deepEqual(updatedToken0.tokenLiquidityVolume, expectedNewToken0TokenLiquidityVolume);
  });

  it(`should sum up the token0 liquidity volume usd with the same amount as passed in the handler
    times the token0 usd price`, async () => {
    const token0: Token = {
      ...new TokenMock(),
      id: "0x0000000000000000000000000000000000000001",
      usdPrice: BigDecimal("1200.72"),
      tokenLiquidityVolume: BigDecimal("777"),
    };

    const token1: Token = {
      ...new TokenMock(),
      id: "0x0000000000000000000000000000000000000002",
      usdPrice: BigDecimal("10.72"),
      tokenLiquidityVolume: BigDecimal("999"),
    };

    const amount0 = BigInt(111) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(555) * 10n ** BigInt(token1.decimals);

    const pool: Pool = {
      ...new PoolMock(),
      token0_id: token0.id,
      token1_id: token1.id,
      liquidityVolumeToken0: BigDecimal("398628921928961"),
      liquidityVolumeToken1: BigDecimal("111111"),
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolSetters
    );

    const updatedToken0 = await context.Token.getOrThrow(token0.id)!;
    const expectedNewToken0LiquidityVolumeUSD = token0.liquidityVolumeUSD.plus(
      formatFromTokenAmount(amount0, token0).times(token0.usdPrice)
    );

    assert.deepEqual(updatedToken0.liquidityVolumeUSD, expectedNewToken0LiquidityVolumeUSD);
  });

  it(`should sum up the token1 liquidity volume usd with the same amount as passed in the handler
    times the token1 usd price`, async () => {
    const token0: Token = {
      ...new TokenMock(),
      id: "0x0000000000000000000000000000000000000001",
      usdPrice: BigDecimal("1200.72"),
      tokenLiquidityVolume: BigDecimal("777"),
    };

    const token1: Token = {
      ...new TokenMock(),
      id: "0x0000000000000000000000000000000000000002",
      usdPrice: BigDecimal("10.72"),
      tokenLiquidityVolume: BigDecimal("999"),
    };

    const amount0 = BigInt(111) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(555) * 10n ** BigInt(token1.decimals);

    const pool: Pool = {
      ...new PoolMock(),
      token0_id: token0.id,
      token1_id: token1.id,
      liquidityVolumeToken0: BigDecimal("398628921928961"),
      liquidityVolumeToken1: BigDecimal("111111"),
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolSetters
    );

    const updatedToken1 = await context.Token.getOrThrow(token1.id)!;
    const expectedNewToken1LiquidityVolumeUSD = token1.liquidityVolumeUSD.plus(
      formatFromTokenAmount(amount1, token1).times(token1.usdPrice)
    );

    assert.deepEqual(updatedToken1.liquidityVolumeUSD, expectedNewToken1LiquidityVolumeUSD);
  });

  it("should sum up the token1 token liquidity volume with the same amount as passed in the handler", async () => {
    const token0: Token = {
      ...new TokenMock(),
      id: "0x0000000000000000000000000000000000000001",
      usdPrice: BigDecimal("1200.72"),
      tokenLiquidityVolume: BigDecimal("777"),
    };

    const token1: Token = {
      ...new TokenMock(),
      id: "0x0000000000000000000000000000000000000002",
      usdPrice: BigDecimal("10.72"),
      tokenLiquidityVolume: BigDecimal("999"),
    };

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    const pool: Pool = {
      ...new PoolMock(),
      token0_id: token0.id,
      token1_id: token1.id,
      liquidityVolumeToken0: BigDecimal("398628921928961"),
      liquidityVolumeToken1: BigDecimal("111111"),
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolSetters
    );

    const updatedToken1 = await context.Token.getOrThrow(token1.id)!;
    const expectedNewToken1TokenLiquidityVolume = token1.tokenLiquidityVolume.plus(
      formatFromTokenAmount(amount1, token1)
    );

    assert.deepEqual(updatedToken1.tokenLiquidityVolume, expectedNewToken1TokenLiquidityVolume);
  });

  it(`should select the current pool as the token0 most liquid pool if the current pool
    has more tokens than the previous`, async () => {
    const token0Id = "0x0000000000000000000000000000000000000001";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const previousMostLiquidPOol: Pool = {
      ...new PoolMock(),
      id: "XabasPeviosPool",
      token0_id: token1Id,
      token1_id: token0Id,
      totalValueLockedToken1: BigDecimal("151986218926819"),
      liquidityVolumeToken0: BigDecimal("398628921928961"),
      liquidityVolumeToken1: BigDecimal("5757"),
    };

    const token0: Token = {
      ...new TokenMock(),
      id: token0Id,
      mostLiquidPool_id: previousMostLiquidPOol.id,
    };

    const token1: Token = {
      ...new TokenMock(),
      id: token1Id,
    };

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    const pool: Pool = {
      ...new PoolMock(),
      token0_id: token0.id,
      token1_id: token1.id,
      totalValueLockedToken0: BigDecimal("261986218926819"),
      liquidityVolumeToken0: BigDecimal("398628921928961"),
      liquidityVolumeToken1: BigDecimal("111111"),
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.Pool.set(previousMostLiquidPOol);

    await handleV2PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolSetters
    );

    const updatedToken0 = await context.Token.getOrThrow(token0.id)!;

    assert.deepEqual(updatedToken0.mostLiquidPool_id, pool.id);
  });

  it(`should select the current pool as the token1 most liquid pool if the current pool
    has more tokens than the previous`, async () => {
    const token0Id = "0x0000000000000000000000000000000000000001";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const previousMostLiquidPOol: Pool = {
      ...new PoolMock(),
      id: "XabasPeviosPool",
      token0_id: token0Id,
      token1_id: token1Id,
      totalValueLockedToken1: BigDecimal("11555"),
      liquidityVolumeToken0: BigDecimal("398628921928961"),
      liquidityVolumeToken1: BigDecimal("5757"),
    };

    const token0: Token = {
      ...new TokenMock(),
      id: token0Id,
    };

    const token1: Token = {
      ...new TokenMock(),
      id: token1Id,
      mostLiquidPool_id: previousMostLiquidPOol.id,
    };

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    const pool: Pool = {
      ...new PoolMock(),
      token0_id: token0.id,
      token1_id: token1.id,
      totalValueLockedToken1: BigDecimal("261986218926819"),
      liquidityVolumeToken0: BigDecimal("398628921928961"),
      liquidityVolumeToken1: BigDecimal("111111"),
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.Pool.set(previousMostLiquidPOol);

    await handleV2PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolSetters
    );

    const updatedToken1 = await context.Token.getOrThrow(token1.id)!;

    assert.deepEqual(updatedToken1.mostLiquidPool_id, pool.id);
  });

  it(`should not select the current pool as the token1 most liquid pool if the current pool
    does not has more tokens than the previous`, async () => {
    const token0Id = "0x0000000000000000000000000000000000000001";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const previousMostLiquidPOol: Pool = {
      ...new PoolMock(),
      id: "XabasPeviosPool",
      token0_id: token0Id,
      token1_id: token1Id,
      totalValueLockedToken1: BigDecimal("111209179201092610921555"),
    };

    const token0: Token = {
      ...new TokenMock(),
      id: token0Id,
    };

    const token1: Token = {
      ...new TokenMock(),
      id: token1Id,
      mostLiquidPool_id: previousMostLiquidPOol.id,
    };

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    const pool: Pool = {
      ...new PoolMock(),
      token0_id: token0.id,
      token1_id: token1.id,
      totalValueLockedToken1: BigDecimal("26198621892"),
    };

    context.Pool.set(pool);
    context.Pool.set(previousMostLiquidPOol);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolSetters
    );

    const updatedToken1 = await context.Token.getOrThrow(token1.id)!;

    assert.deepEqual(updatedToken1.mostLiquidPool_id, previousMostLiquidPOol.id);
  });

  it(`should not select the current pool as the token0 most liquid pool if the current pool
    does not have more tokens than the previous`, async () => {
    const token0Id = "0x0000000000000000000000000000000000000001";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const previousMostLiquidPOol: Pool = {
      ...new PoolMock(),
      id: "XabasPeviosPool",
      token0_id: token0Id,
      token1_id: token1Id,
      totalValueLockedToken0: BigDecimal("111209179201092610921555"),
    };

    const token0: Token = {
      ...new TokenMock(),
      id: token0Id,
      mostLiquidPool_id: previousMostLiquidPOol.id,
    };

    const token1: Token = {
      ...new TokenMock(),
      id: token1Id,
    };

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    const pool: Pool = {
      ...new PoolMock(),
      token0_id: token0.id,
      token1_id: token1.id,
      totalValueLockedToken0: BigDecimal("26198621892"),
    };

    context.Pool.set(pool);
    context.Pool.set(previousMostLiquidPOol);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolSetters
    );

    const updatedToken0 = await context.Token.getOrThrow(token0.id)!;

    assert.deepEqual(updatedToken0.mostLiquidPool_id, previousMostLiquidPOol.id);
  });

  it(`should select the current pool as the token1 most liquid pool if the current pool
    has more tokens than the previous`, async () => {
    const token0Id = "0x0000000000000000000000000000000000000001";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const previousMostLiquidPOol: Pool = {
      ...new PoolMock(),
      id: "XabasPeviosPool",
      token0_id: token0Id,
      token1_id: token1Id,
      totalValueLockedToken1: BigDecimal("11555"),
      liquidityVolumeToken0: BigDecimal("398628921928961"),
      liquidityVolumeToken1: BigDecimal("5757"),
    };

    const token0: Token = {
      ...new TokenMock(),
      id: token0Id,
    };

    const token1: Token = {
      ...new TokenMock(),
      id: token1Id,
      mostLiquidPool_id: previousMostLiquidPOol.id,
    };

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    const pool: Pool = {
      ...new PoolMock(),
      token0_id: token0.id,
      token1_id: token1.id,
      totalValueLockedToken1: BigDecimal("261986218926819"),
      liquidityVolumeToken0: BigDecimal("398628921928961"),
      liquidityVolumeToken1: BigDecimal("111111"),
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.Pool.set(previousMostLiquidPOol);

    await handleV2PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolSetters
    );

    const updatedToken1 = await context.Token.getOrThrow(token1.id)!;

    assert.deepEqual(updatedToken1.mostLiquidPool_id, pool.id);
  });

  it(`should call the pool setters to update the interval liquidity data, after updating
    the pool and the tokens entities, with the amount0 and amount1 negative`, async () => {
    const token0Id = "0x0000000000000000000000000000000000000001";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const token0: Token = {
      ...new TokenMock(),
      id: token0Id,
    };

    const token1: Token = {
      ...new TokenMock(),
      id: token1Id,
    };

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    const pool: Pool = {
      ...new PoolMock(),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolSetters
    );

    const updatedToken0 = await context.Token.getOrThrow(token0.id)!;
    const updatedToken1 = await context.Token.getOrThrow(token1.id)!;
    const updatedPool = await context.Pool.getOrThrow(pool.id)!;

    assert(
      poolSetters.setLiquidityIntervalData.calledWith({
        eventTimestamp,
        amount0AddedOrRemoved: -amount0,
        amount1AddedOrRemoved: -amount1,
        poolEntity: updatedPool,
        token0: updatedToken0,
        token1: updatedToken1,
      })
    );
  });

  // TODO: Uncomment if implemented
  // it(`should call the defi pool setters to set interval liquidity data if the current pool
  //   has a swap volume usd greater than 0, passing the current saved defi pool data entity
  //   and the amount0 and amount1 negative, as it is a burn`, async () => {
  //   const token0Id = "0x0000000000000000000000000000000000000001";
  //   const token1Id = "0x0000000000000000000000000000000000000002";

  //   const token0: Token = {
  //     ...new TokenMock(),
  //     id: token0Id,
  //   };

  //   const token1: Token = {
  //     ...new TokenMock(),
  //     id: token1Id,
  //   };

  //   const currentDeFiPoolData: DeFiPoolData = {
  //     id: DEFI_POOL_DATA_ID,
  //     poolsCount: 126109,
  //     startedAtTimestamp: 1758582407n,
  //   };

  //   const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
  //   const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

  //   const pool: Pool = {
  //     ...new PoolMock(),
  //     token0_id: token0.id,
  //     token1_id: token1.id,
  //     swapVolumeUSD: BigDecimal("2121"),
  //   };

  //   context.Pool.set(pool);
  //   context.Token.set(token0);
  //   context.Token.set(token1);
  //   context.DeFiPoolData.set(currentDeFiPoolData);

  //   await handleV2PoolBurn(
  //     context,
  //     pool,
  //     token0,
  //     token1,
  //     amount0,
  //     amount1,
  //     eventTimestamp,
  //     poolSetters,
  //     defiPoolSetters
  //   );

  //   const updatedToken0 = await context.Token.getOrThrow(token0.id)!;
  //   const updatedToken1 = await context.Token.getOrThrow(token1.id)!;

  //   assert(
  //     defiPoolSetters.setIntervalLiquidityData.calledOnceWith(
  //       eventTimestamp,
  //       currentDeFiPoolData,
  //       -amount0,
  //       -amount1,
  //       updatedToken0,
  //       updatedToken1
  //     )
  //   );
  // });

  it(`should not call the defi pool setters to set interval liquidity data if the current pool
    has a swap volume usd as 0`, async () => {
    const token0Id = "0x0000000000000000000000000000000000000001";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const token0: Token = {
      ...new TokenMock(),
      id: token0Id,
    };

    const token1: Token = {
      ...new TokenMock(),
      id: token1Id,
    };

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    const pool: Pool = {
      ...new PoolMock(),
      token0_id: token0.id,
      token1_id: token1.id,
      swapVolumeUSD: BigDecimal("0"),
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolSetters
    );

    assert(defiPoolSetters.setIntervalLiquidityData.notCalled);
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

    sinon.replace(poolSetters, "updatePoolAccumulatedYield", poolSetters.updatePoolAccumulatedYield);

    await handleV2PoolBurn(context, pool, token0, token1, 0n, 0n, eventTimestamp, poolSetters, defiPoolSetters);
    const updatedPool = await context.Pool.getOrThrow(pool.id)!;

    assert.deepEqual(updatedPool, resultPool, "The pool should be updated with the accumulated yield data");
  });
});
