import { Token as TokenEntity, UniswapV2Pool } from "generated";
import { DeFiPoolDataSetters } from "../../../../../common/defi-pool-data-setters";
import { IndexerNetwork } from "../../../../../common/enums/indexer-network";
import { PoolSetters } from "../../../../../common/pool-setters";
import { handleV2PoolMint } from "../../v2-pool-mint";

UniswapV2Pool.Mint.handler(async ({ event, context }) => {
  const poolId = IndexerNetwork.getEntityIdFromAddress(event.chainId, event.srcAddress);

  const poolEntity = await context.Pool.getOrThrow(poolId);

  const [token0Entity, token1Entity]: [TokenEntity, TokenEntity] = await Promise.all([
    context.Token.getOrThrow(poolEntity.token0_id),
    context.Token.getOrThrow(poolEntity.token1_id),
  ]);

  await handleV2PoolMint(
    context,
    poolEntity,
    token0Entity,
    token1Entity,
    event.params.amount0,
    event.params.amount1,
    BigInt(event.block.timestamp),
    new PoolSetters(context, event.chainId),
    new DeFiPoolDataSetters(context)
  );
});
