import assert from "assert";
import { DeFiPoolData, handlerContext } from "generated";
import sinon from "sinon";
import { defaultDeFiPoolData, DEFI_POOL_DATA_ID, ZERO_BIG_DECIMAL } from "../../../../src/common/constants";
import { IndexerNetwork } from "../../../../src/common/enums/indexer-network";
import { SupportedProtocol } from "../../../../src/common/enums/supported-protocol";
import { TokenService } from "../../../../src/common/services/token-service";
import { handleV3PoolCreated } from "../../../../src/v3-pools/mappings/factory/v3-factory";
import { AlgebraPoolDataMock, handlerContextCustomMock, TokenMock } from "../../../mocks";

describe("V3FactoryHandler", () => {
  let context: handlerContext;
  let tokenService: sinon.SinonStubbedInstance<TokenService>;
  let poolAddress = "0xP00L4Ddr3ss";
  let token0Address = "0x0000000000000000000000000000000000000001";
  let token1Address = "0x0000000000000000000000000000000000000002";
  let feeTier = 0;
  let tickSpacing = 0;
  let eventTimestamp = BigInt(Math.floor(Date.now() / 1000));
  let chainId = 1;
  let protocol = SupportedProtocol.UNISWAP_V3;

  beforeEach(() => {
    context = handlerContextCustomMock();
    tokenService = sinon.createStubInstance(TokenService);

    tokenService.getOrCreateTokenEntity.resolves(new TokenMock());
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should set the pool id in the v3 pool data entity id and assign it to the pool", async () => {
    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const expectedPoolId = IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress);
    const pool = await context.Pool.get(expectedPoolId)!;

    assert.equal(pool!.v3PoolData_id, expectedPoolId);
  });

  it("should set the tick spacing of the v3 pool data, with the one passed in the event", async () => {
    const expectedTickSpacing = 1261892691;
    tickSpacing = expectedTickSpacing;

    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const v3PoolData = await context.V3PoolData.get(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(v3PoolData!.tickSpacing, expectedTickSpacing);
  });

  it("should set the sqrtPriceX96 of the v3 pool data, as zero", async () => {
    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const v3PoolData = await context.V3PoolData.get(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.deepEqual(v3PoolData!.sqrtPriceX96, 0n);
  });

  it("should set the tick of the v3 pool data, as zero", async () => {
    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const v3PoolData = await context.V3PoolData.get(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.deepEqual(v3PoolData!.tick, 0n);
  });

  it("should set the pool address in the pool entity, exactly the same as the one passed in the event", async () => {
    const expectedPoolAddress = "xabas address";
    poolAddress = expectedPoolAddress;

    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.deepEqual(pool.poolAddress, expectedPoolAddress);
  });

  it("should get the v3 position manager for the passed protocol at the passed chain id and set it in the pool", async () => {
    const expectedProtocol = SupportedProtocol.AERODROME_V3;
    const expectedChainId = IndexerNetwork.BASE;
    const expectedPositionManagerAddress = SupportedProtocol.getV3PositionManager(expectedProtocol, expectedChainId);

    chainId = IndexerNetwork.BASE;
    protocol = expectedProtocol;

    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(pool.positionManager, expectedPositionManagerAddress);
  });

  it("should set the token 0 id in the pool entity, the exactly one got from the token service", async () => {
    const expectedToken0Id = "Xabas ma token 0 id";

    tokenService.getOrCreateTokenEntity
      .withArgs(context, chainId, token0Address)
      .resolves(new TokenMock(expectedToken0Id));

    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(pool.token0_id, expectedToken0Id);
  });

  it("should set the token 1 id in the pool entity, the exactly one got from the token service", async () => {
    const expectedToken1Id = "Xabas ma token 1  11111";

    tokenService.getOrCreateTokenEntity
      .withArgs(context, chainId, token1Address)
      .resolves(new TokenMock(expectedToken1Id));

    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(pool.token1_id, expectedToken1Id);
  });

  it("should set the pool current fee tier, the one passed in the event", async () => {
    const expectedFeeTier = 12518;
    feeTier = expectedFeeTier;

    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(pool.currentFeeTier, expectedFeeTier);
  });

  it("should set the pool initial fee tier, the one passed in the event", async () => {
    const expectedFeeTier = 12518;
    feeTier = expectedFeeTier;

    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(pool.initialFeeTier, expectedFeeTier);
  });

  it("should set the pool total value locked usd to zero", async () => {
    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.deepEqual(pool.totalValueLockedUSD, ZERO_BIG_DECIMAL);
  });

  it("should set the pool total value locked token 0 to zero", async () => {
    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.deepEqual(pool.totalValueLockedToken0, ZERO_BIG_DECIMAL);
  });

  it("should set the pool total value locked token 1 to zero", async () => {
    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.deepEqual(pool.totalValueLockedToken1, ZERO_BIG_DECIMAL);
  });

  it("should set the pool created timestamp to the same as the event timestamp", async () => {
    const expectedEventTimestamp = BigInt("555155155155155551777");
    eventTimestamp = expectedEventTimestamp;

    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.deepEqual(pool.createdAtTimestamp, expectedEventTimestamp);
  });

  it("should set the protocol in the pool, the same as the one passed in the event", async () => {
    const expectedProtocol = SupportedProtocol.SUSHI_SWAP_V3;

    protocol = expectedProtocol;

    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.deepEqual(pool.protocol_id, expectedProtocol);
  });

  it("should set the pool type to v3", async () => {
    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.deepEqual(pool.poolType, "V3");
  });

  it("should assign the chain id passed from the event to the pool", async () => {
    const expectedChainId = IndexerNetwork.SCROLL;
    chainId = expectedChainId;

    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.deepEqual(pool.chainId, expectedChainId);
  });

  it("should assing the algebra pool id if algebra pool data is passed in the params", async () => {
    const expectedAlgebraPoolId = "xabas-for-algebra-pool-id";
    const algebraPoolData = new AlgebraPoolDataMock(expectedAlgebraPoolId);

    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
      algebraPoolData
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.deepEqual(pool.algebraPoolData_id, algebraPoolData.id);
  });

  it("should save the token0 entity", async () => {
    const expectedToken0Id = "xabas-for-token0-id";
    const expectedToken0 = new TokenMock(expectedToken0Id);

    tokenService.getOrCreateTokenEntity.withArgs(context, chainId, token0Address).resolves(expectedToken0);

    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const token0Created = await context.Token.getOrThrow(expectedToken0Id)!;

    assert.deepEqual(token0Created.id, expectedToken0Id);
  });

  it("should save the token1 entity", async () => {
    const expectedToken1Id = "xabas-for-token1-id";
    const expectedToken1 = new TokenMock(expectedToken1Id);

    tokenService.getOrCreateTokenEntity.withArgs(context, chainId, token1Address).resolves(expectedToken1);

    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const token1Created = await context.Token.getOrThrow(expectedToken1Id)!;

    assert.deepEqual(token1Created.id, expectedToken1Id);
  });

  it("should correctly save the protocol entity with the correct params based on the protocol from the event", async () => {
    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const protocolCreated = await context.Protocol.getOrThrow(protocol)!;

    assert.deepEqual(
      protocolCreated.logo,
      SupportedProtocol.getLogoUrl(protocol),
      "the protocol logo should be correct"
    );

    assert.deepEqual(protocolCreated.name, SupportedProtocol.getName(protocol), "the protocol name should be correct");
    assert.deepEqual(protocolCreated.url, SupportedProtocol.getUrl(protocol), "the protocol url should be correct");
    assert.deepEqual(
      protocolCreated.logo,
      SupportedProtocol.getLogoUrl(protocol),
      "the protocol logo url should be correct"
    );
  });

  it("should set the liquidity volume token 0 to zero", async () => {
    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;
    assert.deepEqual(pool.liquidityVolumeToken0, ZERO_BIG_DECIMAL);
  });

  it("should set the liquidity volume token 1 to zero", async () => {
    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;
    assert.deepEqual(pool.liquidityVolumeToken1, ZERO_BIG_DECIMAL);
  });

  it("should set the liquidity volume USD to zero", async () => {
    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;
    assert.deepEqual(pool.liquidityVolumeUSD, ZERO_BIG_DECIMAL);
  });

  it("should set the swap volume USD to zero", async () => {
    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;
    assert.deepEqual(pool.swapVolumeUSD, ZERO_BIG_DECIMAL);
  });

  it("should set the swap volume token 0 to zero", async () => {
    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.deepEqual(pool.swapVolumeToken0, ZERO_BIG_DECIMAL);
  });

  it("should set the swap volume token 1 to zero", async () => {
    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
      tokenService
    );

    const pool = await context.Pool.getOrThrow(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;
    assert.deepEqual(pool.swapVolumeToken1, ZERO_BIG_DECIMAL);
  });

  it("should modify the existing defiPoolData entity to increase the poolsCount", async () => {
    const existingDefiPoolData: DeFiPoolData = {
      id: DEFI_POOL_DATA_ID,
      poolsCount: 21,
      startedAtTimestamp: 1758582407n,
    };

    context.DeFiPoolData.set(existingDefiPoolData);

    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
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
    await handleV3PoolCreated(
      context,
      poolAddress,
      token0Address,
      token1Address,
      feeTier,
      tickSpacing,
      eventTimestamp,
      chainId,
      protocol,
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
