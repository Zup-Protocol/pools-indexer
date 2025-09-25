import assert from "assert";
import { VelodromeV3Factory_PoolCreated_event } from "generated";
import { MockDb, VelodromeV3Factory } from "generated/src/TestHelpers.gen";
import { IndexerNetwork } from "../../../../../src/common/enums/indexer-network";
import { SupportedProtocol } from "../../../../../src/common/enums/supported-protocol";

describe("VelodromeV3Factory", () => {
  const mockDb = MockDb.createMockDb();
  let network: IndexerNetwork;
  let event: VelodromeV3Factory_PoolCreated_event;

  beforeEach(() => {
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

  it("should pass the correct protocol when calling the pool created handler", async () => {
    const updatedMockDB = await mockDb.processEvents([event]);

    assert.equal(
      updatedMockDB.entities.Pool.get(IndexerNetwork.getEntityIdFromAddress(network, event.params.pool))!.protocol_id,
      SupportedProtocol.VELODROME_V3
    );
  });

  it("should pass the fee tier as zero when calling the pool created handler", async () => {
    const updatedMockDB = await mockDb.processEvents([event]);

    assert.equal(
      updatedMockDB.entities.Pool.get(IndexerNetwork.getEntityIdFromAddress(network, event.params.pool))!
        .initialFeeTier,
      0,
      "initialFeeTier should be zero"
    );

    assert.equal(
      updatedMockDB.entities.Pool.get(IndexerNetwork.getEntityIdFromAddress(network, event.params.pool))!
        .currentFeeTier,
      0,
      "currentFeeTier should be zero"
    );
  });

  it("should register the pool create in the dynamic contract registry", async () => {
    const updatedMockDB = await mockDb.processEvents([event]);
    const registeredContracts = updatedMockDB.dynamicContractRegistry.getAll();

    assert.equal(registeredContracts[0].contract_address, event.params.pool);
  });
});
