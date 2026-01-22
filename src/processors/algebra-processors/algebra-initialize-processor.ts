import type {
  AlgebraPoolData,
  handlerContext,
  Pool as PoolEntity,
  SingleChainToken as SingleChainTokenEntity,
} from "generated";
import { EntityId } from "../../core/entity";
import { IndexerNetwork } from "../../core/network";
import { ConcentratedSqrtPriceMath } from "../../lib/math";
import { processPoolPricesUpdate } from "../pool-prices-update-processor";

export async function processAlgebraInitialize(params: {
  context: handlerContext;
  sqrtPriceX96: bigint;
  tick: bigint;
  poolAddress: string;
  network: IndexerNetwork;
}): Promise<void> {
  const poolId = EntityId.fromAddress(params.network, params.poolAddress);

  const [poolEntity, algebraPoolDataEntity]: [PoolEntity, AlgebraPoolData] = await Promise.all([
    params.context.Pool.getOrThrow(poolId),
    params.context.AlgebraPoolData.getOrThrow(poolId),
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

  params.context.AlgebraPoolData.set({
    ...algebraPoolDataEntity,
    sqrtPriceX96: params.sqrtPriceX96,
    tick: params.tick,
  });

  await processPoolPricesUpdate({
    context: params.context,
    network: params.network,
    poolAddress: params.poolAddress,
    poolPrices: poolPrices,
  });
}
