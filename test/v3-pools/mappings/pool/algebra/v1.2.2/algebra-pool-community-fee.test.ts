import assert from "assert";
import { AlgebraPool_1_2_2_CommunityFee_event, AlgebraPoolData } from "generated";
import { AlgebraPool_1_2_2, MockDb } from "generated/src/TestHelpers.gen";
import { IndexerNetwork } from "../../../../../../src/common/enums/indexer-network";

describe("AlgebraPoolCommunityFee", () => {
  let mockDB = MockDb.createMockDb();
  let event: AlgebraPool_1_2_2_CommunityFee_event;
  let algebraPoolData: AlgebraPoolData;
  let chainId: IndexerNetwork;
  let srcAddress: string = "0x123";

  beforeEach(() => {
    chainId = IndexerNetwork.HYPER_EVM;

    algebraPoolData = {
      id: IndexerNetwork.getEntityIdFromAddress(chainId, srcAddress),
      deployer: srcAddress,
      communityFee: 0,
    };

    event = AlgebraPool_1_2_2.CommunityFee.createMockEvent({
      mockEventData: {
        chainId: chainId,
        srcAddress: srcAddress,
      },
      communityFeeNew: 1000n,
    });
  });

  it("should set the community fee in the algebra pool data entity with the new community fee from the event", async () => {
    let newFee = 1028190n;

    event = AlgebraPool_1_2_2.CommunityFee.createMockEvent({
      communityFeeNew: newFee,
      mockEventData: {
        chainId: chainId,
        srcAddress: srcAddress,
      },
    });

    mockDB = mockDB.entities.AlgebraPoolData.set({
      communityFee: 0,
      deployer: srcAddress,
      id: IndexerNetwork.getEntityIdFromAddress(chainId, srcAddress),
    });

    mockDB = await mockDB.processEvents([event]);

    assert.deepEqual(
      mockDB.entities.AlgebraPoolData.get(IndexerNetwork.getEntityIdFromAddress(chainId, srcAddress))!.communityFee,
      newFee
    );
  });
});
