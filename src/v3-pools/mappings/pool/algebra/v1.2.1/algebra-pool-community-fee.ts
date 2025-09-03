import { AlgebraPool_1_2_1 } from "generated";
import { IndexerNetwork } from "../../../../../common/enums/indexer-network";

AlgebraPool_1_2_1.CommunityFee.handler(async ({ event, context }) => {
  let poolId = IndexerNetwork.getEntityIdFromAddress(event.chainId, event.srcAddress);
  let algebraPoolData = await context.AlgebraPoolData.getOrThrow(poolId);

  algebraPoolData = {
    ...algebraPoolData,
    communityFee: Number.parseInt(event.params.communityFeeNew.toString()),
  };

  context.AlgebraPoolData.set(algebraPoolData);
});
