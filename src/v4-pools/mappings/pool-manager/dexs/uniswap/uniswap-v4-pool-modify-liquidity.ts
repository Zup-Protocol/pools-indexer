import { Token as TokenEntity, UniswapV4PoolManager } from "generated";
import { DeFiPoolDataSetters } from "../../../../../common/defi-pool-data-setters";
import { IndexerNetwork } from "../../../../../common/enums/indexer-network";
import { PoolSetters } from "../../../../../common/pool-setters";
import { handleV4PoolModifyLiquidity } from "../../v4-pool-modify-liquidity";

UniswapV4PoolManager.ModifyLiquidity.handler(async ({ event, context }) => {
  const poolId = IndexerNetwork.getEntityIdFromAddress(event.chainId, event.params.id);
  const poolEntity = await context.Pool.getOrThrow(poolId);

  const [token0Entity, token1Entity]: [TokenEntity, TokenEntity] = await Promise.all([
    context.Token.getOrThrow(poolEntity.token0_id),
    context.Token.getOrThrow(poolEntity.token1_id),
  ]);

  await handleV4PoolModifyLiquidity(
    context,
    poolEntity,
    token0Entity,
    token1Entity,
    event.params.liquidityDelta,
    Number.parseInt(event.params.tickLower.toString()),
    Number.parseInt(event.params.tickUpper.toString()),
    BigInt(event.block.timestamp),
    new PoolSetters(context, event.chainId),
    new DeFiPoolDataSetters(context)
  );
});
