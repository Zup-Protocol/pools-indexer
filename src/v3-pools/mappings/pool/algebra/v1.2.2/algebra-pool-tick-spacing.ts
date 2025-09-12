import { AlgebraPool_1_2_2 } from "generated";
import { IndexerNetwork } from "../../../../../common/enums/indexer-network";

AlgebraPool_1_2_2.TickSpacing.handler(async ({ event, context }) => {
  const poolId = IndexerNetwork.getEntityIdFromAddress(event.chainId, event.srcAddress);
  let v3PoolData = await context.V3PoolData.getOrThrow(poolId);

  v3PoolData = {
    ...v3PoolData,
    tickSpacing: Number.parseInt(event.params.newTickSpacing.toString()),
  };

  context.V3PoolData.set(v3PoolData);
});
