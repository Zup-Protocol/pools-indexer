import assert from "assert";
import { AlienBaseV3Factory_PoolCreated_event } from "generated";
import { AlienBaseV3Factory, MockDb } from "generated/src/TestHelpers.gen";
import sinon from "sinon";
import { IndexerNetwork } from "../../../../../src/common/enums/indexer-network";
import { SupportedProtocol } from "../../../../../src/common/enums/supported-protocol";
import * as factoryHandler from "../../../../../src/v3-pools/mappings/factory/v3-factory";

describe("AlienBaseV3Factory", () => {
  const mockDb = MockDb.createMockDb();
  let network: IndexerNetwork;
  let event: AlienBaseV3Factory_PoolCreated_event;

  beforeEach(() => {
    sinon.stub(factoryHandler, "handleV3PoolCreated").resolves();
    network = IndexerNetwork.BASE;

    event = AlienBaseV3Factory.PoolCreated.createMockEvent({
      mockEventData: {
        chainId: network,
      },
      pool: "0x0000000000000000000000000000000000000021",
      tickSpacing: 100n,
      fee: 500n,
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
    });

    await mockDb.processEvents([event]);
    assert.equal(passedProtocol, SupportedProtocol.ALIENBASE_V3);
  });

  it("should register the pool create in the dynamic contract registry", async () => {
    const updatedMockDB = await mockDb.processEvents([event]);
    const registeredContracts = updatedMockDB.dynamicContractRegistry.getAll();

    assert.equal(registeredContracts[0].contract_address, event.params.pool);
  });
});
