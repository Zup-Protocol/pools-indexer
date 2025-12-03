import assert from "assert";
import { BigDecimal, handlerContext, Pool, Token } from "generated";
import sinon from "sinon";
import { PoolSetters } from "../../../../src/common/pool-setters";
import { formatFromTokenAmount } from "../../../../src/common/token-commons";
import { handleV2PoolClaimFees } from "../../../../src/v2-pools/mappings/pool/v2-pool-claim-fees";
import { handleV2PoolSync } from "../../../../src/v2-pools/mappings/pool/v2-pool-sync";
import { handlerContextCustomMock, PoolMock, TokenMock } from "../../../mocks";

describe("V2PoolSyncHandler", () => {
  let context: handlerContext;
  let poolSetters: sinon.SinonStubbedInstance<PoolSetters>;
  let eventTimestamp = BigInt(Math.floor(Date.now() / 1000));

  beforeEach(() => {
    context = handlerContextCustomMock();
    poolSetters = sinon.createStubInstance(PoolSetters);
    poolSetters.updatePoolAccumulatedYield.resolvesArg(1);
  });

  afterEach(() => {
    sinon.restore();
  });

  it(`When calling the handler, it should correctly update the pool total
    value locked of the token 0 with the passed reserve 0`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let reserve0 = BigInt(1000);
    let reserve1 = BigInt(2000);

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolSync(context, pool, token0, token1, reserve0, reserve1, eventTimestamp, poolSetters);

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;
    assert.deepEqual(updatedPool.totalValueLockedToken0, formatFromTokenAmount(reserve0, token0));
  });

  it(`When calling the handler, it should correctly update the pool total
    value locked of the token 1 with the passed reserve 1`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let reserve0 = BigInt(1000);
    let reserve1 = BigInt(2000);

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolSync(context, pool, token0, token1, reserve0, reserve1, eventTimestamp, poolSetters);

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;
    assert.deepEqual(updatedPool.totalValueLockedToken1, formatFromTokenAmount(reserve1, token0));
  });

  it(`When calling the handler, it should correctly update the pool total
    value locked usd based on the reserve amounts passed`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let reserve0 = BigInt("21697821");
    let reserve1 = BigInt("78926131286");

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolSync(context, pool, token0, token1, reserve0, reserve1, eventTimestamp, poolSetters);
    const updatedPool = await context.Pool.getOrThrow(pool.id)!;

    assert.deepEqual(
      updatedPool.totalValueLockedUSD,
      formatFromTokenAmount(reserve0, token0)
        .times(token0.usdPrice)
        .plus(formatFromTokenAmount(reserve1, token1).times(token1.usdPrice))
    );
  });

  it(`When calling the handler, it should correctly update the token0 total value pooled`, async () => {
    let pooledAmountBefore = BigInt("386892387356625372");
    let poolReserve0Before = BigInt("291678721629");
    let token0Address = "0x0000000000000000000000000000000000111119";
    let pool = new PoolMock();
    let token0 = new TokenMock(token0Address);
    let token1 = new TokenMock();
    let newReserve0 = BigInt("21697821");
    let newReserve1 = BigInt("78926131286");

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
      totalValueLockedToken0: formatFromTokenAmount(poolReserve0Before, token0),
    };

    token0 = {
      ...token0,
      totalTokenPooledAmount: formatFromTokenAmount(pooledAmountBefore, token0),
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolSync(context, pool, token0, token1, newReserve0, newReserve1, eventTimestamp, poolSetters);

    const updatedToken0 = await context.Token.getOrThrow(token0.id)!;

    assert.deepEqual(
      updatedToken0.totalTokenPooledAmount,
      formatFromTokenAmount(pooledAmountBefore, token0).plus(
        formatFromTokenAmount(newReserve0 - BigInt(poolReserve0Before), token0)
      )
    );
  });

  it(`When calling the handler, it should correctly update the token1 total value pooled`, async () => {
    let pooledAmountBefore = BigInt("21567328392988");
    let poolReserve1Before = BigInt("918729817827186281");
    let token1Address = "0x0000000000000000000000000000000002111119";
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock(token1Address);
    let newReserve0 = BigInt("21697821");
    let newReserve1 = BigInt("78926131286");

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
      totalValueLockedToken1: formatFromTokenAmount(poolReserve1Before, token1),
    };

    token1 = {
      ...token1,
      totalTokenPooledAmount: formatFromTokenAmount(pooledAmountBefore, token1),
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolSync(context, pool, token0, token1, newReserve0, newReserve1, eventTimestamp, poolSetters);
    const updatedToken1 = await context.Token.getOrThrow(token1.id)!;

    assert.deepEqual(
      updatedToken1.totalTokenPooledAmount,
      formatFromTokenAmount(pooledAmountBefore, token1).plus(
        formatFromTokenAmount(newReserve1 - poolReserve1Before, token1)
      )
    );
  });

  it(`When calling the handler, it should correctly update the token0 total value pooled in usd`, async () => {
    let pooledAmountBefore = BigInt("386892387356625372");
    let poolReserve0Before = BigInt("291678721629");
    let token0Address = "0x0000000000000000000000000000000000111119";
    let token0UsdPrice = BigDecimal("2561.3277");
    let pool = new PoolMock();
    let token0 = new TokenMock(token0Address);
    let token1 = new TokenMock();
    let newReserve0 = BigInt("21697821");
    let newReserve1 = BigInt("78926131286");

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
      totalValueLockedToken0: formatFromTokenAmount(poolReserve0Before, token0),
    };

    token0 = {
      ...token0,
      totalTokenPooledAmount: formatFromTokenAmount(pooledAmountBefore, token0),
      usdPrice: token0UsdPrice,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolSync(context, pool, token0, token1, newReserve0, newReserve1, eventTimestamp, poolSetters);

    const updatedToken0 = await context.Token.getOrThrow(token0.id)!;

    assert.deepEqual(
      updatedToken0.totalValuePooledUsd,
      formatFromTokenAmount(pooledAmountBefore, token0)
        .plus(formatFromTokenAmount(newReserve0 - poolReserve0Before, token0))
        .times(token0UsdPrice)
    );
  });

  it(`When calling the handler, it should correctly update the token1 total value pooled in usd`, async () => {
    let pooledAmountBefore = BigInt("21567328392988");
    let poolReserve1Before = BigInt("918729817827186281");
    let token1Address = "0x0000000000000000000000000000000002111119";
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock(token1Address);
    let newReserve0 = BigInt("21697821");
    let newReserve1 = BigInt("78926131286");
    let token1UsdPrice = BigDecimal("1");

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
      totalValueLockedToken1: formatFromTokenAmount(poolReserve1Before, token1),
    };

    token1 = {
      ...token1,
      totalTokenPooledAmount: formatFromTokenAmount(pooledAmountBefore, token1),
      usdPrice: token1UsdPrice,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV2PoolSync(context, pool, token0, token1, newReserve0, newReserve1, eventTimestamp, poolSetters);

    const updatedToken1 = await context.Token.getOrThrow(token1.id)!;

    assert.deepEqual(
      updatedToken1.totalValuePooledUsd,
      formatFromTokenAmount(pooledAmountBefore, token1)
        .plus(formatFromTokenAmount(newReserve1 - poolReserve1Before, token1))
        .times(token1UsdPrice)
    );
  });

  it(`When calling the handler, it should call the pool setters to set the daiy data tvl`, async () => {
    let poolAddress = "0x1000000000000000000000000000000000111111";
    let pool = new PoolMock(poolAddress);
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let newReserve0 = BigInt("21697821");
    let newReserve1 = BigInt("78926131286");

    await handleV2PoolSync(context, pool, token0, token1, newReserve0, newReserve1, eventTimestamp, poolSetters);
    const updatedPool = await context.Pool.getOrThrow(pool.id)!;

    assert(poolSetters.setIntervalDataTVL.calledWith(eventTimestamp, updatedPool));
  });

  it(`should select the current pool as the token0 most liquid pool if the current pool
        has more tokens than the previous after the sync after the sync`, async () => {
    const token0Id = "0x0000000000000000000000000000000000000001";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const previousMostLiquidPOol: Pool = {
      ...new PoolMock(),
      id: "XabasPeviosPool",
      token0_id: token1Id,
      token1_id: token0Id,
      totalValueLockedToken1: BigDecimal("111"),
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

    const newReserveAmount0 = BigInt("2619261261982619821") * 10n ** BigInt(token0.decimals);
    const newReserveAmount1 = BigInt("997092172712901") * 10n ** BigInt(token1.decimals);

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

    await handleV2PoolSync(
      context,
      pool,
      token0,
      token1,
      newReserveAmount0,
      newReserveAmount1,
      eventTimestamp,
      poolSetters
    );

    const updatedToken0 = await context.Token.getOrThrow(token0.id)!;

    assert.deepEqual(updatedToken0.mostLiquidPool_id, pool.id);
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

    const newReserveAmount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const newReserveAmount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

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

    await handleV2PoolSync(
      context,
      pool,
      token0,
      token1,
      newReserveAmount0,
      newReserveAmount1,
      eventTimestamp,
      poolSetters
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

    const newReserveAmount0 = BigInt(123) * 10n ** BigInt(token0.decimals);
    const newReserveAmount1 = BigInt(456) * 10n ** BigInt(token1.decimals);

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

    await handleV2PoolSync(
      context,
      pool,
      token0,
      token1,
      newReserveAmount0,
      newReserveAmount1,
      eventTimestamp,
      poolSetters
    );

    const updatedToken0 = await context.Token.getOrThrow(token0.id)!;

    assert.deepEqual(updatedToken0.mostLiquidPool_id, previousMostLiquidPOol.id);
  });

  it(`should select the current pool as the token1 most liquid pool if the current pool
        has more tokens than the previous after the sync`, async () => {
    const token0Id = "0x0000000000000000000000000000000000000001";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const previousMostLiquidPOol: Pool = {
      ...new PoolMock(),
      id: "XabasPeviosPool",
      token0_id: token0Id,
      token1_id: token1Id,
      totalValueLockedToken1: BigDecimal("11555"),
      totalValueLockedToken0: BigDecimal("11"),
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

    const newReserveAmount0 = BigInt("9206121902610") * 10n ** BigInt(token0.decimals);
    const newReserveAmount1 = BigInt("261982618926189") * 10n ** BigInt(token1.decimals);

    const pool: Pool = {
      ...new PoolMock(),
      token0_id: token0.id,
      token1_id: token1.id,
      totalValueLockedToken1: BigDecimal("261986218926819"),
      totalValueLockedToken0: BigDecimal("9206121902610"),
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.Pool.set(previousMostLiquidPOol);

    await handleV2PoolClaimFees(
      context,
      pool,
      token0,
      token1,
      newReserveAmount0,
      newReserveAmount1,
      eventTimestamp,
      poolSetters
    );

    const updatedToken1 = await context.Token.getOrThrow(token1.id)!;

    assert.deepEqual(updatedToken1.mostLiquidPool_id, pool.id);
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

    await handleV2PoolClaimFees(context, pool, token0, token1, 0n, 0n, eventTimestamp, poolSetters);

    const updatedPool = await context.Pool.getOrThrow(pool.id)!;
    assert.deepEqual(updatedPool, resultPool, "The pool should be updated with the accumulated yield data");
  });
});
