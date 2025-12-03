import { AerodromeV3Pool, Token as TokenEntity } from "generated";
import { IndexerNetwork } from "../../../../../common/enums/indexer-network";
import { PoolSetters } from "../../../../../common/pool-setters";
import { handleV3PoolProtocolCollect } from "../../v3-pool-protocol-collect";

AerodromeV3Pool.CollectFees.handler(async ({ event, context }) => {
  const poolId = IndexerNetwork.getEntityIdFromAddress(event.chainId, event.srcAddress);
  const poolEntity = await context.Pool.getOrThrow(poolId);
  const [token0Entity, token1Entity]: [TokenEntity, TokenEntity] = await Promise.all([
    context.Token.getOrThrow(poolEntity.token0_id),
    context.Token.getOrThrow(poolEntity.token1_id),
  ]);

  await handleV3PoolProtocolCollect(
    context,
    poolEntity,
    token0Entity,
    token1Entity,
    event.params.amount0,
    event.params.amount1,
    BigInt(event.block.timestamp),
    new PoolSetters(context, event.chainId)
  );
});
