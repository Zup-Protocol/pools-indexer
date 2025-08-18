import { UniswapV2Pool } from "generated";
import { IndexerNetwork } from "../../../../../common/enums/indexer-network";
import { PoolSetters } from "../../../../../common/pool-setters";
import { handleV2PoolSwap } from "../../v2-pool-swap";

UniswapV2Pool.Swap.handler(async ({ event, context }) => {
  const poolId = IndexerNetwork.getEntityIdFromAddress(event.chainId, event.srcAddress);
  const pool = await context.Pool.getOrThrow(poolId);
  const token0 = (await context.Token.get(pool.token0_id))!;
  const token1 = (await context.Token.get(pool.token1_id))!;

  await handleV2PoolSwap(
    context,
    pool,
    token0,
    token1,
    event.params.amount0In,
    event.params.amount1In,
    event.params.amount0Out,
    event.params.amount1Out,
    BigInt(event.block.timestamp),
    new PoolSetters(context, event.chainId)
  );
});
