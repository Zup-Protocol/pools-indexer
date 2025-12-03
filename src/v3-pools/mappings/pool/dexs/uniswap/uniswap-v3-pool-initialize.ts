import { UniswapV3Pool } from "generated";
import { IndexerNetwork } from "../../../../../common/enums/indexer-network";
import { handleV3PoolInitialize } from "../../v3-pool-initialize";

UniswapV3Pool.Initialize.handler(async ({ event, context }) => {
  const poolId = IndexerNetwork.getEntityIdFromAddress(event.chainId, event.srcAddress);
  const v3PoolEntity = await context.V3PoolData.getOrThrow(poolId);

  await handleV3PoolInitialize(context, v3PoolEntity, event.params.sqrtPriceX96, BigInt(event.params.tick));
});
