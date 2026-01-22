import type {
  Block_t,
  handlerContext,
  Pool as PoolEntity,
  SingleChainToken as SingleChainTokenEntity,
  V4PoolData as V4PoolDataEntity,
} from "generated";
import { EntityId } from "../../core/entity";
import { IndexerNetwork } from "../../core/network";
import { ConcentratedSqrtPriceMath } from "../../lib/math";
import { FeeMath } from "../../lib/math/fee-math";
import { processSwap } from "../swap-processor";

export async function processV4Swap(params: {
  context: handlerContext;
  poolAddress: string;
  network: IndexerNetwork;
  amount0: bigint;
  amount1: bigint;
  sqrtPriceX96: bigint;
  tick: bigint;
  swapFee: number;
  eventBlock: Block_t;
}): Promise<void> {
  const poolId = EntityId.fromAddress(params.network, params.poolAddress);

  const [poolEntity, v4PoolDataEntity]: [PoolEntity, V4PoolDataEntity] = await Promise.all([
    params.context.Pool.getOrThrow(poolId),
    params.context.V4PoolData.getOrThrow(poolId),
  ]);

  const [token0Entity, token1Entity]: [SingleChainTokenEntity, SingleChainTokenEntity] = await Promise.all([
    params.context.SingleChainToken.getOrThrow(poolEntity.token0_id),
    params.context.SingleChainToken.getOrThrow(poolEntity.token1_id),
  ]);

  // Unlike V3, a negative amount represents that amount is being sent to the pool and vice versa, so invert the sign
  const amount0SignInverted = params.amount0 * -1n;
  const amount1SignInverted = params.amount1 * -1n;

  params.context.Pool.set({
    ...poolEntity,
    rawCurrentFeeTier: params.swapFee,
    currentFeeTierPercentage: FeeMath.convertRawSwapFeeToPercentage(params.swapFee),
  });

  params.context.V4PoolData.set({
    ...v4PoolDataEntity,
    sqrtPriceX96: params.sqrtPriceX96,
    tick: params.tick,
  });

  await processSwap({
    amount0: amount0SignInverted,
    amount1: amount1SignInverted,
    context: params.context,
    eventBlock: params.eventBlock,
    network: params.network,
    poolAddress: params.poolAddress,
    rawSwapFee: params.swapFee,
    newPoolPrices: ConcentratedSqrtPriceMath.convertSqrtPriceX96ToPoolPrices({
      poolToken0: token0Entity,
      poolToken1: token1Entity,
      sqrtPriceX96: params.sqrtPriceX96,
    }),
  });
}
