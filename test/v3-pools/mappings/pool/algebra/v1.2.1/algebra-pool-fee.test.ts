import assert from "assert";
import { AlgebraPool_1_2_1_Fee_event, Pool } from "generated";
import { AlgebraPool_1_2_1, MockDb } from "generated/src/TestHelpers.gen";
import { IndexerNetwork } from "../../../../../../src/common/enums/indexer-network";
import { PoolMock } from "../../../../../mocks";

describe("AlgebraPoolFee", () => {
  let mockDB = MockDb.createMockDb();
  let event: AlgebraPool_1_2_1_Fee_event;
  let pool: Pool;
  let chainId: IndexerNetwork;
  let srcAddress: string = "0x123";

  beforeEach(() => {
    chainId = IndexerNetwork.HYPER_EVM;

    pool = new PoolMock(IndexerNetwork.getEntityIdFromAddress(chainId, srcAddress));

    mockDB = mockDB.entities.Pool.set(pool);

    event = AlgebraPool_1_2_1.Fee.createMockEvent({
      mockEventData: {
        chainId: chainId,
        srcAddress: srcAddress,
      },
      fee: 1000n,
    });
  });

  it("should set the current fee tier in the pool entity with the new fee from the event", async () => {
    let newFee = 1111115551111n;

    event = AlgebraPool_1_2_1.Fee.createMockEvent({
      fee: newFee,
      mockEventData: {
        chainId: chainId,
        srcAddress: srcAddress,
      },
    });

    mockDB = await mockDB.processEvents([event]);

    assert.deepEqual(
      mockDB.entities.Pool.get(IndexerNetwork.getEntityIdFromAddress(chainId, srcAddress))!.currentFeeTier,
      newFee
    );
  });
});
