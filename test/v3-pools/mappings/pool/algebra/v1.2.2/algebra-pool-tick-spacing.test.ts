import assert from "assert";
import { AlgebraPool_1_2_2_TickSpacing_event, V3PoolData } from "generated";
import { AlgebraPool_1_2_2, MockDb } from "generated/src/TestHelpers.gen";
import { IndexerNetwork } from "../../../../../../src/common/enums/indexer-network";
import { V3PoolDataMock } from "../../../../../mocks";

describe("AlgebraPoolTickSpacing", () => {
  let mockDB = MockDb.createMockDb();
  let event: AlgebraPool_1_2_2_TickSpacing_event;
  let v3Pool: V3PoolData;
  let chainId: IndexerNetwork;
  let srcAddress: string = "0x123";

  beforeEach(() => {
    chainId = IndexerNetwork.HYPER_EVM;

    v3Pool = new V3PoolDataMock(IndexerNetwork.getEntityIdFromAddress(chainId, srcAddress));
    mockDB = mockDB.entities.V3PoolData.set(v3Pool);

    event = AlgebraPool_1_2_2.TickSpacing.createMockEvent({
      mockEventData: {
        chainId: chainId,
        srcAddress: srcAddress,
      },
      newTickSpacing: 100n,
    });
  });

  it("should set the tick spacing in the v3 pool data entity with the new tick spacing from the event", async () => {
    let newTickSpacing = 21n;

    event = AlgebraPool_1_2_2.TickSpacing.createMockEvent({
      newTickSpacing: newTickSpacing,
      mockEventData: {
        chainId: chainId,
        srcAddress: srcAddress,
      },
    });

    mockDB = await mockDB.processEvents([event]);

    assert.deepEqual(
      mockDB.entities.V3PoolData.get(IndexerNetwork.getEntityIdFromAddress(chainId, srcAddress))!.tickSpacing,
      Number.parseInt(newTickSpacing.toString())
    );
  });
});
