import assert from "assert";
import { BigDecimal, HandlerContext } from "generated";
import sinon from "sinon";
import { PoolSetters } from "../../../../src/common/pool-setters";
import { formatFromTokenAmount } from "../../../../src/common/token-commons";
import { handleV2PoolSync } from "../../../../src/v2-pools/mappings/pool/v2-pool-sync";
import { HandlerContextCustomMock, PoolMock, TokenMock } from "../../../mocks";

describe("V2PoolSyncHandler", () => {
  let context: HandlerContext;
  let poolSetters: sinon.SinonStubbedInstance<PoolSetters>;
  let eventTimestamp = BigInt(Math.floor(Date.now() / 1000));

  beforeEach(() => {
    context = HandlerContextCustomMock();
    poolSetters = sinon.createStubInstance(PoolSetters);
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

    assert(poolSetters.setPoolDailyDataTVL.calledWith(eventTimestamp, updatedPool));
  });
});
