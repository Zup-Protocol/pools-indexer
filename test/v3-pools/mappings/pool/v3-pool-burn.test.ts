import assert from "assert";
import { BigDecimal } from "generated";
import { handlerContext, Pool, Token } from "generated/src/Types.gen";
import sinon from "sinon";
import { DeFiPoolDataSetters } from "../../../../src/common/defi-pool-data-setters";
import { PoolSetters } from "../../../../src/common/pool-setters";
import { handleV3PoolBurn } from "../../../../src/v3-pools/mappings/pool/v3-pool-burn";
import { handlerContextCustomMock, PoolMock, TokenMock } from "../../../mocks";

describe("V3PoolBurn", () => {
  let context: handlerContext;
  let poolSetters: sinon.SinonStubbedInstance<PoolSetters>;
  let defiPoolDataSetters: sinon.SinonStubbedInstance<DeFiPoolDataSetters>;
  let pool: Pool;
  let token0: Token;
  let token1: Token;
  let eventTimestamp: bigint;

  beforeEach(() => {
    token0 = new TokenMock("0x0000000000000000000000000000000000000001")!;
    token1 = new TokenMock("0x0000000000000000000000000000000000000002")!;
    pool = {
      ...new PoolMock(),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    eventTimestamp = BigInt(Math.floor(Date.now() / 1000));

    context = handlerContextCustomMock();
    poolSetters = sinon.createStubInstance(PoolSetters);
    defiPoolDataSetters = sinon.createStubInstance(DeFiPoolDataSetters);

    poolSetters.updatePoolAccumulatedYield.resolvesArg(1);
  });

  afterEach(() => {
    sinon.restore();
  });

  it(`should not change the pool tvl when calling the burn
   handler, as it's already handled in the collect handler`, async () => {
    pool = {
      ...pool,
      totalValueLockedToken0: BigDecimal("280173.2"),
      totalValueLockedToken1: BigDecimal("0.325"),
      totalValueLockedUSD: BigDecimal("722172917291.11"),
    };

    const amount0 = BigInt(19528172);
    const amount1 = BigInt(62186219);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV3PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const updatedPool = await context.Pool.getOrThrow(pool.id);

    assert.equal(
      updatedPool.totalValueLockedToken0,
      pool.totalValueLockedToken0,
      "Pool totalValueLockedToken0 should not change"
    );

    assert.equal(
      updatedPool.totalValueLockedToken1,
      pool.totalValueLockedToken1,
      "Pool totalValueLockedToken1 should not change"
    );

    assert.equal(
      updatedPool.totalValueLockedUSD,
      pool.totalValueLockedUSD,
      "Pool totalValueLockedUSD should not change"
    );
  });

  it(`should add up the liquidity volume for token 1 and token 0 with the same amounts as passed in the handler`, async () => {
    pool = {
      ...pool,
      liquidityVolumeToken0: BigDecimal("1000"),
      liquidityVolumeToken1: BigDecimal("2000"),
      liquidityVolumeUSD: BigDecimal("3000"),
    };

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV3PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;
    const expectedNewToken0LiquidityVolume = pool.liquidityVolumeToken0.plus(
      BigDecimal(amount0.toString()).div(BigDecimal((10 ** token0.decimals).toString()))
    );
    const expectedNewToken1LiquidityVolume = pool.liquidityVolumeToken1.plus(
      BigDecimal(amount1.toString()).div(BigDecimal((10 ** token1.decimals).toString()))
    );

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

  it(`should add up the liquidity volume usd with the same amounts as passed in the handler times the tokens usd price`, async () => {
    token0 = {
      ...token0,
      usdPrice: BigDecimal("1200.72"),
    };

    token1 = {
      ...token1,
      usdPrice: BigDecimal("10.72"),
    };

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    pool = {
      ...pool,
      liquidityVolumeToken0: BigDecimal("1000"),
      liquidityVolumeToken1: BigDecimal("2000"),
      liquidityVolumeUSD: BigDecimal("3000"),
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV3PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;
    const expectedNewLiquidityVolumeUSD = pool.liquidityVolumeUSD.plus(
      BigDecimal(amount0.toString())
        .div(BigDecimal((10 ** token0.decimals).toString()))
        .times(token0.usdPrice)
        .plus(
          BigDecimal(amount1.toString())
            .div(BigDecimal((10 ** token1.decimals).toString()))
            .times(token1.usdPrice)
        )
    );

    assert.deepEqual(updatedPool.liquidityVolumeUSD, expectedNewLiquidityVolumeUSD);
  });

  it("should sum up the token0 token liquidity volume with the same amount as passed in the handler", async () => {
    token0 = {
      ...token0,
      tokenLiquidityVolume: BigDecimal("777"),
      liquidityVolumeUSD: BigDecimal("100"),
      usdPrice: BigDecimal("1200.72"),
    };

    token1 = {
      ...token1,
      tokenLiquidityVolume: BigDecimal("999"),
      liquidityVolumeUSD: BigDecimal("200"),
      usdPrice: BigDecimal("10.72"),
    };

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV3PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const updatedToken0 = await context.Token.getOrThrow(token0.id)!;
    const expectedNewToken0TokenLiquidityVolume = token0.tokenLiquidityVolume.plus(
      BigDecimal(amount0.toString()).div(BigDecimal((10 ** token0.decimals).toString()))
    );

    assert.deepEqual(updatedToken0.tokenLiquidityVolume, expectedNewToken0TokenLiquidityVolume);
  });

  it(`should sum up the token0 liquidity volume usd with the same amount as passed in the handler times the token0 usd price`, async () => {
    token0 = {
      ...token0,
      tokenLiquidityVolume: BigDecimal("777"),
      liquidityVolumeUSD: BigDecimal("100"),
      usdPrice: BigDecimal("1200.72"),
    };

    token1 = {
      ...token1,
      tokenLiquidityVolume: BigDecimal("999"),
      liquidityVolumeUSD: BigDecimal("200"),
      usdPrice: BigDecimal("10.72"),
    };

    const amount0 = BigInt(111) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(555) * 10n ** BigInt(token1.decimals);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV3PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const updatedToken0 = await context.Token.getOrThrow(token0.id)!;
    const expectedNewToken0LiquidityVolumeUSD = token0.liquidityVolumeUSD.plus(
      BigDecimal(amount0.toString())
        .div(BigDecimal((10 ** token0.decimals).toString()))
        .times(token0.usdPrice)
    );

    assert.deepEqual(updatedToken0.liquidityVolumeUSD, expectedNewToken0LiquidityVolumeUSD);
  });

  it(`should sum up the token1 liquidity volume usd with the same amount as passed in the handler times the token1 usd price`, async () => {
    token0 = {
      ...token0,
      tokenLiquidityVolume: BigDecimal("777"),
      liquidityVolumeUSD: BigDecimal("100"),
      usdPrice: BigDecimal("1200.72"),
    };

    token1 = {
      ...token1,
      tokenLiquidityVolume: BigDecimal("999"),
      liquidityVolumeUSD: BigDecimal("200"),
      usdPrice: BigDecimal("10.72"),
    };

    const amount0 = BigInt(111) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(555) * 10n ** BigInt(token1.decimals);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV3PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const updatedToken1 = await context.Token.getOrThrow(token1.id)!;
    const expectedNewToken1LiquidityVolumeUSD = token1.liquidityVolumeUSD.plus(
      BigDecimal(amount1.toString())
        .div(BigDecimal((10 ** token1.decimals).toString()))
        .times(token1.usdPrice)
    );

    assert.deepEqual(updatedToken1.liquidityVolumeUSD, expectedNewToken1LiquidityVolumeUSD);
  });

  it("should sum up the token1 token liquidity volume with the same amount as passed in the handler", async () => {
    token0 = {
      ...token0,
      tokenLiquidityVolume: BigDecimal("777"),
      liquidityVolumeUSD: BigDecimal("100"),
      usdPrice: BigDecimal("1200.72"),
    };

    token1 = {
      ...token1,
      tokenLiquidityVolume: BigDecimal("999"),
      liquidityVolumeUSD: BigDecimal("200"),
      usdPrice: BigDecimal("10.72"),
    };

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV3PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const updatedToken1 = await context.Token.getOrThrow(token1.id)!;
    const expectedNewToken1TokenLiquidityVolume = token1.tokenLiquidityVolume.plus(
      BigDecimal(amount1.toString()).div(BigDecimal((10 ** token1.decimals).toString()))
    );

    assert.deepEqual(updatedToken1.tokenLiquidityVolume, expectedNewToken1TokenLiquidityVolume);
  });

  it(`should call the pool setters to update the interval liquidity data, after updating the pool and the tokens entities, with the amount0 and amount1 negative`, async () => {
    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV3PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
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

  // TODO: re-enable this test when the defi pool data is Implemented for v3 pools
  // it(`should call the defi pool setters to set interval liquidity data if the current pool has a swap volume usd greater than 0,
  //   passing the current saved defi pool data entity and the amount0 and amount1 negative, as it is a burn`, async () => {
  //   pool = {
  //     ...pool,
  //     swapVolumeUSD: BigDecimal("12200"),
  //   };

  //   const defiPoolData = new DeFiPoolDataMock();
  //   const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
  //   const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

  //   context.Pool.set(pool);
  //   context.Token.set(token0);
  //   context.Token.set(token1);
  //   context.DeFiPoolData.set(defiPoolData);

  //   await handleV3PoolBurn(
  //     context,
  //     pool,
  //     token0,
  //     token1,
  //     amount0,
  //     amount1,
  //     eventTimestamp,
  //     poolSetters,
  //     defiPoolDataSetters
  //   );

  //   const updatedToken0 = await context.Token.getOrThrow(token0.id)!;
  //   const updatedToken1 = await context.Token.getOrThrow(token1.id)!;

  //   assert(
  //     defiPoolDataSetters.setIntervalLiquidityData.calledWith(
  //       eventTimestamp,
  //       defiPoolData,
  //       -amount0,
  //       -amount1,
  //       updatedToken0,
  //       updatedToken1
  //     )
  //   );
  // });

  it(`should not call the defi pool setters to set interval liquidity data if the current pool has a swap volume usd as 0`, async () => {
    pool = {
      ...pool,
      swapVolumeUSD: BigDecimal("0"),
    };

    const amount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const amount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV3PoolBurn(
      context,
      pool,
      token0,
      token1,
      amount0,
      amount1,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    assert(defiPoolDataSetters.setIntervalLiquidityData.notCalled);
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

    await handleV3PoolBurn(context, pool, token0, token1, 0n, 0n, eventTimestamp, poolSetters, defiPoolDataSetters);
    const updatedPool = await context.Pool.getOrThrow(pool.id)!;

    assert.deepEqual(updatedPool, resultPool, "The pool should be updated with the accumulated yield data");
  });
});
