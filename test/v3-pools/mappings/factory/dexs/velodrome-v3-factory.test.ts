import assert from "assert";
import { VelodromeV3Factory_PoolCreated_event } from "generated";
import { MockDb, VelodromeV3Factory } from "generated/src/TestHelpers.gen";
import sinon from "sinon";
import { IndexerNetwork } from "../../../../../src/common/enums/indexer-network";
import { SupportedProtocol } from "../../../../../src/common/enums/supported-protocol";
import * as factoryHandler from "../../../../../src/v3-pools/mappings/factory/v3-factory";

describe("VelodromeV3Factory", () => {
  const mockDb = MockDb.createMockDb();
  let network: IndexerNetwork;
  let event: VelodromeV3Factory_PoolCreated_event;

  beforeEach(() => {
    sinon.stub(factoryHandler, "handleV3PoolCreated").callsFake(async (..._args: any[]) => Promise.resolve());

    network = IndexerNetwork.UNICHAIN;

    event = VelodromeV3Factory.PoolCreated.createMockEvent({
      mockEventData: {
        chainId: network,
      },
      pool: "0x0000000000000000000000000000000000000001",
      tickSpacing: 100n,
      token0: "0x0000000000000000000000000000000000000002",
      token1: "0x0000000000000000000000000000000000000003",
    });
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

    await mockDb.processEvents([event]);

    assert.equal(passedProtocol, SupportedProtocol.VELODROME_V3);
  });

  it("should pass the fee tier as zero when calling the pool created handler", async () => {
    let passedFeeTier: number | undefined;
    sinon.restore();
    sinon.stub(factoryHandler, "handleV3PoolCreated").callsFake(async (params) => {
      passedFeeTier = params.feeTier;
      return Promise.resolve();
    });

    await mockDb.processEvents([event]);

    assert.equal(passedFeeTier, 0, "feeTier should be zero");
  });

  it("should pass is dynamic fee as true when calling the pool created handler", async () => {
    let passedDynamicFee: boolean | undefined = false;

    sinon.restore();
    sinon.stub(factoryHandler, "handleV3PoolCreated").callsFake(async (params) => {
      passedDynamicFee = params.isDynamicFee;
    });

    await mockDb.processEvents([event]);

    assert.equal(passedDynamicFee, true);
  });

  it("should register the pool create in the dynamic contract registry", async () => {
    const updatedMockDB = await mockDb.processEvents([event]);
    const registeredContracts = updatedMockDB.dynamicContractRegistry.getAll();

    assert.equal(registeredContracts[0].contract_address, event.params.pool);
  });
});
