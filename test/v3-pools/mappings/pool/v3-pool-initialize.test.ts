import assert from "assert";
import { BigDecimal, HandlerContext } from "generated";
import sinon from "sinon";
import { PoolSetters } from "../../../../src/common/pool-setters";
import { handleV3PoolInitialize } from "../../../../src/v3-pools/mappings/pool/v3-pool-initialize";
import { HandlerContextCustomMock, PoolMock, TokenMock, V3PoolDataMock } from "../../../mocks";

describe("V3PoolInitializeHandler", () => {
  let context: HandlerContext;
  let poolSetters: sinon.SinonStubbedInstance<PoolSetters>;

  beforeEach(() => {
    context = HandlerContextCustomMock();
    poolSetters = sinon.createStubInstance(PoolSetters);
    poolSetters.getPricesForPoolWhitelistedTokens.returns({
      token0UpdatedPrice: BigDecimal("1"),
      token1UpdatedPrice: BigDecimal("1"),
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("When the handler is called, it should assign the sqrtPriceX96 to the pool", async () => {
    let pool = new PoolMock();
    let v3pool = new V3PoolDataMock(pool.id);

    let sqrtPriceX96 = BigInt(1000);
    let tick = BigInt(989756545);

    context.V3PoolData.set(v3pool);

    await handleV3PoolInitialize(context, pool, new TokenMock(), new TokenMock(), sqrtPriceX96, tick, poolSetters);

    const v3PoolData = await context.V3PoolData.getOrThrow(pool.id)!;
    assert.deepEqual(v3PoolData.sqrtPriceX96, sqrtPriceX96);
  });

  it("should assign the tick to the pool", async () => {
    let pool = new PoolMock();
    let v3pool = new V3PoolDataMock(pool.id);

    let sqrtPriceX96 = BigInt(1000);
    let tick = BigInt(989756545);

    context.V3PoolData.set(v3pool);

    await handleV3PoolInitialize(context, pool, new TokenMock(), new TokenMock(), sqrtPriceX96, tick, poolSetters);

    const updatedV3PoolData = await context.V3PoolData.getOrThrow(pool.id)!;

    assert.equal(updatedV3PoolData.tick, tick);
  });

  it("should assign the token0 usd price got from the pool setters", async () => {
    let pool = new PoolMock();
    let v3pool = new V3PoolDataMock(pool.id);
    let token0 = new TokenMock("0x0000000000000000000000000000000000000211");
    let sqrtPriceX96 = BigInt(1000);
    let tick = BigInt(989756545);
    let expectedToken0Price = BigDecimal("2192.44");

    poolSetters.getPricesForPoolWhitelistedTokens.returns({
      token0UpdatedPrice: expectedToken0Price,
      token1UpdatedPrice: BigDecimal("1"),
    });

    context.Token.set(token0);
    context.Pool.set(pool);
    context.V3PoolData.set(v3pool);

    await handleV3PoolInitialize(context, pool, token0, new TokenMock(), sqrtPriceX96, tick, poolSetters);

    const updatedToken = await context.Token.getOrThrow(token0.id)!;

    assert.deepEqual(updatedToken.usdPrice, expectedToken0Price);
  });

  it("should assign the token1 usd price got from the pool setters", async () => {
    let pool = new PoolMock();
    let v3pool = new V3PoolDataMock(pool.id);
    let token1 = new TokenMock("0x0000000000000000000000000000000042112211");
    let sqrtPriceX96 = BigInt(1000);
    let tick = BigInt(989756545);
    let expectedToken1Price = BigDecimal("12.882");

    poolSetters.getPricesForPoolWhitelistedTokens.returns({
      token0UpdatedPrice: BigDecimal("1"),
      token1UpdatedPrice: expectedToken1Price,
    });

    context.Token.set(token1);
    context.Pool.set(pool);
    context.V3PoolData.set(v3pool);

    await handleV3PoolInitialize(context, pool, new TokenMock(), token1, sqrtPriceX96, tick, poolSetters);

    const updatedToken = await context.Token.getOrThrow(token1.id);

    assert.deepEqual(updatedToken.usdPrice, expectedToken1Price);
  });
});
