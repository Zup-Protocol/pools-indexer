import { UniswapV4PoolManager } from "generated";
import { IndexerNetwork } from "../../../../../common/enums/indexer-network";
import { PoolSetters } from "../../../../../common/pool-setters";
import { handleV4PoolSwap } from "../../v4-pool-swap";

UniswapV4PoolManager.Swap.handler(async ({ event, context }) => {
  const poolId = IndexerNetwork.getEntityIdFromAddress(event.chainId, event.params.id);
  const poolEntity = await context.Pool.getOrThrow(poolId);
  const token0 = await context.Token.getOrThrow(poolEntity.token0_id);
  const token1 = await context.Token.getOrThrow(poolEntity.token1_id);

  await handleV4PoolSwap(
    context,
    poolEntity,
    token0,
    token1,
    event.params.amount0,
    event.params.amount1,
    event.params.sqrtPriceX96,
    BigInt(event.params.tick),
    Number.parseInt(event.params.fee.toString()),
    BigInt(event.block.timestamp),
    new PoolSetters(context, event.chainId)
  );
});
