import { AlgebraPool_1_2_2 } from "generated";
import { IndexerNetwork } from "../../../../../common/enums/indexer-network";

AlgebraPool_1_2_2.Fee.handler(async ({ event, context }) => {
  const poolId = IndexerNetwork.getEntityIdFromAddress(event.chainId, event.srcAddress);
  let poolEntity = await context.Pool.getOrThrow(poolId);

  poolEntity = {
    ...poolEntity,
    currentFeeTier: Number.parseInt(event.params.fee.toString()),
  };

  context.Pool.set(poolEntity);
});
