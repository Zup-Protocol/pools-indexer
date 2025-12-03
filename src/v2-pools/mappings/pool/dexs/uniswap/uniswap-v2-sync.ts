import { Token as TokenEntity, UniswapV2Pool } from "generated";
import { IndexerNetwork } from "../../../../../common/enums/indexer-network";
import { PoolSetters } from "../../../../../common/pool-setters";
import { handleV2PoolSync } from "../../v2-pool-sync";

UniswapV2Pool.Sync.handler(async ({ event, context }) => {
  const poolId = IndexerNetwork.getEntityIdFromAddress(event.chainId, event.srcAddress);
  const poolEntity = await context.Pool.getOrThrow(poolId);

  const [token0Entity, token1Entity]: [TokenEntity, TokenEntity] = await Promise.all([
    context.Token.getOrThrow(poolEntity.token0_id),
    context.Token.getOrThrow(poolEntity.token1_id),
  ]);

  await handleV2PoolSync(
    context,
    poolEntity,
    token0Entity,
    token1Entity,
    event.params.reserve0,
    event.params.reserve1,
    BigInt(event.block.timestamp),
    new PoolSetters(context, event.chainId)
  );
});
