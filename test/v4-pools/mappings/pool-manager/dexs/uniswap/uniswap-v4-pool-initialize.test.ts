import assert from "assert";
import { UniswapV4PoolManager_Initialize_event } from "generated";
import { MockDb, UniswapV4PoolManager } from "generated/src/TestHelpers.gen";
import { IndexerNetwork } from "../../../../../../src/common/enums/indexer-network";
import { SupportedProtocol } from "../../../../../../src/common/enums/supported-protocol";

describe("UniswapV4PoolInitialize", () => {
  const mockDb = MockDb.createMockDb();
  let network: IndexerNetwork;
  let event: UniswapV4PoolManager_Initialize_event;

  beforeEach(() => {
    network = IndexerNetwork.UNICHAIN;

    event = UniswapV4PoolManager.Initialize.createMockEvent({
      currency0: "0x0000000000000000000000000000000000000001",
      currency1: "0x0000000000000000000000000000000000000002",
      fee: 500n,
      hooks: "0x0000000000000000000000000000000000000023",
      id: "0x819",
      tickSpacing: 62n,
      mockEventData: {
        chainId: network,
      },
      sqrtPriceX96: 287152761n,
      tick: 989756545n,
    });
  });

  it("Should pass the correct protocol when calling the handler", async () => {
    const updatedMockDb = await mockDb.processEvents([event]);

    assert.deepEqual(
      updatedMockDb.entities.Pool.get(IndexerNetwork.getEntityIdFromAddress(network, event.params.id))!.protocol_id,
      SupportedProtocol.UNISWAP_V4
    );
  });
});
