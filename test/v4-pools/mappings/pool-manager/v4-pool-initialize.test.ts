import assert from "assert";
import { BigDecimal, HandlerContext } from "generated";
import sinon from "sinon";
import { ZERO_BIG_DECIMAL } from "../../../../src/common/constants";
import { IndexerNetwork } from "../../../../src/common/enums/indexer-network";
import { SupportedProtocol } from "../../../../src/common/enums/supported-protocol";
import { PoolSetters } from "../../../../src/common/pool-setters";
import { TokenService } from "../../../../src/common/services/token-service";
import { handleV4PoolInitialize } from "../../../../src/v4-pools/mappings/pool-manager/v4-pool-initialize";
import { HandlerContextCustomMock, PoolMock, TokenMock } from "../../../mocks";

describe("V4PoolInitialize", () => {
  let context: HandlerContext;
  let eventTimestamp = BigInt(Math.floor(Date.now() / 1000));
  let poolSetters: sinon.SinonStubbedInstance<PoolSetters>;
  let tokenService: sinon.SinonStubbedInstance<TokenService>;

  beforeEach(() => {
    context = HandlerContextCustomMock();
    poolSetters = sinon.createStubInstance(PoolSetters);
    tokenService = sinon.createStubInstance(TokenService);

    tokenService.getOrCreateTokenEntity.resolves(new TokenMock());
    poolSetters.getPricesForPoolWhitelistedTokens.returns({
      token0UpdatedPrice: BigDecimal("1"),
      token1UpdatedPrice: BigDecimal("1300"),
    });
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
      poolSetters,
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
      poolSetters,
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
      poolSetters,
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
      poolSetters,
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
      poolSetters,
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
      poolSetters,
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
      poolSetters,
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
      poolSetters,
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
      poolSetters,
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
      poolSetters,
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
      poolSetters,
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
      poolSetters,
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
      poolSetters,
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
      poolSetters,
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
      poolSetters,
      tokenService
    );

    const createdPool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));
    assert.equal(createdPool.v4PoolData_id, IndexerNetwork.getEntityIdFromAddress(chainId, pool.id));
  });

  it("should assign the token0 and token1 usd price got from the pool setters", async () => {
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
    let expectedToken0Price = BigDecimal(1.21);
    let expectedToken1Price = BigDecimal(2169821.21);

    tokenService.getOrCreateTokenEntity.withArgs(context, chainId, token0Id).resolves(new TokenMock(token0Id));
    tokenService.getOrCreateTokenEntity.withArgs(context, chainId, token1Id).resolves(new TokenMock(token1Id));

    poolSetters.getPricesForPoolWhitelistedTokens.returns({
      token0UpdatedPrice: expectedToken0Price,
      token1UpdatedPrice: expectedToken1Price,
    });

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
      poolSetters,
      tokenService
    );

    const token0 = await context.Token.getOrThrow(token0Id);
    const token1 = await context.Token.getOrThrow(token1Id);

    assert.equal(token0.usdPrice, expectedToken0Price);
    assert.equal(token1.usdPrice, expectedToken1Price);
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
      poolSetters,
      tokenService
    );

    const protocol = await context.Protocol.getOrThrow(expectedProtocolId);

    assert.equal(protocol.id, expectedProtocolId);
    assert.equal(protocol.name, SupportedProtocol.getName(expectedProtocolId), "protocol name should be correct");
    assert.equal(protocol.logo, SupportedProtocol.getLogoUrl(expectedProtocolId), "protocol logo should be correct");
    assert.equal(protocol.url, SupportedProtocol.getUrl(expectedProtocolId), "protocol url should be correct");
  });
});
