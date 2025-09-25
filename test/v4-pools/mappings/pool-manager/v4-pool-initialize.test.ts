import assert from "assert";
import { DeFiPoolData, handlerContext } from "generated";
import sinon from "sinon";
import { defaultDeFiPoolData, DEFI_POOL_DATA_ID, ZERO_BIG_DECIMAL } from "../../../../src/common/constants";
import { IndexerNetwork } from "../../../../src/common/enums/indexer-network";
import { SupportedProtocol } from "../../../../src/common/enums/supported-protocol";
import { TokenService } from "../../../../src/common/services/token-service";
import { handleV4PoolInitialize } from "../../../../src/v4-pools/mappings/pool-manager/v4-pool-initialize";
import { handlerContextCustomMock, PoolMock, TokenMock } from "../../../mocks";

describe("V4PoolInitialize", () => {
  let context: handlerContext;
  let eventTimestamp = BigInt(Math.floor(Date.now() / 1000));
  let tokenService: sinon.SinonStubbedInstance<TokenService>;

  beforeEach(() => {
    context = handlerContextCustomMock();
    tokenService = sinon.createStubInstance(TokenService);

    tokenService.getOrCreateTokenEntity.resolves(new TokenMock());
  });

  it("When calling the handler, it should correctly assign the protocol to the pool", async () => {
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0x0000000000000000000000000000000000000000";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0x0000000000000000000000000000000000000001";

    await handleV4PoolInitialize(
      context,
      pool.id,
      pool.token0_id,
      pool.token1_id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const createdPool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));
    assert.equal(createdPool.protocol_id, expectedProtocolId);
  });

  it("When calling the handler, it should correctly assign the created timestamp to the pool", async () => {
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0x0000000000000000000000000000000000000000";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0x0000000000000000000000000000000000000001";

    await handleV4PoolInitialize(
      context,
      pool.id,
      pool.token0_id,
      pool.token1_id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const createdPool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));

    assert.equal(createdPool.createdAtTimestamp, eventTimestamp);
  });

  it("When calling the handler, it should correctly assign the token0 to the pool", async () => {
    let token0Id = "xabas id";
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0x0000000000000000000000000000000000000000";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0x0000000000000000000000000000000000000001";

    tokenService.getOrCreateTokenEntity.withArgs(context, chainId, token0Id).resolves(new TokenMock(token0Id));

    await handleV4PoolInitialize(
      context,
      pool.id,
      token0Id,
      pool.token1_id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const createdPool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));

    assert.equal(createdPool.token0_id, token0Id);
  });

  it("When calling the handler, it should correctly assign the token1 to the pool", async () => {
    let token1Id = "sabax id";
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0x0000000000000000000000000000000000000000";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0x0000000000000000000000000000000000000001";

    tokenService.getOrCreateTokenEntity.withArgs(context, chainId, token1Id).resolves(new TokenMock(token1Id));

    await handleV4PoolInitialize(
      context,
      pool.id,
      pool.token0_id,
      token1Id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const createdPool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));

    assert.equal(createdPool.token1_id, token1Id);
  });

  it("When calling the handler, it should correctly assign the fee tiers to the pool", async () => {
    let token1Id = "sabax id";
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0x0000000000000000000000000000000000000000";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0x0000000000000000000000000000000000000001";

    await handleV4PoolInitialize(
      context,
      pool.id,
      pool.token0_id,
      token1Id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const createdPool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));

    assert.equal(createdPool.initialFeeTier, feeTier, "initialFeeTier should be equal to feeTier");
    assert.equal(createdPool.currentFeeTier, feeTier, "currentFeeTier should be equal to feeTier");
  });

  it("When calling the handler, it should correctly assign the tick spacing to the v4 pool data", async () => {
    let token1Id = "sabax id";
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0x0000000000000000000000000000000000000000";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0x0000000000000000000000000000000000000001";

    await handleV4PoolInitialize(
      context,
      pool.id,
      pool.token0_id,
      token1Id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const createdPool = await context.V4PoolData.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));

    assert.equal(createdPool.tickSpacing, tickSpacing);
  });

  it("When calling the handler, it should correctly assign the tick to the v4 pool data", async () => {
    let token1Id = "sabax id";
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0x0000000000000000000000000000000000000000";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0x0000000000000000000000000000000000000001";

    await handleV4PoolInitialize(
      context,
      pool.id,
      pool.token0_id,
      token1Id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const createdPool = await context.V4PoolData.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));

    assert.equal(createdPool.tick, tick);
  });

  it("When calling the handler, it should correctly assign the sqrt price to the v4 pool data", async () => {
    let token1Id = "sabax id";
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0x0000000000000000000000000000000000000000";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0x0000000000000000000000000000000000000001";

    await handleV4PoolInitialize(
      context,
      pool.id,
      pool.token0_id,
      token1Id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const createdPool = await context.V4PoolData.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));

    assert.equal(createdPool.sqrtPriceX96, sqrtPriceX96);
  });

  it("When calling the handler, it should correctly assign the hooks to the v4 pool data", async () => {
    let token1Id = "sabax id";
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0xA6eB3d9dDdD2DdDdDdDdDdDdDdDdDdDdDdDdDdD";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0x0000000000000000000000000000000000000001";

    await handleV4PoolInitialize(
      context,
      pool.id,
      pool.token0_id,
      token1Id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const createdPool = await context.V4PoolData.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));

    assert.equal(createdPool.hooks, hooks);
  });

  it("When calling the handler, it should correctly assign the permit2 address to the v4 pool data", async () => {
    let token1Id = "sabax id";
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0xA6eB3d9dDdD2DdDdDdDdDdDdDdDdDdDdDdDdDdD";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0x0000000000000000000000000000000000000001";

    await handleV4PoolInitialize(
      context,
      pool.id,
      pool.token0_id,
      token1Id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const createdPool = await context.V4PoolData.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));

    assert.equal(createdPool.permit2, SupportedProtocol.getPermit2Address(expectedProtocolId, chainId));
  });

  it("When calling the handler, it should correctly assign the pool manager address to the v4 pool data", async () => {
    let token1Id = "sabax id";
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0xA6eB3d9dDdD2DdDdDdDdDdDdDdDdDdDdDdDdDdD";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0xXabas";

    await handleV4PoolInitialize(
      context,
      pool.id,
      pool.token0_id,
      token1Id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const createdPool = await context.V4PoolData.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));

    assert.equal(createdPool.poolManager, poolManagerAddress);
  });

  it("When calling the handler, it should correctly assign the v4 state view address to the v4 pool data", async () => {
    let token1Id = "sabax id";
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0xA6eB3d9dDdD2DdDdDdDdDdDdDdDdDdDdDdDdDdD";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0xXabas";

    await handleV4PoolInitialize(
      context,
      pool.id,
      pool.token0_id,
      token1Id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const createdPool = await context.V4PoolData.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));

    assert.equal(createdPool.stateView, SupportedProtocol.getV4StateView(expectedProtocolId, chainId));
  });

  it("When calling the handler, the total value locked should be zero for all fields", async () => {
    let token1Id = "sabax id";
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0xA6eB3d9dDdD2DdDdDdDdDdDdDdDdDdDdDdDdDdD";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0xXabas";

    await handleV4PoolInitialize(
      context,
      pool.id,
      pool.token0_id,
      token1Id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const createdPool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));

    assert.equal(createdPool.totalValueLockedToken0, ZERO_BIG_DECIMAL, "totalValueLockedToken0 should be zero");
    assert.equal(createdPool.totalValueLockedToken1, ZERO_BIG_DECIMAL, "totalValueLockedToken1 should be zero");
    assert.equal(createdPool.totalValueLockedUSD, ZERO_BIG_DECIMAL, "totalValueLockedUSD should be zero");
  });

  it("When calling the handler, the pool should have the type of V4", async () => {
    let token1Id = "sabax id";
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0xA6eB3d9dDdD2DdDdDdDdDdDdDdDdDdDdDdDdDdD";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0xXabas";

    await handleV4PoolInitialize(
      context,
      pool.id,
      pool.token0_id,
      token1Id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const createdPool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));

    assert.equal(createdPool.poolType, "V4");
  });

  it("When calling the handler, the v4 pool data should be also created, and assigned to the pool", async () => {
    let token1Id = "sabax id";
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0xA6eB3d9dDdD2DdDdDdDdDdDdDdDdDdDdDdDdDdD";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0xXabas";

    await handleV4PoolInitialize(
      context,
      pool.id,
      pool.token0_id,
      token1Id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const createdPool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));
    assert.equal(createdPool.v4PoolData_id, IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));
  });

  it("should create the protocol if it doesn't exist, using the correct params", async () => {
    let token1Id = "sabax id";
    let token0Id = "xabas id";
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0xA6eB3d9dDdD2DdDdDdDdDdDdDdDdDdDdDdDdDdD";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0xXabas";

    await handleV4PoolInitialize(
      context,
      pool.id,
      token0Id,
      token1Id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const protocol = await context.Protocol.getOrThrow(expectedProtocolId);

    assert.equal(protocol.id, expectedProtocolId);
    assert.equal(protocol.name, SupportedProtocol.getName(expectedProtocolId), "protocol name should be correct");
    assert.equal(protocol.logo, SupportedProtocol.getLogoUrl(expectedProtocolId), "protocol logo should be correct");
    assert.equal(protocol.url, SupportedProtocol.getUrl(expectedProtocolId), "protocol url should be correct");
  });

  it("should start as zero for the liquidity volume fields", async () => {
    let token1Id = "sabax id";
    let token0Id = "xabas id";
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0xA6eB3d9dDdD2DdDdDdDdDdDdDdDdDdDdDdDdDdD";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0xXabas";

    await handleV4PoolInitialize(
      context,
      pool.id,
      token0Id,
      token1Id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const createdPool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));

    assert.equal(createdPool.liquidityVolumeUSD, ZERO_BIG_DECIMAL);
    assert.equal(createdPool.liquidityVolumeToken0, ZERO_BIG_DECIMAL);
    assert.equal(createdPool.liquidityVolumeToken1, ZERO_BIG_DECIMAL);
  });

  it("should start as zero for the swap volume fields", async () => {
    let token1Id = "sabax id";
    let token0Id = "xabas id";
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0xA6eB3d9dDdD2DdDdDdDdDdDdDdDdDdDdDdDdDdD";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0xXabas";

    await handleV4PoolInitialize(
      context,
      pool.id,
      token0Id,
      token1Id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const createdPool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));

    assert.equal(createdPool.swapVolumeUSD, ZERO_BIG_DECIMAL);
    assert.equal(createdPool.swapVolumeToken0, ZERO_BIG_DECIMAL);
    assert.equal(createdPool.swapVolumeToken1, ZERO_BIG_DECIMAL);
  });

  it("should modify the existing defiPoolData entity to increase the poolsCount", async () => {
    const existingDefiPoolData: DeFiPoolData = {
      id: DEFI_POOL_DATA_ID,
      poolsCount: 991,
      startedAtTimestamp: 1758582407n,
    };

    context.DeFiPoolData.set(existingDefiPoolData);

    let token1Id = "sabax id";
    let token0Id = "xabas id";
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0xA6eB3d9dDdD2DdDdDdDdDdDdDdDdDdDdDdDdDdD";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0xXabas";

    await handleV4PoolInitialize(
      context,
      pool.id,
      token0Id,
      token1Id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const updatedDefiPoolData = await context.DeFiPoolData.getOrThrow(DEFI_POOL_DATA_ID)!;
    const expectedNewDefiPoolData: DeFiPoolData = {
      ...existingDefiPoolData,
      poolsCount: existingDefiPoolData.poolsCount + 1,
    };

    assert.deepEqual(updatedDefiPoolData, expectedNewDefiPoolData);
  });

  it(`should create a new defiPoolData entity if it doesn't exist and
      assign one as poolsCount. `, async () => {
    let token1Id = "sabax id";
    let token0Id = "xabas id";
    let expectedProtocolId = SupportedProtocol.UNISWAP_V4;
    let pool = new PoolMock();
    let feeTier = 568;
    let tickSpacing = 62;
    let tick = BigInt(989756545);
    let sqrtPriceX96 = BigInt("398789276389263782");
    let hooks = "0xA6eB3d9dDdD2DdDdDdDdDdDdDdDdDdDdDdDdDdD";
    let chainId = IndexerNetwork.ETHEREUM;
    let poolManagerAddress = "0xXabas";

    await handleV4PoolInitialize(
      context,
      pool.id,
      token0Id,
      token1Id,
      feeTier,
      tickSpacing,
      tick,
      sqrtPriceX96,
      expectedProtocolId,
      hooks,
      eventTimestamp,
      chainId,
      poolManagerAddress,
      tokenService
    );

    const updatedDefiPoolData = await context.DeFiPoolData.getOrThrow(DEFI_POOL_DATA_ID)!;
    const expectedNewDefiPoolData: DeFiPoolData = {
      ...defaultDeFiPoolData(eventTimestamp),
      poolsCount: 1,
    };

    assert.deepEqual(updatedDefiPoolData, expectedNewDefiPoolData);
  });
});
