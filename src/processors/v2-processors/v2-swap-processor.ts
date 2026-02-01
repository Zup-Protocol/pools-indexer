import type { Block_t, handlerContext, SingleChainToken as SingleChainTokenEntity } from "generated";
import { Id } from "../../core/entity";
import { IndexerNetwork } from "../../core/network";
import { ConstantProductPriceMath } from "../../lib/math/constant-product/constant-product-price-math";
import { TokenDecimalMath } from "../../lib/math/token/token-decimal-math";
import { processSwap } from "../swap-processor";

export async function processV2Swap(params: {
  context: handlerContext;
  poolAddress: string;
  network: IndexerNetwork;
  eventBlock: Block_t;
  amount0In: bigint;
  amount1In: bigint;
  amount0Out: bigint;
  amount1Out: bigint;
}): Promise<void> {
  const poolEntity = await params.context.Pool.getOrThrow(Id.fromAddress(params.network, params.poolAddress));

  const [token0Entity, token1Entity]: [SingleChainTokenEntity, SingleChainTokenEntity] = await Promise.all([
    params.context.SingleChainToken.getOrThrow(poolEntity.token0_id),
    params.context.SingleChainToken.getOrThrow(poolEntity.token1_id),
  ]);

  const rawAmount0 = params.amount0In - params.amount0Out;
  const rawAmount1 = params.amount1In - params.amount1Out;

  const tokenAmount0InFormatted = TokenDecimalMath.rawToDecimal(params.amount0In, token0Entity);
  const tokenAmount1InFormatted = TokenDecimalMath.rawToDecimal(params.amount1In, token1Entity);

  const tokenAmount0OutFormatted = TokenDecimalMath.rawToDecimal(params.amount0Out, token0Entity);
  const tokenAmount1OutFormatted = TokenDecimalMath.rawToDecimal(params.amount1Out, token1Entity);

  const amount0Formatted = tokenAmount0InFormatted.minus(tokenAmount0OutFormatted);
  const amount1Formatted = tokenAmount1InFormatted.minus(tokenAmount1OutFormatted);

  const updatedPoolTotalValueLockedToken0 = poolEntity.totalValueLockedToken0.plus(amount0Formatted);
  const updatedPoolTotalValueLockedToken1 = poolEntity.totalValueLockedToken1.plus(amount1Formatted);

  const poolPrice = ConstantProductPriceMath.poolReservesToPrice(
    updatedPoolTotalValueLockedToken0,
    updatedPoolTotalValueLockedToken1,
  );

  await processSwap({
    amount0: rawAmount0,
    amount1: rawAmount1,
    context: params.context,
    eventBlock: params.eventBlock,
    network: params.network,
    newPoolPrices: poolPrice,
    poolAddress: params.poolAddress,
    rawSwapFee: poolEntity.rawCurrentFeeTier,
    token0Entity: token0Entity,
    token1Entity: token1Entity,
  });
}
