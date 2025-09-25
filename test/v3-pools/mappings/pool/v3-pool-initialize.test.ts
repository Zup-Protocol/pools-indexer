import assert from "assert";
import { handlerContext } from "generated";
import sinon from "sinon";
import { handleV3PoolInitialize } from "../../../../src/v3-pools/mappings/pool/v3-pool-initialize";
import { handlerContextCustomMock, PoolMock, V3PoolDataMock } from "../../../mocks";

describe("V3PoolInitializeHandler", () => {
  let context: handlerContext;

  beforeEach(() => {
    context = handlerContextCustomMock();
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

    await handleV3PoolInitialize(context, pool, sqrtPriceX96, tick);

    const v3PoolData = await context.V3PoolData.getOrThrow(pool.id)!;
    assert.deepEqual(v3PoolData.sqrtPriceX96, sqrtPriceX96);
  });

  it("should assign the tick to the pool", async () => {
    let pool = new PoolMock();
    let v3pool = new V3PoolDataMock(pool.id);

    let sqrtPriceX96 = BigInt(1000);
    let tick = BigInt(989756545);

    context.V3PoolData.set(v3pool);

    await handleV3PoolInitialize(context, pool, sqrtPriceX96, tick);

    const updatedV3PoolData = await context.V3PoolData.getOrThrow(pool.id)!;

    assert.equal(updatedV3PoolData.tick, tick);
  });
});
