import assert from "assert";
import { BigDecimal, handlerContext, Pool, Token } from "generated";
import sinon from "sinon";
import { defaultDeFiPoolData, ZERO_ADDRESS } from "../../../../src/common/constants";
import { DeFiPoolDataSetters } from "../../../../src/common/defi-pool-data-setters";
import { IndexerNetwork } from "../../../../src/common/enums/indexer-network";
import { PoolSetters } from "../../../../src/common/pool-setters";
import { formatFromTokenAmount } from "../../../../src/common/token-commons";
import { getAmount0, getAmount1 } from "../../../../src/v4-pools/common/liquidity-amounts";
import { handleV4PoolModifyLiquidity } from "../../../../src/v4-pools/mappings/pool-manager/v4-pool-modify-liquidity";
import { handlerContextCustomMock, PoolMock, TokenMock, V4PoolDataMock } from "../../../mocks";

describe("V4PoolModifyLiquidity", () => {
  let context: handlerContext;
  let network: IndexerNetwork;
  let eventTimestamp = BigInt(Math.floor(Date.now() / 1000));
  let poolSetters: sinon.SinonStubbedInstance<PoolSetters>;
  let defiPoolDataSetters: sinon.SinonStubbedInstance<DeFiPoolDataSetters>;

  beforeEach(() => {
    context = handlerContextCustomMock();
    network = IndexerNetwork.ETHEREUM;

    poolSetters = sinon.createStubInstance(PoolSetters);
    defiPoolDataSetters = sinon.createStubInstance(DeFiPoolDataSetters);
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
      new PoolSetters(context, network),
      new DeFiPoolDataSetters(context)
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
      new PoolSetters(context, network),
      new DeFiPoolDataSetters(context)
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
      new PoolSetters(context, network),
      new DeFiPoolDataSetters(context)
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
      new PoolSetters(context, network),
      new DeFiPoolDataSetters(context)
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
      new PoolSetters(context, network),
      new DeFiPoolDataSetters(context)
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
      new PoolSetters(context, network),
      new DeFiPoolDataSetters(context)
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
      new PoolSetters(context, network),
      new DeFiPoolDataSetters(context)
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
      new PoolSetters(context, network),
      new DeFiPoolDataSetters(context)
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

  it(`should add up the current pool liquidity volume USD by
    the amount0 and amount1 multiplied by the tokens usd price
    when removing liquidity`, async () => {
    let pool: Pool = {
      ...new PoolMock(),
    };

    let v4Pool = {
      ...new V4PoolDataMock(),
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    let token0: Token = {
      ...new TokenMock(),
      id: "0x1",
      usdPrice: BigDecimal("22.72"),
    };

    let token1: Token = {
      ...new TokenMock(),
      id: "0x2",
      usdPrice: BigDecimal("3.0001"),
    };

    let liquidityDelta = BigInt("-2739387638594388447");
    let tickLower = -197770;
    let tickUpper = -197760;

    let token0totalAmountRemoved = formatFromTokenAmount(
      getAmount0(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96),
      token0
    );
    let token1totalAmountRemoved = formatFromTokenAmount(
      getAmount1(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96),
      token1
    );

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const poolAfter = await context.Pool.getOrThrow(pool.id);

    assert.deepEqual(
      poolAfter.liquidityVolumeUSD.toString(),
      pool.liquidityVolumeUSD
        .plus(
          token0totalAmountRemoved
            .abs()
            .times(token0.usdPrice)
            .plus(token1totalAmountRemoved.abs().times(token1.usdPrice))
        )
        .toString()
    );
  });

  it(`should add up the current pool liquidity volume token0
      and token1 by the amount0 and amount1 removed
      when removing liquidity`, async () => {
    let pool: Pool = {
      ...new PoolMock(),
    };

    let v4Pool = {
      ...new V4PoolDataMock(),
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    let token0: Token = {
      ...new TokenMock(),
      id: "0x1",
    };

    let token1: Token = {
      ...new TokenMock(),
      id: "0x2",
    };

    let liquidityDelta = BigInt("-2739387638594388447");
    let tickLower = -197770;
    let tickUpper = -197760;

    let token0totalAmountRemoved = formatFromTokenAmount(
      getAmount0(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96),
      token0
    );
    let token1totalAmountRemoved = formatFromTokenAmount(
      getAmount1(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96),
      token1
    );

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const poolAfter = await context.Pool.getOrThrow(pool.id);

    assert.deepEqual(
      poolAfter.liquidityVolumeToken0.toString(),
      pool.liquidityVolumeToken0.plus(token0totalAmountRemoved.abs()).toString()
    );

    assert.deepEqual(
      poolAfter.liquidityVolumeToken1.toString(),
      pool.liquidityVolumeToken1.plus(token1totalAmountRemoved.abs()).toString()
    );
  });

  it(`should add up the current pool liquidity volume USD by
    the amount0 and amount1 multiplied by the tokens usd price
    when adding liquidity`, async () => {
    let pool: Pool = {
      ...new PoolMock(),
    };

    let v4Pool = {
      ...new V4PoolDataMock(),
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    let token0: Token = {
      ...new TokenMock(),
      id: "0x1",
      usdPrice: BigDecimal("1200.32"),
    };

    let token1: Token = {
      ...new TokenMock(),
      id: "0x2",
      usdPrice: BigDecimal("1200.32"),
    };

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

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const poolAfter = await context.Pool.getOrThrow(pool.id);

    assert.deepEqual(
      poolAfter.liquidityVolumeUSD.toString(),
      pool.liquidityVolumeUSD
        .plus(token0totalAmountAdded.times(token0.usdPrice).plus(token1totalAmountAdded.times(token1.usdPrice)))
        .toString()
    );
  });

  it(`should add up the current pool liquidity volume token0
      and token1 by the amount0 and amount1 added
      when adding liquidity`, async () => {
    let pool: Pool = {
      ...new PoolMock(),
    };

    let v4Pool = {
      ...new V4PoolDataMock(),
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    let token0: Token = {
      ...new TokenMock(),
      id: "0x1",
    };

    let token1: Token = {
      ...new TokenMock(),
      id: "0x2",
    };

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

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const poolAfter = await context.Pool.getOrThrow(pool.id);

    assert.deepEqual(
      poolAfter.liquidityVolumeToken0.toString(),
      pool.liquidityVolumeToken0.plus(token0totalAmountAdded.abs()).toString()
    );

    assert.deepEqual(
      poolAfter.liquidityVolumeToken1.toString(),
      pool.liquidityVolumeToken1.plus(token1totalAmountAdded.abs()).toString()
    );
  });

  it(`should add up the token0 and token1 token liquidity volume
      by the amounts added when adding liquidity`, async () => {
    let pool: Pool = {
      ...new PoolMock(),
    };

    let v4Pool = {
      ...new V4PoolDataMock(),
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    let token0: Token = {
      ...new TokenMock(),
      id: "0x1",
      tokenLiquidityVolume: BigDecimal("11111111"),
    };

    let token1: Token = {
      ...new TokenMock(),
      id: "0x2",
      tokenLiquidityVolume: BigDecimal("2619216281921"),
    };

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

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const token0After = await context.Token.getOrThrow(token0.id);
    const token1After = await context.Token.getOrThrow(token1.id);

    assert.deepEqual(
      token0After.tokenLiquidityVolume.toString(),
      token0.tokenLiquidityVolume.plus(token0totalAmountAdded.abs()).toString()
    );

    assert.deepEqual(
      token1After.tokenLiquidityVolume.toString(),
      token1.tokenLiquidityVolume.plus(token1totalAmountAdded.abs()).toString()
    );
  });

  it(`should add up the token0 and token1 token liquidity volume
      by the amounts removed when removing liquidity`, async () => {
    let pool: Pool = {
      ...new PoolMock(),
    };

    let v4Pool = {
      ...new V4PoolDataMock(),
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    let token0: Token = {
      ...new TokenMock(),
      id: "0x1",
      tokenLiquidityVolume: BigDecimal("11111111"),
    };

    let token1: Token = {
      ...new TokenMock(),
      id: "0x2",
      tokenLiquidityVolume: BigDecimal("2619216281921"),
    };

    let liquidityDelta = BigInt("-2739387638594388447");
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

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const token0After = await context.Token.getOrThrow(token0.id);
    const token1After = await context.Token.getOrThrow(token1.id);

    assert.deepEqual(
      token0After.tokenLiquidityVolume.toString(),
      token0.tokenLiquidityVolume.plus(token0totalAmountAdded.abs()).toString()
    );

    assert.deepEqual(
      token1After.tokenLiquidityVolume.toString(),
      token1.tokenLiquidityVolume.plus(token1totalAmountAdded.abs()).toString()
    );
  });

  it(`should add up the token0 and token1 liquidity volume usd
      by the amounts removed times the tokens usd price
      when removing liquidity`, async () => {
    let pool: Pool = {
      ...new PoolMock(),
    };

    let v4Pool = {
      ...new V4PoolDataMock(),
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    let token0: Token = {
      ...new TokenMock(),
      id: "0x1",
      tokenLiquidityVolume: BigDecimal("11111111"),
      liquidityVolumeUSD: BigDecimal("20197290179201"),
      usdPrice: BigDecimal("111"),
    };

    let token1: Token = {
      ...new TokenMock(),
      id: "0x2",
      tokenLiquidityVolume: BigDecimal("2619216281921"),
      liquidityVolumeUSD: BigDecimal("11111"),
      usdPrice: BigDecimal("3132"),
    };

    let liquidityDelta = BigInt("-2739387638594388447");
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

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const token0After = await context.Token.getOrThrow(token0.id);
    const token1After = await context.Token.getOrThrow(token1.id);

    assert.deepEqual(
      token0After.liquidityVolumeUSD.toString(),
      token0.liquidityVolumeUSD.plus(token0totalAmountAdded.abs().times(token0.usdPrice)).toString()
    );

    assert.deepEqual(
      token1After.liquidityVolumeUSD.toString(),
      token1.liquidityVolumeUSD.plus(token1totalAmountAdded.abs().times(token1.usdPrice)).toString()
    );
  });

  it(`should add up the token0 and token1 liquidity volume usd
      by the amounts added times the tokens usd price
      when added liquidity`, async () => {
    let pool: Pool = {
      ...new PoolMock(),
    };

    let v4Pool = {
      ...new V4PoolDataMock(),
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    let token0: Token = {
      ...new TokenMock(),
      id: "0x1",
      usdPrice: BigDecimal("3132"),
      tokenLiquidityVolume: BigDecimal("11111111"),
      liquidityVolumeUSD: BigDecimal("20197290179201"),
    };

    let token1: Token = {
      ...new TokenMock(),
      id: "0x2",
      usdPrice: BigDecimal("1212"),
      tokenLiquidityVolume: BigDecimal("2619216281921"),
      liquidityVolumeUSD: BigDecimal("11111"),
    };

    let liquidityDelta = BigInt("2739387638594388447");
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

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const token0After = await context.Token.getOrThrow(token0.id);
    const token1After = await context.Token.getOrThrow(token1.id);

    assert.deepEqual(
      token0After.liquidityVolumeUSD.toString(),
      token0.liquidityVolumeUSD.plus(token0totalAmountAdded.abs().times(token0.usdPrice)).toString()
    );

    assert.deepEqual(
      token1After.liquidityVolumeUSD.toString(),
      token1.liquidityVolumeUSD.plus(token1totalAmountAdded.abs().times(token1.usdPrice)).toString()
    );
  });

  it(`should select the current pool as token0 and token1 most liquid pool,
    if there are no most liquid pool saved`, async () => {
    let pool: Pool = {
      ...new PoolMock(),
    };

    let v4Pool = {
      ...new V4PoolDataMock(),
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    let token0: Token = {
      ...new TokenMock(),
      id: "0x1",
      usdPrice: BigDecimal("3132"),
      tokenLiquidityVolume: BigDecimal("11111111"),
      liquidityVolumeUSD: BigDecimal("20197290179201"),
      mostLiquidPool_id: ZERO_ADDRESS,
    };

    let token1: Token = {
      ...new TokenMock(),
      id: "0x2",
      usdPrice: BigDecimal("1212"),
      tokenLiquidityVolume: BigDecimal("2619216281921"),
      liquidityVolumeUSD: BigDecimal("11111"),
      mostLiquidPool_id: ZERO_ADDRESS,
    };

    let liquidityDelta = BigInt("2739387638594388447");
    let tickLower = -197770;
    let tickUpper = -197760;

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const token0After = await context.Token.getOrThrow(token0.id);
    const token1After = await context.Token.getOrThrow(token1.id);

    assert.deepEqual(token0After.mostLiquidPool_id, pool.id);
    assert.deepEqual(token1After.mostLiquidPool_id, pool.id);
  });

  it(`should select the current pool as token0 most liquid pool, if the
      pool has more token0 liquidity than the previous one`, async () => {
    const token0Id = "0x1";
    let previousMoreLiquidPool: Pool = {
      ...new PoolMock(),
      id: "MOST LIQUID POOL _OLD",
      totalValueLockedToken0: BigDecimal("11"),
      token0_id: token0Id,
    };

    let token0: Token = {
      ...new TokenMock(),
      id: "0x1",
      usdPrice: BigDecimal("3132"),
      tokenLiquidityVolume: BigDecimal("11111111"),
      liquidityVolumeUSD: BigDecimal("20197290179201"),
      mostLiquidPool_id: previousMoreLiquidPool.id,
    };

    let pool: Pool = {
      ...new PoolMock(),
      id: "MOST LIQUID POOL NEW",
      totalValueLockedToken0: BigDecimal("1212617825178251782517825172518571852817528172518"),
      token0_id: token0.id,
    };

    let v4Pool = {
      ...new V4PoolDataMock(),
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    let token1: Token = {
      ...new TokenMock(),
      id: "0x2",
      usdPrice: BigDecimal("1212"),
      tokenLiquidityVolume: BigDecimal("2619216281921"),
      liquidityVolumeUSD: BigDecimal("11111"),
    };

    let liquidityDelta = BigInt("2739387638594388447");
    let tickLower = -197770;
    let tickUpper = -197760;

    context.Pool.set(pool);
    context.Pool.set(previousMoreLiquidPool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const token0After = await context.Token.getOrThrow(token0.id);

    assert.deepEqual(token0After.mostLiquidPool_id, pool.id);
  });

  it(`should select the current pool as token1 most liquid pool, if the
      pool has more token1 liquidity than the previous one`, async () => {
    const token1Id = "0x22";
    let previousMoreLiquidPool: Pool = {
      ...new PoolMock(),
      id: "MOST LIQUID POOL _OLD",
      totalValueLockedToken1: BigDecimal("11"),
      token1_id: token1Id,
    };

    let token0: Token = {
      ...new TokenMock(),
      id: "0x1",
      usdPrice: BigDecimal("3132"),
      tokenLiquidityVolume: BigDecimal("11111111"),
      liquidityVolumeUSD: BigDecimal("20197290179201"),
    };

    let pool: Pool = {
      ...new PoolMock(),
      id: "MOST LIQUID POOL NEW",
      totalValueLockedToken1: BigDecimal("1212617825178251782517825172518571852817528172518"),
      token0_id: token0.id,
      token1_id: token1Id,
    };

    let v4Pool = {
      ...new V4PoolDataMock(),
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    let token1: Token = {
      ...new TokenMock(),
      id: token1Id,
      usdPrice: BigDecimal("1212"),
      tokenLiquidityVolume: BigDecimal("2619216281921"),
      liquidityVolumeUSD: BigDecimal("11111"),
      mostLiquidPool_id: previousMoreLiquidPool.id,
    };

    let liquidityDelta = BigInt("2739387638594388447");
    let tickLower = -197770;
    let tickUpper = -197760;

    context.Pool.set(pool);
    context.Pool.set(previousMoreLiquidPool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const token1After = await context.Token.getOrThrow(token1.id);

    assert.deepEqual(token1After.mostLiquidPool_id, pool.id);
  });

  it(`should select the current pool as token1 most liquid pool, if the
      pool currentlt has less token1 liquidity than the previous one
      but after the add liqudity it will have more`, async () => {
    const token1Id = "0x22";
    let previousMoreLiquidPool: Pool = {
      ...new PoolMock(),
      id: "MOST LIQUID POOL _OLD",
      totalValueLockedToken1: BigDecimal("0.0000000000001"),
      token1_id: token1Id,
    };

    let token0: Token = {
      ...new TokenMock(),
      id: "0x1",
      usdPrice: BigDecimal("3132"),
      tokenLiquidityVolume: BigDecimal("11111111"),
      liquidityVolumeUSD: BigDecimal("20197290179201"),
    };

    let pool: Pool = {
      ...new PoolMock(),
      id: "MOST LIQUID POOL NEW",
      totalValueLockedToken1: BigDecimal("0"),
      token0_id: token0.id,
      token1_id: token1Id,
    };

    let v4Pool = {
      ...new V4PoolDataMock(),
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    let token1: Token = {
      ...new TokenMock(),
      id: token1Id,
      usdPrice: BigDecimal("1212"),
      tokenLiquidityVolume: BigDecimal("2619216281921"),
      liquidityVolumeUSD: BigDecimal("11111"),
      mostLiquidPool_id: previousMoreLiquidPool.id,
    };

    let liquidityDelta = BigInt("1169660501840625341");
    let tickLower = -197770;
    let tickUpper = -197760;

    context.Pool.set(pool);
    context.Pool.set(previousMoreLiquidPool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const token1After = await context.Token.getOrThrow(token1.id);

    assert.deepEqual(token1After.mostLiquidPool_id, pool.id);
  });

  it(`should select the current pool as token0 most liquid pool, if the
      pool currently has less token0 liquidity than the previous one
      but after the add liqudity it will have more`, async () => {
    const token0Id = "0x22";
    let previousMoreLiquidPool: Pool = {
      ...new PoolMock(),
      id: "MOST LIQUID POOL _OLD",
      totalValueLockedToken0: BigDecimal("0.0000000000001"),
      token0_id: token0Id,
    };

    let token0: Token = {
      ...new TokenMock(),
      id: token0Id,
      usdPrice: BigDecimal("3132"),
      tokenLiquidityVolume: BigDecimal("11111111"),
      liquidityVolumeUSD: BigDecimal("20197290179201"),
      mostLiquidPool_id: previousMoreLiquidPool.id,
    };

    let token1: Token = {
      ...new TokenMock(),
      id: "0x11111",
      usdPrice: BigDecimal("1212"),
      tokenLiquidityVolume: BigDecimal("2619216281921"),
      liquidityVolumeUSD: BigDecimal("11111"),
    };

    let pool: Pool = {
      ...new PoolMock(),
      id: "MOST LIQUID POOL NEW",
      totalValueLockedToken1: BigDecimal("0"),
      token0_id: token0Id,
      token1_id: token1.id,
    };

    let v4Pool = {
      ...new V4PoolDataMock(),
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    let liquidityDelta = BigInt("1169660501840625341");
    let tickLower = -197770;
    let tickUpper = -197760;

    context.Pool.set(pool);
    context.Pool.set(previousMoreLiquidPool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const token0After = await context.Token.getOrThrow(token0.id);

    assert.deepEqual(token0After.mostLiquidPool_id, pool.id);
  });

  it(`should not select the current pool as token1 most liquid pool, if the
      pool has less token1 liquidity than the previous one`, async () => {
    const token1Id = "0x22";
    let previousMoreLiquidPool: Pool = {
      ...new PoolMock(),
      id: "MOST LIQUID POOL _OLD",
      totalValueLockedToken1: BigDecimal("12618261892618621986291"),
      token1_id: token1Id,
    };

    let token0: Token = {
      ...new TokenMock(),
      id: "0x1",
      usdPrice: BigDecimal("3132"),
      tokenLiquidityVolume: BigDecimal("11111111"),
      liquidityVolumeUSD: BigDecimal("20197290179201"),
    };

    let pool: Pool = {
      ...new PoolMock(),
      id: "NOT MOST LIQUID POOL",
      totalValueLockedToken1: BigDecimal("11"),
      token0_id: token0.id,
      token1_id: token1Id,
    };

    let v4Pool = {
      ...new V4PoolDataMock(),
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    let token1: Token = {
      ...new TokenMock(),
      id: token1Id,
      usdPrice: BigDecimal("1212"),
      tokenLiquidityVolume: BigDecimal("2619216281921"),
      liquidityVolumeUSD: BigDecimal("11111"),
      mostLiquidPool_id: previousMoreLiquidPool.id,
    };

    let liquidityDelta = BigInt("2739387638594388447");
    let tickLower = -197770;
    let tickUpper = -197760;

    context.Pool.set(pool);
    context.Pool.set(previousMoreLiquidPool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const token1After = await context.Token.getOrThrow(token1.id);

    assert.deepEqual(token1After.mostLiquidPool_id, previousMoreLiquidPool.id);
  });

  it(`should not select the current pool as token0 most liquid pool, if the
      pool has less token0 liquidity than the previous one`, async () => {
    const token0Id = "0x1";
    let previousMoreLiquidPool: Pool = {
      ...new PoolMock(),
      id: "MOST LIQUID POOL _OLD",
      totalValueLockedToken0: BigDecimal("217291762901628162162916296291826191"),
      token0_id: token0Id,
    };

    let token0: Token = {
      ...new TokenMock(),
      id: "0x1",
      usdPrice: BigDecimal("3132"),
      tokenLiquidityVolume: BigDecimal("11111111"),
      liquidityVolumeUSD: BigDecimal("20197290179201"),
      mostLiquidPool_id: previousMoreLiquidPool.id,
    };

    let pool: Pool = {
      ...new PoolMock(),
      id: "NOT MOST LIQUID POOL",
      totalValueLockedToken0: BigDecimal("13"),
      token0_id: token0.id,
    };

    let v4Pool = {
      ...new V4PoolDataMock(),
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    let token1: Token = {
      ...new TokenMock(),
      id: "0x2",
      usdPrice: BigDecimal("1212"),
      tokenLiquidityVolume: BigDecimal("2619216281921"),
      liquidityVolumeUSD: BigDecimal("11111"),
    };

    let liquidityDelta = BigInt("2739387638594388447");
    let tickLower = -197770;
    let tickUpper = -197760;

    context.Pool.set(pool);
    context.Pool.set(previousMoreLiquidPool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const token0After = await context.Token.getOrThrow(token0.id);

    assert.deepEqual(token0After.mostLiquidPool_id, previousMoreLiquidPool.id);
  });

  it(`should call the defi pool setters to set interval liquidity data
    if the pool has more than 0 of swap volume usd`, async () => {
    let pool: Pool = {
      ...new PoolMock(),
      swapVolumeUSD: BigDecimal("100"),
    };

    let v4Pool = {
      ...new V4PoolDataMock(),
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    let token0: Token = {
      ...new TokenMock(),
      id: "0x1",
      usdPrice: BigDecimal("3132"),
      tokenLiquidityVolume: BigDecimal("11111111"),
      liquidityVolumeUSD: BigDecimal("20197290179201"),
    };

    let token1: Token = {
      ...new TokenMock(),
      id: "0x2",
      usdPrice: BigDecimal("1212"),
      tokenLiquidityVolume: BigDecimal("2619216281921"),
      liquidityVolumeUSD: BigDecimal("11111"),
    };

    let liquidityDelta = BigInt("2739387638594388447");
    let tickLower = -197770;
    let tickUpper = -197760;

    let token0totalAmountAdded = getAmount0(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96);
    let token1totalAmountAdded = getAmount1(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96);

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const updatedToken0 = await context.Token.getOrThrow(token0.id);
    const updatedToken1 = await context.Token.getOrThrow(token1.id);

    assert(
      defiPoolDataSetters.setIntervalLiquidityData.calledWith(
        eventTimestamp,
        defaultDeFiPoolData(eventTimestamp),
        token0totalAmountAdded,
        token1totalAmountAdded,
        updatedToken0,
        updatedToken1
      )
    );
  });

  it(`should not call the defi pool setters to set interval liquidity data
    if the pool has  0 of swap volume usd`, async () => {
    let pool: Pool = {
      ...new PoolMock(),
      swapVolumeUSD: BigDecimal("0"),
    };

    let v4Pool = {
      ...new V4PoolDataMock(),
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    let token0: Token = {
      ...new TokenMock(),
      id: "0x1",
      usdPrice: BigDecimal("3132"),
      tokenLiquidityVolume: BigDecimal("11111111"),
      liquidityVolumeUSD: BigDecimal("20197290179201"),
    };

    let token1: Token = {
      ...new TokenMock(),
      id: "0x2",
      usdPrice: BigDecimal("1212"),
      tokenLiquidityVolume: BigDecimal("2619216281921"),
      liquidityVolumeUSD: BigDecimal("11111"),
    };

    let liquidityDelta = BigInt("2739387638594388447");
    let tickLower = -197770;
    let tickUpper = -197760;

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    assert(defiPoolDataSetters.setIntervalLiquidityData.notCalled);
  });

  it(`should call the pool setters to set the interval data tvl after updating the pool
    from the incoming event`, async () => {
    let pool: Pool = {
      ...new PoolMock(),
      swapVolumeUSD: BigDecimal("0"),
    };

    let v4Pool = {
      ...new V4PoolDataMock(),
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    let token0: Token = {
      ...new TokenMock(),
      id: "0x1",
      usdPrice: BigDecimal("3132"),
      tokenLiquidityVolume: BigDecimal("11111111"),
      liquidityVolumeUSD: BigDecimal("20197290179201"),
    };

    let token1: Token = {
      ...new TokenMock(),
      id: "0x2",
      usdPrice: BigDecimal("1212"),
      tokenLiquidityVolume: BigDecimal("2619216281921"),
      liquidityVolumeUSD: BigDecimal("11111"),
    };

    let liquidityDelta = BigInt("2739387638594388447");
    let tickLower = -197770;
    let tickUpper = -197760;

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const updatedPool = await context.Pool.getOrThrow(pool.id);

    assert(poolSetters.setIntervalDataTVL.calledWith(eventTimestamp, updatedPool));
  });

  it(`should call the pool setters to set the interval liquidity data
     after updating the pool and the tokens entities from the incoming event`, async () => {
    let pool: Pool = {
      ...new PoolMock(),
      swapVolumeUSD: BigDecimal("0"),
    };

    let v4Pool = {
      ...new V4PoolDataMock(),
      id: pool.id,
      tick: BigInt("-197765"),
      sqrtPriceX96: BigInt("4024415889252221097743020"),
    };

    let token0: Token = {
      ...new TokenMock(),
      id: "0x1",
      usdPrice: BigDecimal("3132"),
      tokenLiquidityVolume: BigDecimal("11111111"),
      liquidityVolumeUSD: BigDecimal("20197290179201"),
    };

    let token1: Token = {
      ...new TokenMock(),
      id: "0x2",
      usdPrice: BigDecimal("1212"),
      tokenLiquidityVolume: BigDecimal("2619216281921"),
      liquidityVolumeUSD: BigDecimal("11111"),
    };

    let liquidityDelta = BigInt("2739387638594388447");
    let tickLower = -197770;
    let tickUpper = -197760;
    let token0totalAmountAdded = getAmount0(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96);
    let token1totalAmountAdded = getAmount1(tickLower, tickUpper, v4Pool.tick, liquidityDelta, v4Pool.sqrtPriceX96);

    context.Pool.set(pool);
    context.V4PoolData.set(v4Pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await handleV4PoolModifyLiquidity(
      context,
      pool,
      token0,
      token1,
      liquidityDelta,
      tickLower,
      tickUpper,
      eventTimestamp,
      poolSetters,
      defiPoolDataSetters
    );

    const updatedPool = await context.Pool.getOrThrow(pool.id);
    const updatedToken0 = await context.Token.getOrThrow(token0.id);
    const updatedToken1 = await context.Token.getOrThrow(token1.id);

    assert(
      poolSetters.setLiquidityIntervalData.calledWith({
        token1: updatedToken1,
        token0: updatedToken0,
        amount0AddedOrRemoved: token0totalAmountAdded,
        amount1AddedOrRemoved: token1totalAmountAdded,
        eventTimestamp,
        poolEntity: updatedPool,
      })
    );
  });
});
