import type {
  handlerContext,
  Pool as PoolEntity,
  SingleChainToken as SingleChainTokenEntity,
  V3PoolData as V3PoolDataEntity,
} from "generated";
import { EntityId } from "../../core/entity";
import { IndexerNetwork } from "../../core/network";
import { ConcentratedSqrtPriceMath } from "../../lib/math";
import { processPoolPricesUpdate } from "../pool-prices-update-processor";

export async function processV3Initialize(params: {
  context: handlerContext;
  network: IndexerNetwork;
  poolAddress: string;
  sqrtPriceX96: bigint;
  tick: bigint;
}): Promise<void> {
  const poolId = EntityId.fromAddress(params.network, params.poolAddress);

  const [poolEntity, v3PoolDataEntity]: [PoolEntity, V3PoolDataEntity] = await Promise.all([
    params.context.Pool.getOrThrow(poolId),
    params.context.V3PoolData.getOrThrow(poolId),
  ]);

  const [token0, token1]: [SingleChainTokenEntity, SingleChainTokenEntity] = await Promise.all([
    params.context.SingleChainToken.getOrThrow(poolEntity.token0_id),
    params.context.SingleChainToken.getOrThrow(poolEntity.token1_id),
  ]);

  const poolPrices = ConcentratedSqrtPriceMath.convertSqrtPriceX96ToPoolPrices({
    poolToken0: token0,
    poolToken1: token1,
    sqrtPriceX96: params.sqrtPriceX96,
  });

  params.context.V3PoolData.set({
    ...v3PoolDataEntity,
    sqrtPriceX96: params.sqrtPriceX96,
    tick: params.tick,
  });

  await processPoolPricesUpdate({
    context: params.context,
    poolAddress: params.poolAddress,
    poolPrices,
    network: params.network,
  });
}
