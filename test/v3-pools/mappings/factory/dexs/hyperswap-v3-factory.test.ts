import assert from "assert";
import { HyperSwapV3Factory_PoolCreated_event } from "generated";
import { HyperSwapV3Factory, MockDb } from "generated/src/TestHelpers.gen";
import { IndexerNetwork } from "../../../../../src/common/enums/indexer-network";
import { SupportedProtocol } from "../../../../../src/common/enums/supported-protocol";

describe("HyperSwapV3Factory", () => {
  const mockDb = MockDb.createMockDb();
  let network: IndexerNetwork;
  let event: HyperSwapV3Factory_PoolCreated_event;

  beforeEach(() => {
    network = IndexerNetwork.HYPER_EVM;

    event = HyperSwapV3Factory.PoolCreated.createMockEvent({
      mockEventData: {
        chainId: network,
      },
      pool: "0x0000000000000000000000000000000000000221",
      tickSpacing: 100n,
      fee: 500n,
      token0: "0x0000000000000000000000000000000000000002",
      token1: "0x0000000000000000000000000000000000000003",
    });
  });

  it("should pass the correct protocol when calling the pool created handler", async () => {
    const updatedMockDB = await mockDb.processEvents([event]);

    assert.equal(
      updatedMockDB.entities.Pool.get(IndexerNetwork.getEntityIdFromAddress(network, event.params.pool))!.protocol_id,
      SupportedProtocol.HYPER_SWAP_V3
    );
  });

  it("should register the pool create in the dynamic contract registry", async () => {
    const updatedMockDB = await mockDb.processEvents([event]);
    const registeredContracts = updatedMockDB.dynamicContractRegistry.getAll();

    assert.equal(registeredContracts[0].contract_address, event.params.pool);
  });
});
