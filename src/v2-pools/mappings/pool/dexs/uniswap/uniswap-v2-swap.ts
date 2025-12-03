import { Token as TokenEntity, UniswapV2Pool } from "generated";
import { IndexerNetwork } from "../../../../../common/enums/indexer-network";
import { PoolSetters } from "../../../../../common/pool-setters";
import { handleV2PoolSwap } from "../../v2-pool-swap";

UniswapV2Pool.Swap.handler(async ({ event, context }) => {
  const poolId = IndexerNetwork.getEntityIdFromAddress(event.chainId, event.srcAddress);
  const poolEntity = await context.Pool.getOrThrow(poolId);

  const [token0Entity, token1Entity]: [TokenEntity, TokenEntity] = await Promise.all([
    context.Token.getOrThrow(poolEntity.token0_id),
    context.Token.getOrThrow(poolEntity.token1_id),
  ]);

  await handleV2PoolSwap({
    amount0In: event.params.amount0In,
    amount0Out: event.params.amount0Out,
    amount1In: event.params.amount1In,
    amount1Out: event.params.amount1Out,
    context,
    eventTimestamp: BigInt(event.block.timestamp),
    poolEntity: poolEntity,
    token0Entity: token0Entity,
    token1Entity: token1Entity,
    v2PoolSetters: new PoolSetters(context, event.chainId),
  });
});
