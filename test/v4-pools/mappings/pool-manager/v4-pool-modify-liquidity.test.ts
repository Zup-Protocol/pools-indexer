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

  // it(`When calling the handler removing liquidity, it should correctly modify the
  //     token0 and token1 amount in the pool based on the pool and event
  //     params`, () => {
  //   let pool = new PoolMock();
  //   let v4Pool = new V4PoolMock();

  //   let token0 = new TokenMock();
  //   let token1 = new TokenMock();
  //   let totalValueLockedToken0Before = BigDecimal.fromString("20.387520919667882736");
  //   let totalValueLockedToken1Before = BigDecimal.fromString("52639.292441");

  //   token0.decimals = 18;
  //   token1.decimals = 6;
  //   v4Pool.tick = BigInt.fromString("-197914");
  //   v4Pool.sqrtPriceX96 = BigInt.fromString("3994389100371270269195663");
  //   pool.totalValueLockedToken0 = totalValueLockedToken0Before;
  //   pool.totalValueLockedToken1 = totalValueLockedToken1Before;

  //   token0.save();
  //   token1.save();
  //   pool.save();
  //   v4Pool.save();

  //   let tickLower = -197920 as i32;
  //   let tickUpper = -197910 as i32;
  //   let liquidityDelta = BigInt.fromString("-2739387638594388447");

  //   let token0totalAmountRemoved = formatFromTokenAmount(
  //     getAmount0(tickLower, tickUpper, v4Pool.tick.toI32(), liquidityDelta, v4Pool.sqrtPriceX96),
  //     token0,
  //   );
  //   let token1totalAmountRemoved = formatFromTokenAmount(
  //     getAmount1(tickLower, tickUpper, v4Pool.tick.toI32(), liquidityDelta, v4Pool.sqrtPriceX96),
  //     token1,
  //   );

  //   handleV4PoolModifyLiquidity(pool, token0, token1, liquidityDelta, tickLower, tickUpper);

  //   assert.fieldEquals(
  //     "Pool",
  //     pool.id.toHexString(),
  //     "totalValueLockedToken0",
  //     totalValueLockedToken0Before.plus(token0totalAmountRemoved).toString(), // using plus because the value is negative
  //   );
  //   assert.fieldEquals(
  //     "Pool",
  //     pool.id.toHexString(),
  //     "totalValueLockedToken1",
  //     totalValueLockedToken1Before.plus(token1totalAmountRemoved).toString(), // using plus because the value is negative
  //   );
  // });

  // it(`When calling the handler adding liquidity, it should correctly modify the
  //     total value locked in usd based on the token amounts and
  //     token prices `, () => {
  //   let token0UsdPrice = BigDecimal.fromString("1200.72");
  //   let token1UsdPrice = BigDecimal.fromString("1.0001");
  //   let v4Pool = new V4PoolMock();

  //   let pool = new PoolMock();
  //   let token0 = new TokenMock();
  //   let token1 = new TokenMock();
  //   let totalValueLockedToken0Before = BigDecimal.fromString("20.387520919667882736");
  //   let totalValueLockedToken1Before = BigDecimal.fromString("52639.292441");

  //   token0.decimals = 18;
  //   token1.decimals = 6;
  //   token0.usdPrice = token0UsdPrice;
  //   token1.usdPrice = token1UsdPrice;
  //   v4Pool.tick = BigInt.fromString("-197765");
  //   v4Pool.sqrtPriceX96 = BigInt.fromString("4024415889252221097743020");
  //   pool.totalValueLockedToken0 = totalValueLockedToken0Before;
  //   pool.totalValueLockedToken1 = totalValueLockedToken1Before;

  //   token0.save();
  //   token1.save();
  //   pool.save();
  //   v4Pool.save();

  //   let liquidityDelta = BigInt.fromString("1169660501840625341");
  //   let tickLower = -197770 as i32;
  //   let tickUpper = -197760 as i32;
  //   let token0totalAmountAdded = formatFromTokenAmount(
  //     getAmount0(tickLower, tickUpper, v4Pool.tick.toI32(), liquidityDelta, v4Pool.sqrtPriceX96),
  //     token0,
  //   );
  //   let token1totalAmountAdded = formatFromTokenAmount(
  //     getAmount1(tickLower, tickUpper, v4Pool.tick.toI32(), liquidityDelta, v4Pool.sqrtPriceX96),
  //     token1,
  //   );
  //   let usdAmountAdded = token0totalAmountAdded
  //     .times(token0.usdPrice)
  //     .plus(token1totalAmountAdded.times(token1.usdPrice));

  //   let usdAmountbefore = totalValueLockedToken0Before
  //     .times(token0.usdPrice)
  //     .plus(totalValueLockedToken1Before.times(token1.usdPrice));

  //   handleV4PoolModifyLiquidity(pool, token0, token1, liquidityDelta, tickLower, tickUpper);

  //   assert.fieldEquals(
  //     "Pool",
  //     pool.id.toHexString(),
  //     "totalValueLockedUSD",
  //     usdAmountbefore.plus(usdAmountAdded).toString(),
  //   );
  // });

  // it(`When calling the handler removing liquidity, it should correctly modify the
  //     total value locked in usd based on the token amounts and
  //     token prices `, () => {
  //   let token0UsdPrice = BigDecimal.fromString("1200.72");
  //   let token1UsdPrice = BigDecimal.fromString("1.0001");

  //   let pool = new PoolMock();
  //   let token0 = new TokenMock();
  //   let token1 = new TokenMock();
  //   let totalValueLockedToken0Before = BigDecimal.fromString("20.387520919667882736");
  //   let totalValueLockedToken1Before = BigDecimal.fromString("52639.292441");
  //   let v4Pool = new V4PoolMock();

  //   token0.decimals = 18;
  //   token1.decimals = 6;
  //   token0.usdPrice = token0UsdPrice;
  //   token1.usdPrice = token1UsdPrice;
  //   v4Pool.tick = BigInt.fromString("-197914");
  //   v4Pool.sqrtPriceX96 = BigInt.fromString("3994389100371270269195663");
  //   pool.totalValueLockedToken0 = totalValueLockedToken0Before;
  //   pool.totalValueLockedToken1 = totalValueLockedToken1Before;

  //   token0.save();
  //   token1.save();
  //   pool.save();
  //   v4Pool.save();

  //   let tickLower = -197920 as i32;
  //   let tickUpper = -197910 as i32;
  //   let liquidityDelta = BigInt.fromString("-2739387638594388447");

  //   let token0totalAmountRemoved = formatFromTokenAmount(
  //     getAmount0(tickLower, tickUpper, v4Pool.tick.toI32(), liquidityDelta, v4Pool.sqrtPriceX96),
  //     token0,
  //   );
  //   let token1totalAmountRemoved = formatFromTokenAmount(
  //     getAmount1(tickLower, tickUpper, v4Pool.tick.toI32(), liquidityDelta, v4Pool.sqrtPriceX96),
  //     token1,
  //   );

  //   let usdAmountAdded = token0totalAmountRemoved
  //     .times(token0.usdPrice)
  //     .plus(token1totalAmountRemoved.times(token1.usdPrice));

  //   let usdAmountbefore = totalValueLockedToken0Before
  //     .times(token0.usdPrice)
  //     .plus(totalValueLockedToken1Before.times(token1.usdPrice));

  //   handleV4PoolModifyLiquidity(pool, token0, token1, liquidityDelta, tickLower, tickUpper);

  //   assert.fieldEquals(
  //     "Pool",
  //     pool.id.toHexString(),
  //     "totalValueLockedUSD",
  //     usdAmountbefore.plus(usdAmountAdded).toString(), // using plus because the value is negative
  //   );
  // });

  // it("When adding liquidity, it should correctly modify the tokens total amount pooled", () => {
  //   let token0Id = "0x0000000000000000000000000000000000000001";
  //   let token1Id = "0x0000000000000000000000000000000000000002";
  //   let pool = new PoolMock();
  //   let token0 = new TokenMock(Address.fromString(token0Id));
  //   let token1 = new TokenMock(Address.fromString(token1Id));
  //   let totalAmountPooledToken0Before = BigDecimal.fromString("20.387520919667882736");
  //   let totalAmountPooledToken1Before = BigDecimal.fromString("52639.292441");
  //   let v4Pool = new V4PoolMock();

  //   token0.decimals = 18;
  //   token1.decimals = 6;
  //   token0.totalTokenPooledAmount = totalAmountPooledToken0Before;
  //   token1.totalTokenPooledAmount = totalAmountPooledToken1Before;

  //   v4Pool.tick = BigInt.fromString("-197765");
  //   v4Pool.sqrtPriceX96 = BigInt.fromString("4024415889252221097743020");

  //   token0.save();
  //   token1.save();
  //   pool.save();
  //   v4Pool.save();

  //   let liquidityDelta = BigInt.fromString("1169660501840625341");
  //   let tickLower = -197770 as i32;
  //   let tickUpper = -197760 as i32;
  //   let token0totalAmountAdded = formatFromTokenAmount(
  //     getAmount0(tickLower, tickUpper, v4Pool.tick.toI32(), liquidityDelta, v4Pool.sqrtPriceX96),
  //     token0,
  //   );
  //   let token1totalAmountAdded = formatFromTokenAmount(
  //     getAmount1(tickLower, tickUpper, v4Pool.tick.toI32(), liquidityDelta, v4Pool.sqrtPriceX96),
  //     token1,
  //   );

  //   handleV4PoolModifyLiquidity(pool, token0, token1, liquidityDelta, tickLower, tickUpper);

  //   assert.fieldEquals(
  //     "Token",
  //     token0.id.toHexString(),
  //     "totalTokenPooledAmount",
  //     totalAmountPooledToken0Before.plus(token0totalAmountAdded).toString(),
  //   );
  //   assert.fieldEquals(
  //     "Token",
  //     token1.id.toHexString(),
  //     "totalTokenPooledAmount",
  //     totalAmountPooledToken1Before.plus(token1totalAmountAdded).toString(),
  //   );
  // });

  // it("When removing liquidity, it should correctly modify the tokens total amount pooled", () => {
  //   let token0Id = "0x0000000000000000000000000000000000000001";
  //   let token1Id = "0x0000000000000000000000000000000000000002";
  //   let pool = new PoolMock();
  //   let token0 = new TokenMock(Address.fromString(token0Id));
  //   let token1 = new TokenMock(Address.fromString(token1Id));
  //   let totalAmountPooledToken0Before = BigDecimal.fromString("20.387520919667882736");
  //   let totalAmountPooledToken1Before = BigDecimal.fromString("52639.292441");
  //   let v4Pool = new V4PoolMock();

  //   token0.decimals = 18;
  //   token1.decimals = 6;
  //   token0.totalTokenPooledAmount = totalAmountPooledToken0Before;
  //   token1.totalTokenPooledAmount = totalAmountPooledToken1Before;

  //   v4Pool.tick = BigInt.fromString("-197765");
  //   v4Pool.sqrtPriceX96 = BigInt.fromString("4024415889252221097743020");

  //   token0.save();
  //   token1.save();
  //   pool.save();
  //   v4Pool.save();

  //   let tickLower = -197920 as i32;
  //   let tickUpper = -197910 as i32;
  //   let liquidityDelta = BigInt.fromString("-2739387638594388447");

  //   let token0totalAmountRemoved = formatFromTokenAmount(
  //     getAmount0(tickLower, tickUpper, v4Pool.tick.toI32(), liquidityDelta, v4Pool.sqrtPriceX96),
  //     token0,
  //   );
  //   let token1totalAmountRemoved = formatFromTokenAmount(
  //     getAmount1(tickLower, tickUpper, v4Pool.tick.toI32(), liquidityDelta, v4Pool.sqrtPriceX96),
  //     token1,
  //   );

  //   handleV4PoolModifyLiquidity(pool, token0, token1, liquidityDelta, tickLower, tickUpper);

  //   assert.fieldEquals(
  //     "Token",
  //     token0.id.toHexString(),
  //     "totalTokenPooledAmount",
  //     totalAmountPooledToken0Before.plus(token0totalAmountRemoved).toString(), // using plus because the value is negative
  //   );
  //   assert.fieldEquals(
  //     "Token",
  //     token1.id.toHexString(),
  //     "totalTokenPooledAmount",
  //     totalAmountPooledToken1Before.plus(token1totalAmountRemoved).toString(), // using plus because the value is negative
  //   );
  // });

  // it("When removing liquidity, it should correctly modify the tokens total amount pooled in usd", () => {
  //   let token0Id = "0x0000000000000000000000000000000000000001";
  //   let token1Id = "0x0000000000000000000000000000000000000002";
  //   let token0UsdPrice = BigDecimal.fromString("1200.72");
  //   let token1UsdPrice = BigDecimal.fromString("1.0001");

  //   let pool = new PoolMock();
  //   let token0 = new TokenMock(Address.fromString(token0Id));
  //   let token1 = new TokenMock(Address.fromString(token1Id));
  //   let totalAmountPooledToken0Before = BigDecimal.fromString("20.387520919667882736");
  //   let totalAmountPooledToken1Before = BigDecimal.fromString("52639.292441");
  //   let totalUSDPooledToken0Before = totalAmountPooledToken0Before.times(token0UsdPrice);
  //   let totalUSDPooledToken1Before = totalAmountPooledToken1Before.times(token1UsdPrice);
  //   let v4Pool = new V4PoolMock();

  //   token0.decimals = 18;
  //   token1.decimals = 6;
  //   token0.usdPrice = token0UsdPrice;
  //   token1.usdPrice = token1UsdPrice;
  //   token0.totalTokenPooledAmount = totalAmountPooledToken0Before;
  //   token1.totalTokenPooledAmount = totalAmountPooledToken1Before;
  //   token0.totalValuePooledUsd = totalUSDPooledToken0Before;
  //   token1.totalValuePooledUsd = totalUSDPooledToken1Before;

  //   v4Pool.tick = BigInt.fromString("-197765");
  //   v4Pool.sqrtPriceX96 = BigInt.fromString("4024415889252221097743020");

  //   v4Pool.save();
  //   token0.save();
  //   token1.save();
  //   pool.save();

  //   let tickLower = -197920 as i32;
  //   let tickUpper = -197910 as i32;
  //   let liquidityDelta = BigInt.fromString("-2739387638594388447");

  //   let token0totalAmountRemoved = formatFromTokenAmount(
  //     getAmount0(tickLower, tickUpper, v4Pool.tick.toI32(), liquidityDelta, v4Pool.sqrtPriceX96),
  //     token0,
  //   );
  //   let token1totalAmountRemoved = formatFromTokenAmount(
  //     getAmount1(tickLower, tickUpper, v4Pool.tick.toI32(), liquidityDelta, v4Pool.sqrtPriceX96),
  //     token1,
  //   );

  //   handleV4PoolModifyLiquidity(pool, token0, token1, liquidityDelta, tickLower, tickUpper);

  //   assert.fieldEquals(
  //     "Token",
  //     token0.id.toHexString(),
  //     "totalValuePooledUsd",
  //     totalUSDPooledToken0Before.plus(token0UsdPrice.times(token0totalAmountRemoved)).toString(), // using plus because the value is negative
  //   );
  //   assert.fieldEquals(
  //     "Token",
  //     token1.id.toHexString(),
  //     "totalValuePooledUsd",
  //     totalUSDPooledToken1Before.plus(token1UsdPrice.times(token1totalAmountRemoved)).toString(), // using plus because the value is negative
  //   );
  // });

  // it("When adding liquidity, it should correctly modify the tokens total amount pooled in usd", () => {
  //   let token0Id = "0x0000000000000000000000000000000000000001";
  //   let token1Id = "0x0000000000000000000000000000000000000002";
  //   let token0UsdPrice = BigDecimal.fromString("1200.72");
  //   let token1UsdPrice = BigDecimal.fromString("1.0001");
  //   let v4Pool = new V4PoolMock();
  //   let pool = new PoolMock();
  //   let token0 = new TokenMock(Address.fromString(token0Id));
  //   let token1 = new TokenMock(Address.fromString(token1Id));
  //   let totalAmountPooledToken0Before = BigDecimal.fromString("20.387520919667882736");
  //   let totalAmountPooledToken1Before = BigDecimal.fromString("52639.292441");
  //   let totalUSDPooledToken0Before = totalAmountPooledToken0Before.times(token0UsdPrice);
  //   let totalUSDPooledToken1Before = totalAmountPooledToken1Before.times(token1UsdPrice);

  //   token0.decimals = 18;
  //   token1.decimals = 6;
  //   token0.usdPrice = token0UsdPrice;
  //   token1.usdPrice = token1UsdPrice;
  //   token0.totalTokenPooledAmount = totalAmountPooledToken0Before;
  //   token1.totalTokenPooledAmount = totalAmountPooledToken1Before;
  //   token0.totalValuePooledUsd = totalUSDPooledToken0Before;
  //   token1.totalValuePooledUsd = totalUSDPooledToken1Before;

  //   v4Pool.tick = BigInt.fromString("-197765");
  //   v4Pool.sqrtPriceX96 = BigInt.fromString("4024415889252221097743020");

  //   token0.save();
  //   token1.save();
  //   pool.save();
  //   v4Pool.save();

  //   let liquidityDelta = BigInt.fromString("1169660501840625341");
  //   let tickLower = -197770 as i32;
  //   let tickUpper = -197760 as i32;

  //   let token0totalAmountAdded = formatFromTokenAmount(
  //     getAmount0(tickLower, tickUpper, v4Pool.tick.toI32(), liquidityDelta, v4Pool.sqrtPriceX96),
  //     token0,
  //   );
  //   let token1totalAmountAdded = formatFromTokenAmount(
  //     getAmount1(tickLower, tickUpper, v4Pool.tick.toI32(), liquidityDelta, v4Pool.sqrtPriceX96),
  //     token1,
  //   );

  //   handleV4PoolModifyLiquidity(pool, token0, token1, liquidityDelta, tickLower, tickUpper);

  //   assert.fieldEquals(
  //     "Token",
  //     token0.id.toHexString(),
  //     "totalValuePooledUsd",
  //     totalUSDPooledToken0Before.plus(token0UsdPrice.times(token0totalAmountAdded)).toString(),
  //   );
  //   assert.fieldEquals(
  //     "Token",
  //     token1.id.toHexString(),
  //     "totalValuePooledUsd",
  //     totalUSDPooledToken1Before.plus(token1UsdPrice.times(token1totalAmountAdded)).toString(),
  //   );
  // });
});
