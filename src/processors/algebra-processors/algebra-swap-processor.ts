import type {
  AlgebraPoolData as AlgebraPoolDataEntity,
  Block_t,
  handlerContext,
  Pool as PoolEntity,
  SingleChainToken as SingleChainTokenEntity,
} from "generated";
import { Id } from "../../core/entity";
import { IndexerNetwork } from "../../core/network";
import { ConcentratedSqrtPriceMath } from "../../lib/math/concentrated-liquidity/concentrated-sqrt-price-math";
import { FeeMath } from "../../lib/math/fee-math";
import { processSwap } from "../swap-processor";
import { AlgebraMath } from "./utils/algebra-math";

export async function processAlgebraSwap(params: {
  context: handlerContext;
  poolAddress: string;
  network: IndexerNetwork;
  eventBlock: Block_t;
  swapAmount0: bigint;
  swapAmount1: bigint;
  sqrtPriceX96: bigint;
  overrideSwapFee: number | undefined;
  pluginFee: number;
  tick: bigint;
}): Promise<void> {
  if (params.overrideSwapFee === 0) params.overrideSwapFee = undefined;
  const poolId = Id.fromAddress(params.network, params.poolAddress);

  const [poolEntity, algebraPoolData]: [PoolEntity, AlgebraPoolDataEntity] = await Promise.all([
    params.context.Pool.getOrThrow(poolId),
    params.context.AlgebraPoolData.getOrThrow(poolId),
  ]);

  const [token0Entity, token1Entity]: [SingleChainTokenEntity, SingleChainTokenEntity] = await Promise.all([
    params.context.SingleChainToken.getOrThrow(poolEntity.token0_id),
    params.context.SingleChainToken.getOrThrow(poolEntity.token1_id),
  ]);

  const nonLPFeesTokenAmount = AlgebraMath.calculateAlgebraNonLPFeesAmount({
    swapAmount0: params.swapAmount0,
    swapAmount1: params.swapAmount1,
    rawCommunityFee: algebraPoolData.rawCommunityFee,
    poolEntity: poolEntity,
    rawPluginFee: params.pluginFee,
    token0: token0Entity,
    token1: token1Entity,
    rawSwapFee: params.overrideSwapFee ?? poolEntity.rawCurrentFeeTier,
  });

  const newRawFeeTier = poolEntity.isDynamicFee
    ? (params.overrideSwapFee ?? poolEntity.rawCurrentFeeTier)
    : poolEntity.rawCurrentFeeTier;

  params.context.Pool.set({
    ...poolEntity,
    totalValueLockedToken0: poolEntity.totalValueLockedToken0.minus(nonLPFeesTokenAmount.token0FeeAmount),
    totalValueLockedToken1: poolEntity.totalValueLockedToken1.minus(nonLPFeesTokenAmount.token1FeeAmount),
    rawCurrentFeeTier: newRawFeeTier,
    currentFeeTierPercentage: FeeMath.convertRawSwapFeeToPercentage(newRawFeeTier),
  });

  params.context.SingleChainToken.set({
    ...token0Entity,
    tokenTotalValuePooled: token0Entity.tokenTotalValuePooled.minus(nonLPFeesTokenAmount.token0FeeAmount),
  });

  params.context.SingleChainToken.set({
    ...token1Entity,
    tokenTotalValuePooled: token1Entity.tokenTotalValuePooled.minus(nonLPFeesTokenAmount.token1FeeAmount),
  });

  params.context.AlgebraPoolData.set({
    ...algebraPoolData,
    sqrtPriceX96: params.sqrtPriceX96,
    tick: params.tick,
  });

  await processSwap({
    context: params.context,
    poolAddress: params.poolAddress,
    network: params.network,
    eventBlock: params.eventBlock,
    amount0: params.swapAmount0,
    amount1: params.swapAmount1,
    rawSwapFee: params.overrideSwapFee ?? poolEntity.rawCurrentFeeTier,
    token0Entity: token0Entity,
    token1Entity: token1Entity,
    newPoolPrices: ConcentratedSqrtPriceMath.convertSqrtPriceX96ToPoolPrices({
      poolToken0: token0Entity,
      poolToken1: token1Entity,
      sqrtPriceX96: params.sqrtPriceX96,
    }),
  });
}
