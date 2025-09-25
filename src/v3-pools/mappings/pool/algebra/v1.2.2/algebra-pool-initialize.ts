import { AlgebraPool_1_2_2 } from "generated";
import { IndexerNetwork } from "../../../../../common/enums/indexer-network";
import { handleV3PoolInitialize } from "../../v3-pool-initialize";

AlgebraPool_1_2_2.Initialize.handler(async ({ event, context }) => {
  const poolId = IndexerNetwork.getEntityIdFromAddress(event.chainId, event.srcAddress);
  const poolEntity = await context.Pool.getOrThrow(poolId);

  await handleV3PoolInitialize(context, poolEntity, event.params.price, BigInt(event.params.tick));
});
