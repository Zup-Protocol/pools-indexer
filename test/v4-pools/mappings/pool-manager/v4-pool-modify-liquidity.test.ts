import assert from "assert";
import { BigDecimal, HandlerContext } from "generated";
import { IndexerNetwork } from "../../../../src/common/enums/indexer-network";
import { PoolSetters } from "../../../../src/common/pool-setters";
import { formatFromTokenAmount } from "../../../../src/common/token-commons";
import { getAmount0, getAmount1 } from "../../../../src/v4-pools/common/liquidity-amounts";
import { handleV4PoolModifyLiquidity } from "../../../../src/v4-pools/mappings/pool-manager/v4-pool-modify-liquidity";
import { HandlerContextCustomMock, PoolMock, TokenMock, V4PoolDataMock } from "../../../mocks";

describe("V4PoolModifyLiquidity", () => {
  let context: HandlerContext;
  let network: IndexerNetwork;
  let eventTimestamp = BigInt(Date.now());

  beforeEach(() => {
    context = HandlerContextCustomMock();
    network = IndexerNetwork.ETHEREUM;
  });

  it(`When calling the handler adding liquidity, it should correctly modify the
    token0 and token1 amount in the pool based on the pool and event
    params`, async () => {
    let pool = new PoolMock();
    let v4Pool = new V4PoolDataMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let totalValueLockedToken0Before = BigDecimal("20.387520919667882736");
    let totalValueLockedToken1Before = BigDecimal("52639.292441");

    token0.decimals = 18;
    token1.decimals = 6;
    pool.totalValueLockedToken0 = totalValueLockedToken0Before;
    pool.totalValueLockedToken1 = totalValueLockedToken1Before;
    v4Pool.id = pool.id;
    v4Pool.tick = BigInt("-197765");
    v4Pool.sqrtPriceX96 = BigInt("4024415889252221097743020");

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    let liquidityDelta = BigInt("1169660501840625341");
    let tickLower = -197770;
    let tickUpper = -197760;
    let token0totalAmountAdded = formatFromTokenAmount(
      getAmount0(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96),
      token0
    );
    let token1totalAmountAdded = formatFromTokenAmount(
      getAmount1(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96),
      token1
    );
    let eventTimestamp = BigInt(Date.now());

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      new PoolSetters(context, network)
    );

    let poolAfter = await context.Pool.getOrThrow(pool.id);

    assert.equal(
      poolAfter.totalValueLockedToken0.toString(),
      totalValueLockedToken0Before.plus(token0totalAmountAdded).toString()
    );

    assert.equal(
      poolAfter.totalValueLockedToken1.toString(),
      totalValueLockedToken1Before.plus(token1totalAmountAdded).toString()
    );
  });

  it(`When calling the handler removing liquidity, it should correctly modify the
      token0 and token1 amount in the pool based on the pool and event
      params`, async () => {
    let pool = new PoolMock();
    let v4Pool = new V4PoolDataMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let totalValueLockedToken0Before = BigDecimal("20.387520919667882736");
    let totalValueLockedToken1Before = BigDecimal("52639.292441");

    token0 = {
      ...token0,
      decimals: 18,
    };
    token1 = {
      ...token1,
      decimals: 6,
    };

    v4Pool = {
      ...v4Pool,
      id: pool.id,
      tick: BigInt("-197914"),
      sqrtPriceX96: BigInt("3994389100371270269195663"),
    };

    pool = {
      ...pool,
      totalValueLockedToken0: totalValueLockedToken0Before,
      totalValueLockedToken1: totalValueLockedToken1Before,
    };

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    let tickLower = -197920;
    let tickUpper = -197910;
    let liquidityDelta = BigInt("-2739387638594388447");

    let token0totalAmountRemoved = formatFromTokenAmount(
      getAmount0(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96),
      token0
    );
    let token1totalAmountRemoved = formatFromTokenAmount(
      getAmount1(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96),
      token1
    );

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      new PoolSetters(context, network)
    );

    let poolAfter = await context.Pool.getOrThrow(pool.id);

    assert.equal(
      poolAfter.totalValueLockedToken0.toString(),
      totalValueLockedToken0Before.plus(token0totalAmountRemoved).toString() // using plus because the value is negative
    );
    assert.equal(
      poolAfter.totalValueLockedToken1.toString(),
      totalValueLockedToken1Before.plus(token1totalAmountRemoved).toString() // using plus because the value is negative
    );
  });

  it(`When calling the handler adding liquidity, it should correctly modify the
      total value locked in usd based on the token amounts and
      token prices `, async () => {
    let token0UsdPrice = BigDecimal("1200.72");
    let token1UsdPrice = BigDecimal("1.0001");
    let v4Pool = new V4PoolDataMock();

    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let totalValueLockedToken0Before = BigDecimal("20.387520919667882736");
    let totalValueLockedToken1Before = BigDecimal("52639.292441");

    token0 = {
      ...token0,
      decimals: 18,
      usdPrice: token0UsdPrice,
    };

    token1 = {
      ...token1,
      decimals: 6,
      usdPrice: token1UsdPrice,
    };

    v4Pool = {
      ...v4Pool,
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    pool = {
      ...pool,
      totalValueLockedToken0: totalValueLockedToken0Before,
      totalValueLockedToken1: totalValueLockedToken1Before,
    };

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    let liquidityDelta = BigInt("1169660501840625341");
    let tickLower = -197770;
    let tickUpper = -197760;

    let token0totalAmountAdded = formatFromTokenAmount(
      getAmount0(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96),
      token0
    );

    let token1totalAmountAdded = formatFromTokenAmount(
      getAmount1(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96),
      token1
    );

    let usdAmountAdded = token0totalAmountAdded
      .times(token0.usdPrice)
      .plus(token1totalAmountAdded.times(token1.usdPrice));

    let usdAmountbefore = totalValueLockedToken0Before
      .times(token0.usdPrice)
      .plus(totalValueLockedToken1Before.times(token1.usdPrice));

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      new PoolSetters(context, network)
    );

    const poolAfter = await context.Pool.getOrThrow(pool.id);

    assert.equal(poolAfter.totalValueLockedUSD.toString(), usdAmountbefore.plus(usdAmountAdded).toString());
  });

  it(`When calling the handler removing liquidity, it should correctly modify the
      total value locked in usd based on the token amounts and
      token prices `, async () => {
    let token0UsdPrice = BigDecimal("1200.72");
    let token1UsdPrice = BigDecimal("1.0001");

    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let totalValueLockedToken0Before = BigDecimal("20.387520919667882736");
    let totalValueLockedToken1Before = BigDecimal("52639.292441");
    let v4Pool = new V4PoolDataMock();

    token0 = {
      ...token0,
      decimals: 18,
      usdPrice: token0UsdPrice,
    };

    token1 = {
      ...token1,
      decimals: 6,
      usdPrice: token1UsdPrice,
    };

    v4Pool = {
      ...v4Pool,
      id: pool.id,
      tick: BigInt("-197914"),
      sqrtPriceX96: BigInt("3994389100371270269195663"),
    };

    pool = {
      ...pool,
      totalValueLockedToken0: totalValueLockedToken0Before,
      totalValueLockedToken1: totalValueLockedToken1Before,
    };

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    let tickLower = -197920;
    let tickUpper = -197910;
    let liquidityDelta = BigInt("-2739387638594388447");

    let token0totalAmountRemoved = formatFromTokenAmount(
      getAmount0(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96),
      token0
    );
    let token1totalAmountRemoved = formatFromTokenAmount(
      getAmount1(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96),
      token1
    );

    let usdAmountRemoved = token0totalAmountRemoved
      .times(token0.usdPrice)
      .plus(token1totalAmountRemoved.times(token1.usdPrice));

    let usdAmountbefore = totalValueLockedToken0Before
      .times(token0.usdPrice)
      .plus(totalValueLockedToken1Before.times(token1.usdPrice));

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      new PoolSetters(context, network)
    );

    const poolAfter = await context.Pool.getOrThrow(pool.id);

    assert.equal(poolAfter.totalValueLockedUSD.toString(), usdAmountbefore.plus(usdAmountRemoved).toString()); // using plus because the value is negative
  });

  it("When adding liquidity, it should correctly modify the tokens total amount pooled", async () => {
    let token0Id = "0x0000000000000000000000000000000000000001";
    let token1Id = "0x0000000000000000000000000000000000000002";
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let totalAmountPooledToken0Before = BigDecimal("20.387520919667882736");
    let totalAmountPooledToken1Before = BigDecimal("52639.292441");
    let v4PoolData = new V4PoolDataMock();

    token0 = {
      ...token0,
      id: token0Id,
      decimals: 18,
      totalTokenPooledAmount: totalAmountPooledToken0Before,
    };

    token1 = {
      ...token1,
      id: token1Id,
      decimals: 6,
      totalTokenPooledAmount: totalAmountPooledToken1Before,
    };

    v4PoolData = {
      ...v4PoolData,
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    context.Pool.set(pool);
    context.V4PoolData.set(v4PoolData);
    context.Token.set(token0);
    context.Token.set(token1);

    let liquidityDelta = BigInt("1169660501840625341");
    let tickLower = -197770;
    let tickUpper = -197760;
    let token0totalAmountAdded = formatFromTokenAmount(
      getAmount0(tickLower, tickUpper, v4PoolData.tick, liquidityDelta, v4PoolData.sqrtPriceX96),
      token0
    );

    let token1totalAmountAdded = formatFromTokenAmount(
      getAmount1(tickLower, tickUpper, v4PoolData.tick, liquidityDelta, v4PoolData.sqrtPriceX96),
      token1
    );

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      new PoolSetters(context, network)
    );

    const toke0After = await context.Token.getOrThrow(token0.id);
    const token1After = await context.Token.getOrThrow(token1.id);

    assert.equal(
      toke0After.totalTokenPooledAmount.toString(),
      totalAmountPooledToken0Before.plus(token0totalAmountAdded).toString()
    );

    assert.equal(
      token1After.totalTokenPooledAmount.toString(),
      totalAmountPooledToken1Before.plus(token1totalAmountAdded).toString()
    );
  });

  it("When removing liquidity, it should correctly modify the tokens total amount pooled", async () => {
    let token0Id = "0x0000000000000000000000000000000000000001";
    let token1Id = "0x0000000000000000000000000000000000000002";
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let totalAmountPooledToken0Before = BigDecimal("20.387520919667882736");
    let totalAmountPooledToken1Before = BigDecimal("52639.292441");
    let v4Pool = new V4PoolDataMock();

    token0 = {
      ...token0,
      id: token0Id,
      decimals: 18,
      totalTokenPooledAmount: totalAmountPooledToken0Before,
    };

    token1 = {
      ...token1,
      id: token1Id,
      decimals: 6,
      totalTokenPooledAmount: totalAmountPooledToken1Before,
    };

    v4Pool = {
      ...v4Pool,
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    let tickLower = -197920;
    let tickUpper = -197910;
    let liquidityDelta = BigInt("-2739387638594388447");

    let token0totalAmountRemoved = formatFromTokenAmount(
      getAmount0(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96),
      token0
    );
    let token1totalAmountRemoved = formatFromTokenAmount(
      getAmount1(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96),
      token1
    );

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      new PoolSetters(context, network)
    );

    const newToken0 = await context.Token.getOrThrow(token0.id);
    const newToken1 = await context.Token.getOrThrow(token1.id);

    assert.equal(
      newToken0.totalTokenPooledAmount.toString(),
      totalAmountPooledToken0Before.plus(token0totalAmountRemoved).toString()
    ); // using plus because the value is negative

    assert.equal(
      newToken1.totalTokenPooledAmount.toString(),
      totalAmountPooledToken1Before.plus(token1totalAmountRemoved).toString()
    ); // using plus because the value is negative
  });

  it("When removing liquidity, it should correctly modify the tokens total amount pooled in usd", async () => {
    let token0Id = "0x0000000000000000000000000000000000000001";
    let token1Id = "0x0000000000000000000000000000000000000002";
    let token0UsdPrice = BigDecimal("1200.72");
    let token1UsdPrice = BigDecimal("1.0001");

    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let totalAmountPooledToken0Before = BigDecimal("20.387520919667882736");
    let totalAmountPooledToken1Before = BigDecimal("52639.292441");
    let totalUSDPooledToken0Before = totalAmountPooledToken0Before.times(token0UsdPrice);
    let totalUSDPooledToken1Before = totalAmountPooledToken1Before.times(token1UsdPrice);
    let v4Pool = new V4PoolDataMock();

    token0 = {
      ...token0,
      id: token0Id,
      decimals: 18,
      totalTokenPooledAmount: totalAmountPooledToken0Before,
      totalValuePooledUsd: totalUSDPooledToken0Before,
      usdPrice: token0UsdPrice,
    };

    token1 = {
      ...token1,
      id: token1Id,
      decimals: 6,
      totalTokenPooledAmount: totalAmountPooledToken1Before,
      totalValuePooledUsd: totalUSDPooledToken1Before,
      usdPrice: token1UsdPrice,
    };

    v4Pool = {
      ...v4Pool,
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    let tickLower = -197920;
    let tickUpper = -197910;
    let liquidityDelta = BigInt("-2739387638594388447");

    let token0totalAmountRemoved = formatFromTokenAmount(
      getAmount0(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96),
      token0
    );
    let token1totalAmountRemoved = formatFromTokenAmount(
      getAmount1(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96),
      token1
    );

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      new PoolSetters(context, network)
    );

    const token0After = await context.Token.getOrThrow(token0.id);
    const token1After = await context.Token.getOrThrow(token1.id);

    assert.equal(
      token0After.totalValuePooledUsd.toString(),
      totalUSDPooledToken0Before.plus(token0UsdPrice.times(token0totalAmountRemoved)).toString()
    ); // using plus because the value is negative

    assert.equal(
      token1After.totalValuePooledUsd.toString(),
      totalUSDPooledToken1Before.plus(token1UsdPrice.times(token1totalAmountRemoved)).toString()
    ); // using plus because the value is negative
  });

  it("When adding liquidity, it should correctly modify the tokens total amount pooled in usd", async () => {
    let token0Id = "0x0000000000000000000000000000000000000001";
    let token1Id = "0x0000000000000000000000000000000000000002";
    let token0UsdPrice = BigDecimal("1200.72");
    let token1UsdPrice = BigDecimal("1.0001");
    let v4Pool = new V4PoolDataMock();
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let totalAmountPooledToken0Before = BigDecimal("20.387520919667882736");
    let totalAmountPooledToken1Before = BigDecimal("52639.292441");
    let totalUSDPooledToken0Before = totalAmountPooledToken0Before.times(token0UsdPrice);
    let totalUSDPooledToken1Before = totalAmountPooledToken1Before.times(token1UsdPrice);

    token0 = {
      ...token0,
      id: token0Id,
      totalTokenPooledAmount: totalAmountPooledToken0Before,
      totalValuePooledUsd: totalUSDPooledToken0Before,
      usdPrice: token0UsdPrice,
      decimals: 18,
    };

    token1 = {
      ...token1,
      id: token1Id,
      decimals: 6,
      usdPrice: token1UsdPrice,
      totalTokenPooledAmount: totalAmountPooledToken1Before,
      totalValuePooledUsd: totalUSDPooledToken1Before,
    };

    v4Pool = {
      ...v4Pool,
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V4PoolData.set(v4Pool);

    let liquidityDelta = BigInt("1169660501840625341");
    let tickLower = -197770;
    let tickUpper = -197760;

    let token0totalAmountAdded = formatFromTokenAmount(
      getAmount0(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96),
      token0
    );
    let token1totalAmountAdded = formatFromTokenAmount(
      getAmount1(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96),
      token1
    );

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      new PoolSetters(context, network)
    );

    const token0After = await context.Token.getOrThrow(token0.id);
    const token1After = await context.Token.getOrThrow(token1.id);

    assert.equal(
      token0After.totalValuePooledUsd.toString(),
      totalUSDPooledToken0Before.plus(token0UsdPrice.times(token0totalAmountAdded)).toString()
    );
    assert.equal(
      token1After.totalValuePooledUsd.toString(),
      totalUSDPooledToken1Before.plus(token1UsdPrice.times(token1totalAmountAdded)).toString()
    );
  });
});
