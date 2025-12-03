import { AlgebraPool_1_2_1 } from "generated";
import { IndexerNetwork } from "../../../../../common/enums/indexer-network";
import { handleV3PoolInitialize } from "../../v3-pool-initialize";

AlgebraPool_1_2_1.Initialize.handler(async ({ event, context }) => {
  const poolId = IndexerNetwork.getEntityIdFromAddress(event.chainId, event.srcAddress);
  const v3PoolData = await context.V3PoolData.getOrThrow(poolId);

  await handleV3PoolInitialize(context, v3PoolData, event.params.price, BigInt(event.params.tick));
});
