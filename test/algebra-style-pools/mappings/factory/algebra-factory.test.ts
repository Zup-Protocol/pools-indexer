import { assert } from "chai";
import { randomUUID } from "crypto";
import { handlerContext } from "generated";
import sinon from "sinon";
import { AlgebraVersion } from "../../../../src/algebra-style-pools/common/enums/algebra-version";
import { handleAlgebraPoolCreated } from "../../../../src/algebra-style-pools/mappings/factory/algebra-factory";
import { DEFI_POOL_DATA_ID } from "../../../../src/common/constants";
import { defaultDeFiPoolData } from "../../../../src/common/default-entities";
import { IndexerNetwork } from "../../../../src/common/enums/indexer-network";
import { SupportedProtocol } from "../../../../src/common/enums/supported-protocol";
import { TokenService } from "../../../../src/common/services/token-service";
import { AlgebraPoolDataMock, handlerContextCustomMock, TokenMock } from "../../../mocks";

describe("AlgebraFactoryHandler", () => {
  let context: handlerContext;
  let tokenService: sinon.SinonStubbedInstance<TokenService>;
  let poolAddress = "0xP00L4Ddr3ss";
  let token0Address = "0x0000000000000000000000000000000000000001";
  let token1Address = "0x0000000000000000000000000000000000000002";
  let deployer = "0xD3PL0Y3R";
  let version = AlgebraVersion.V1_2_2;
  let eventTimestamp = BigInt(Math.floor(Date.now() / 1000));
  let chainId = IndexerNetwork.MONAD;
  let protocol = SupportedProtocol.AETHONSWAP_ALGEBRA;

  beforeEach(() => {
    context = handlerContextCustomMock();
    tokenService = sinon.createStubInstance(TokenService);

    tokenService.getOrCreateTokenEntity.resolves(new TokenMock());
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should set the pool id in the algebra pool data entity id and assign it to the pool", async () => {
    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const expectedPoolId = IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress);
    const createdPool = await context.Pool.get(expectedPoolId)!;

    assert.equal(createdPool!.algebraPoolData_id, expectedPoolId);
  });

  it("should call the token service to get the token entities for address 0 and 1. Then assign their ids to the pool", async () => {
    const expectedToken0Id = "xabas-for-token0-id";
    const expectedToken1Id = "id-token1-for xabas";

    tokenService.getOrCreateTokenEntity
      .withArgs(context, chainId, token0Address)
      .resolves(new TokenMock(expectedToken0Id));

    tokenService.getOrCreateTokenEntity
      .withArgs(context, chainId, token1Address)
      .resolves(new TokenMock(expectedToken1Id));

    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const createdPool = await context.Pool.get(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(createdPool!.token0_id, expectedToken0Id);
    assert.equal(createdPool!.token1_id, expectedToken1Id);
  });

  it("should correctly assign the passed deployer address to the algebra pool data entity", async () => {
    const expectedDeployer = randomUUID();

    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer: expectedDeployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const algebraPoolData = await context.AlgebraPoolData.get(
      IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress)
    )!;

    assert.equal(algebraPoolData!.deployer, expectedDeployer);
  });

  it("should correctly assign the passed version to the algebra pool data entity", async () => {
    const expectedVersion = AlgebraVersion.V1_2_0;

    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version: expectedVersion,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const algebraPoolData = await context.AlgebraPoolData.get(
      IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress)
    )!;

    assert.equal(algebraPoolData!.version, expectedVersion);
  });

  it("should set the community fee as zero in the algebra pool data entity", async () => {
    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const algebraPoolData = await context.AlgebraPoolData.get(
      IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress)
    )!;

    assert.equal(algebraPoolData!.communityFee, 0);
  });

  it("should set the plugin address as zero address in the algebra pool data entity", async () => {
    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const algebraPoolData = await context.AlgebraPoolData.get(
      IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress)
    )!;

    assert.equal(algebraPoolData!.plugin, "0x0000000000000000000000000000000000000000");
  });

  it("should set the plugin config as zero in the algebra pool data entity", async () => {
    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const algebraPoolData = await context.AlgebraPoolData.get(
      IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress)
    )!;

    assert.equal(algebraPoolData!.pluginConfig, 0);
  });

  it("should set the sqrt price x96 as zero in the algebra pool data entity", async () => {
    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const algebraPoolData = await context.AlgebraPoolData.get(
      IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress)
    )!;

    assert.equal(algebraPoolData!.sqrtPriceX96, 0n);
  });

  it("should set the tick as zero in the algebra pool data entity", async () => {
    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const algebraPoolData = await context.AlgebraPoolData.get(
      IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress)
    )!;

    assert.equal(algebraPoolData!.tick, 0n);
  });

  it("should set the tick spacing as zero in the algebra pool data entity", async () => {
    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const algebraPoolData = await context.AlgebraPoolData.get(
      IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress)
    )!;

    assert.equal(algebraPoolData!.tickSpacing, 0);
  });

  it("should assign the passed pool address to the pool entity", async () => {
    const expectedPoolAddress = "0xCustomPoolAddr";

    await handleAlgebraPoolCreated({
      context,
      poolAddress: expectedPoolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const createdPool = await context.Pool.get(IndexerNetwork.getEntityIdFromAddress(chainId, expectedPoolAddress))!;

    assert.equal(createdPool!.poolAddress, expectedPoolAddress);
  });

  it("should pass the correct v3 position manager address to the pool entity. Getting from the passed protocol and chain id", async () => {
    const expectedProtocol = SupportedProtocol.UNISWAP_V3;
    const expectedChainId = IndexerNetwork.BASE;
    const expectedPositionManager = SupportedProtocol.getV3PositionManager(expectedProtocol, expectedChainId);

    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId: expectedChainId,
      protocol: expectedProtocol,
      tokenService,
    });

    const createdPool = await context.Pool.get(IndexerNetwork.getEntityIdFromAddress(expectedChainId, poolAddress))!;

    assert.equal(createdPool!.positionManager, expectedPositionManager);
  });

  it("should set the current fee tier as zero in the pool entity", async () => {
    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const createdPool = await context.Pool.get(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(createdPool!.currentFeeTier, 0);
  });

  it("should set the initial fee tier as zero in the pool entity", async () => {
    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const createdPool = await context.Pool.get(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(createdPool!.initialFeeTier, 0);
  });

  it("should set all total value locked amounts to zero", async () => {
    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const createdPool = await context.Pool.get(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(createdPool!.totalValueLockedToken0.toString(), "0");
    assert.equal(createdPool!.totalValueLockedToken1.toString(), "0");
    assert.equal(createdPool!.totalValueLockedUSD.toString(), "0");
  });

  it("should set all liquidity volume amounts to zero", async () => {
    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const createdPool = await context.Pool.get(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(createdPool!.liquidityVolumeToken0.toString(), "0");
    assert.equal(createdPool!.liquidityVolumeToken1.toString(), "0");
    assert.equal(createdPool!.liquidityVolumeUSD.toString(), "0");
  });

  it("should set all swap volume amounts to zero", async () => {
    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const createdPool = await context.Pool.get(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(createdPool!.swapVolumeToken0.toString(), "0");
    assert.equal(createdPool!.swapVolumeToken1.toString(), "0");
    assert.equal(createdPool!.swapVolumeUSD.toString(), "0");
  });

  it("should set all accumulated yield amounts to zero", async () => {
    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const createdPool = await context.Pool.get(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(createdPool!.accumulatedYield24h.toString(), "0");
    assert.equal(createdPool!.accumulatedYield7d.toString(), "0");
    assert.equal(createdPool!.accumulatedYield30d.toString(), "0");
    assert.equal(createdPool!.accumulatedYield90d.toString(), "0");
    assert.equal(createdPool!.totalAccumulatedYield.toString(), "0");
  });

  it("should set the created at timestamp to the event timestamp", async () => {
    const expectedTimestamp = BigInt(9999999999);

    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp: expectedTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const createdPool = await context.Pool.get(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(createdPool!.createdAtTimestamp, expectedTimestamp);
  });

  it("should set the protocol id to the passed protocol", async () => {
    const expectedProtocol = SupportedProtocol.AETHONSWAP_ALGEBRA;

    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol: expectedProtocol,
      tokenService,
    });

    const createdPool = await context.Pool.get(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(createdPool!.protocol_id, expectedProtocol);
  });

  it("should set the pool type to algebra", async () => {
    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const createdPool = await context.Pool.get(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(createdPool!.poolType, "ALGEBRA");
  });

  it("should set v4 pool data id as undefined in the pool entity", async () => {
    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const createdPool = await context.Pool.get(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.isUndefined(createdPool!.v4PoolData_id);
  });

  it("should set v3 pool data id as undefined in the pool entity", async () => {
    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const createdPool = await context.Pool.get(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.isUndefined(createdPool!.v3PoolData_id);
  });

  it("should set the chain id to the passed chain id", async () => {
    const expectedChainId = IndexerNetwork.MONAD;

    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId: expectedChainId,
      protocol,
      tokenService,
    });

    const createdPool = await context.Pool.get(IndexerNetwork.getEntityIdFromAddress(expectedChainId, poolAddress))!;

    assert.equal(createdPool!.chainId, expectedChainId);
  });

  it("should set all yearly yield amounts to zero", async () => {
    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const createdPool = await context.Pool.get(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(createdPool!.yearlyYield24h.toString(), "0");
    assert.equal(createdPool!.yearlyYield7d.toString(), "0");
    assert.equal(createdPool!.yearlyYield30d.toString(), "0");
    assert.equal(createdPool!.yearlyYield90d.toString(), "0");
  });

  it("should set all total accumulated yield ago amounts to zero", async () => {
    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const createdPool = await context.Pool.get(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(createdPool!.totalAccumulatedYield24hAgo.toString(), "0");
    assert.equal(createdPool!.totalAccumulatedYield7dAgo.toString(), "0");
    assert.equal(createdPool!.totalAccumulatedYield30dAgo.toString(), "0");
    assert.equal(createdPool!.totalAccumulatedYield90dAgo.toString(), "0");
  });

  it("should set all data point timestamps to the event timestamp", async () => {
    const expectedTimestamp = BigInt(1111111111);

    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp: expectedTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const createdPool = await context.Pool.get(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(createdPool!.dataPointTimestamp24hAgo, expectedTimestamp);
    assert.equal(createdPool!.dataPointTimestamp7dAgo, expectedTimestamp);
    assert.equal(createdPool!.dataPointTimestamp30dAgo, expectedTimestamp);
    assert.equal(createdPool!.dataPointTimestamp90dAgo, expectedTimestamp);
  });

  it("should set is dynamic fee to false", async () => {
    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const createdPool = await context.Pool.get(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress))!;

    assert.equal(createdPool!.isDynamicFee, false);
  });

  it("should increase the pools count in the defi pool data entity", async () => {
    const initialDefiPoolData = await context.DeFiPoolData.getOrCreate(defaultDeFiPoolData(eventTimestamp));
    const initialPoolsCount = initialDefiPoolData.poolsCount;

    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const updatedDefiPoolData = await context.DeFiPoolData.getOrThrow(DEFI_POOL_DATA_ID);

    assert.equal(updatedDefiPoolData.poolsCount, initialPoolsCount + 1);
  });

  it("should create the protocol entity with correct details", async () => {
    const expectedProtocol = SupportedProtocol.AETHONSWAP_ALGEBRA;

    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol: expectedProtocol,
      tokenService,
    });

    const protocolEntity = await context.Protocol.getOrThrow(expectedProtocol);

    assert.equal(protocolEntity.id, expectedProtocol);
    assert.equal(protocolEntity.name, SupportedProtocol.getName(expectedProtocol));
    assert.equal(protocolEntity.logo, SupportedProtocol.getLogoUrl(expectedProtocol));
    assert.equal(protocolEntity.url, SupportedProtocol.getUrl(expectedProtocol));
  });

  it("should save the token0 entity", async () => {
    const expectedToken0Id = "xabas-token0-id";
    tokenService.getOrCreateTokenEntity
      .withArgs(context, chainId, token0Address)
      .resolves(new TokenMock(expectedToken0Id));

    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const savedToken0 = await context.Token.getOrThrow(expectedToken0Id);

    assert.equal(savedToken0.id, expectedToken0Id);
  });

  it("should save the token1 entity", async () => {
    const expectedToken1Id = "xabas-token1-id";
    tokenService.getOrCreateTokenEntity
      .withArgs(context, chainId, token1Address)
      .resolves(new TokenMock(expectedToken1Id));

    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const savedToken1 = await context.Token.getOrThrow(expectedToken1Id);

    assert.equal(savedToken1.id, expectedToken1Id);
  });

  it(`should not modify the other fields in case that the algebra pool data already exists,
    but only update the version and deployer`, async () => {
    const algebraPoolData = new AlgebraPoolDataMock(IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress));
    context.AlgebraPoolData.set(algebraPoolData);

    await handleAlgebraPoolCreated({
      context,
      poolAddress,
      token0Address,
      token1Address,
      deployer,
      version,
      eventTimestamp,
      chainId,
      protocol,
      tokenService,
    });

    const updatedAlgebraPoolData = await context.AlgebraPoolData.getOrThrow(algebraPoolData.id);
    const expectedUpdatedAlgebraPoolData: AlgebraPoolDataMock = {
      ...new AlgebraPoolDataMock(algebraPoolData.id),
      version,
      deployer,
    };

    assert.deepEqual(updatedAlgebraPoolData, expectedUpdatedAlgebraPoolData);
  });
});
