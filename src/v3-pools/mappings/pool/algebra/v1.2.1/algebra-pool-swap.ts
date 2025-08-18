import { AlgebraPool_1_2_1 } from "generated";
import { IndexerNetwork } from "../../../../../common/enums/indexer-network";
import { PoolSetters } from "../../../../../common/pool-setters";
import { handleV3PoolSwap } from "../../v3-pool-swap";

AlgebraPool_1_2_1.Swap.handler(async ({ event, context }) => {
  const poolId = IndexerNetwork.getEntityIdFromAddress(event.chainId, event.srcAddress);
  const poolEntity = await context.Pool.getOrThrow(poolId);
  const token0Entity = await context.Token.getOrThrow(poolEntity.token0_id);
  const token1Entity = await context.Token.getOrThrow(poolEntity.token1_id);
  const overrideSwapFee =
    event.params.overrideFee != 0n ? Number.parseInt(event.params.overrideFee.toString()) : undefined;

  await handleV3PoolSwap({
    context,
    poolEntity,
    token0Entity,
    token1Entity,
    amount0: event.params.amount0,
    amount1: event.params.amount1,
    sqrtPriceX96: event.params.price,
    tick: BigInt(event.params.tick),
    eventTimestamp: BigInt(event.block.timestamp),
    v3PoolSetters: new PoolSetters(context, event.chainId),
    overrideSingleSwapFee: overrideSwapFee,
  });
});
