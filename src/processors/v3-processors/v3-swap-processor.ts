import type {
  Block_t,
  HandlerContext,
  Pool as PoolEntity,
  SingleChainToken as SingleChainTokenEntity,
  V3PoolData as V3PoolDataEntity,
} from "generated";
import { EntityId } from "../../core/entity";
import { IndexerNetwork } from "../../core/network";
import { ConcentratedSqrtPriceMath } from "../../lib/math/concentrated-liquidity/concentrated-sqrt-price-math";
import { processSwap } from "../swap-processor";

export async function processV3Swap(params: {
  sqrtPriceX96: bigint;
  tick: bigint;
  context: HandlerContext;
  poolAddress: string;
  network: IndexerNetwork;
  amount0: bigint;
  amount1: bigint;
  eventBlock: Block_t;
}): Promise<void> {
  const poolId = EntityId.fromAddress(params.network, params.poolAddress);

  let [poolEntity, v3PoolEntity]: [PoolEntity, V3PoolDataEntity] = await Promise.all([
    params.context.Pool.getOrThrow(poolId),
    params.context.V3PoolData.getOrThrow(poolId),
  ]);

  const [token0Entity, token1Entity]: [SingleChainTokenEntity, SingleChainTokenEntity] = await Promise.all([
    params.context.SingleChainToken.getOrThrow(poolEntity.token0_id),
    params.context.SingleChainToken.getOrThrow(poolEntity.token1_id),
  ]);

  params.context.V3PoolData.set({
    ...v3PoolEntity,
    sqrtPriceX96: params.sqrtPriceX96,
    tick: params.tick,
  });

  await processSwap({
    context: params.context,
    poolAddress: params.poolAddress,
    network: params.network,
    amount0: params.amount0,
    amount1: params.amount1,
    eventBlock: params.eventBlock,
    rawSwapFee: poolEntity.rawCurrentFeeTier,
    newPoolPrices: ConcentratedSqrtPriceMath.convertSqrtPriceX96ToPoolPrices({
      poolToken0: token0Entity,
      poolToken1: token1Entity,
      sqrtPriceX96: params.sqrtPriceX96,
    }),
  });
}
