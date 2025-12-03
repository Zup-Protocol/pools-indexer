import {
  Pool as PoolEntity,
  Token as TokenEntity,
  UniswapV4PoolManager,
  V4PoolData as V4PoolDataEntity,
} from "generated";
import { IndexerNetwork } from "../../../../../common/enums/indexer-network";
import { PoolSetters } from "../../../../../common/pool-setters";
import { handleV4PoolSwap } from "../../v4-pool-swap";

UniswapV4PoolManager.Swap.handler(async ({ event, context }) => {
  const poolId = IndexerNetwork.getEntityIdFromAddress(event.chainId, event.params.id);

  const [poolEntity, v4PoolData]: [PoolEntity, V4PoolDataEntity] = await Promise.all([
    context.Pool.getOrThrow(poolId),
    context.V4PoolData.getOrThrow(poolId),
  ]);

  const [token0Entity, token1Entity]: [TokenEntity, TokenEntity] = await Promise.all([
    context.Token.getOrThrow(poolEntity.token0_id),
    context.Token.getOrThrow(poolEntity.token1_id),
  ]);

  await handleV4PoolSwap(
    context,
    poolEntity,
    v4PoolData,
    token0Entity,
    token1Entity,
    event.params.amount0,
    event.params.amount1,
    event.params.sqrtPriceX96,
    BigInt(event.params.tick),
    Number.parseInt(event.params.fee.toString()),
    BigInt(event.block.timestamp),
    new PoolSetters(context, event.chainId)
  );
});
