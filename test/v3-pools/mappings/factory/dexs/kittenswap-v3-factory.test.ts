import assert from "assert";
import {
  AlgebraPoolData,
  KittenSwapAlgebraFactory_CustomPool_event,
  KittenSwapAlgebraFactory_Pool_event,
} from "generated";
import { KittenSwapAlgebraFactory, MockDb } from "generated/src/TestHelpers.gen";
import sinon from "sinon";
import { ZERO_ADDRESS } from "../../../../../src/common/constants";
import { IndexerNetwork } from "../../../../../src/common/enums/indexer-network";
import { SupportedProtocol } from "../../../../../src/common/enums/supported-protocol";
import * as factoryHandler from "../../../../../src/v3-pools/mappings/factory/v3-factory";

describe("KittenSwapV3Factory", () => {
  const mockDb = MockDb.createMockDb();
  let network: IndexerNetwork = IndexerNetwork.HYPER_EVM;
  let poolEvent: KittenSwapAlgebraFactory_Pool_event = KittenSwapAlgebraFactory.Pool.createMockEvent({
    mockEventData: {
      chainId: network,
    },
    pool: "0x0000000000000000000000000000000000004221",
    token0: "0x0000000000000000000000000000000000000002",
    token1: "0x0000000000000000000000000000000000000003",
  });
  let customPoolEvent: KittenSwapAlgebraFactory_CustomPool_event = KittenSwapAlgebraFactory.CustomPool.createMockEvent({
    mockEventData: {
      chainId: network,
    },
    pool: "0x0000000000000000000000000000000000004221",
    token0: "0x0000000000000000000000000000000000000002",
    token1: "0x0000000000000000000000000000000000000003",
    deployer: "0x0000000000000000000000000001111111111111",
  });

  beforeEach(() => {
    sinon.stub(factoryHandler, "handleV3PoolCreated").callsFake(async (..._args: any[]) => Promise.resolve());
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should pass the correct protocol when calling the pool created handler", async () => {
    let passedProtocol: SupportedProtocol | undefined;
    sinon.restore();
    sinon.stub(factoryHandler, "handleV3PoolCreated").callsFake(async (params) => {
      passedProtocol = params.protocol;
      return Promise.resolve();
    });

    await mockDb.processEvents([poolEvent]);

    assert.equal(passedProtocol, SupportedProtocol.KITTENSWAP_ALGEBRA);
  });

  it("should pass the correct protocol when calling the custom pool created handler", async () => {
    let passedProtocol: SupportedProtocol | undefined;
    sinon.restore();
    sinon.stub(factoryHandler, "handleV3PoolCreated").callsFake(async (params) => {
      passedProtocol = params.protocol;
      return Promise.resolve();
    });

    await mockDb.processEvents([customPoolEvent]);

    assert.equal(passedProtocol, SupportedProtocol.KITTENSWAP_ALGEBRA);
  });

  it("should pass the tick spacing and fee tier as zero when calling the custom pool created handler", async () => {
    let passedTickSpacing: number | undefined;
    let passedFeeTier: number | undefined;

    sinon.restore();
    sinon.stub(factoryHandler, "handleV3PoolCreated").callsFake(async (params) => {
      passedTickSpacing = params.tickSpacing;
      passedFeeTier = params.feeTier;
      return Promise.resolve();
    });

    await mockDb.processEvents([customPoolEvent]);

    assert.equal(passedTickSpacing, 0, "tickSpacing should be zero");
    assert.equal(passedFeeTier, 0, "feeTier should be zero");
  });

  it("should pass the tick spacing and fee tier as zero when calling the pool created handler", async () => {
    let passedTickSpacing: number | undefined;
    let passedFeeTier: number | undefined;

    sinon.restore();
    sinon.stub(factoryHandler, "handleV3PoolCreated").callsFake(async (params) => {
      passedTickSpacing = params.tickSpacing;
      passedFeeTier = params.feeTier;
      return Promise.resolve();
    });

    await mockDb.processEvents([poolEvent]);

    assert.equal(passedTickSpacing, 0, "tickSpacing should be zero");
    assert.equal(passedFeeTier, 0, "feeTier should be zero");
  });

  it("should pass the deployer address zero if the pool created is not a custom pool", async () => {
    let passedAlgebraData: AlgebraPoolData | undefined;

    sinon.restore();
    sinon.stub(factoryHandler, "handleV3PoolCreated").callsFake(async (params) => {
      passedAlgebraData = params.algebraPoolData;
      return Promise.resolve();
    });

    await mockDb.processEvents([poolEvent]);

    assert.equal(passedAlgebraData?.deployer, ZERO_ADDRESS, "deployer should be ZERO_ADDRESS for non-custom pools");
  });

  it("should pass the deployer address from the event if the pool created is a custom pool", async () => {
    let passedDeployer: string | undefined;

    sinon.restore();
    sinon.stub(factoryHandler, "handleV3PoolCreated").callsFake(async (params) => {
      passedDeployer = params.algebraPoolData?.deployer;
      return Promise.resolve();
    });

    await mockDb.processEvents([customPoolEvent]);

    assert.equal(passedDeployer, customPoolEvent.params.deployer, "deployer should match event deployer");
  });

  it("should register the pool created in the dynamic contract registry", async () => {
    const updatedMockDB = await mockDb.processEvents([poolEvent]);
    const registeredContracts = updatedMockDB.dynamicContractRegistry.getAll();

    assert.equal(registeredContracts[0].contract_address, poolEvent.params.pool);
  });

  it("should register the custom pool created in the dynamic contract registry", async () => {
    const updatedMockDB = await mockDb.processEvents([customPoolEvent]);
    const registeredContracts = updatedMockDB.dynamicContractRegistry.getAll();

    assert.equal(registeredContracts[0].contract_address, customPoolEvent.params.pool);
  });
});
