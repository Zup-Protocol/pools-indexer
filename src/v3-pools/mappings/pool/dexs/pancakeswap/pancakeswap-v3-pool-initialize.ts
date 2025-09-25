import { PancakeSwapV3Pool } from "generated";
import { IndexerNetwork } from "../../../../../common/enums/indexer-network";
import { handleV3PoolInitialize } from "../../v3-pool-initialize";

PancakeSwapV3Pool.Initialize.handler(async ({ event, context }) => {
  const poolId = IndexerNetwork.getEntityIdFromAddress(event.chainId, event.srcAddress);
  let poolEntity = await context.Pool.getOrThrow(poolId);

  await handleV3PoolInitialize(context, poolEntity, event.params.sqrtPriceX96, BigInt(event.params.tick));
});
