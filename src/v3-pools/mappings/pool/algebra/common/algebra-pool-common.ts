import { Pool as PoolEntity, Token as TokenEntity } from "generated";
import { getRawFeeFromTokenAmount } from "../../../../../common/pool-commons";
import { formatFromTokenAmount } from "../../../../../common/token-commons";

export function getPoolUpdatedWithAlgebraFees(params: {
  currentPoolEntity: PoolEntity;
  pluginFee: number;
  communityFee: number;
  amount0SwapAmount: bigint;
  amount1SwapAmount: bigint;
  token0: TokenEntity;
  token1: TokenEntity;
  overrideSwapFee?: number;
}): PoolEntity {
  let newPool = { ...params.currentPoolEntity };

  if (params.amount0SwapAmount > 0n) {
    const swapFeeForAmount0 = getRawFeeFromTokenAmount(
      params.amount0SwapAmount,
      params.overrideSwapFee ?? params.currentPoolEntity.currentFeeTier
    );
    const pluginFeeForAmount0 = getRawFeeFromTokenAmount(params.amount0SwapAmount, params.pluginFee);
    const communityFeeForAmount0 = (swapFeeForAmount0 * BigInt(params.communityFee)) / BigInt(1000);
    const algebraFeesDeducted = pluginFeeForAmount0 + communityFeeForAmount0;

    newPool = {
      ...newPool,
      totalValueLockedToken0: newPool.totalValueLockedToken0.minus(
        formatFromTokenAmount(algebraFeesDeducted, params.token0)
      ),
    };
  } else {
    const swapFeeForAmount1 = getRawFeeFromTokenAmount(
      params.amount1SwapAmount,
      params.overrideSwapFee ?? params.currentPoolEntity.currentFeeTier
    );
    const pluginFeeForAmount1 = getRawFeeFromTokenAmount(params.amount1SwapAmount, params.pluginFee);
    const communityFeeForAmount1 = (swapFeeForAmount1 * BigInt(params.communityFee)) / BigInt(1000);
    const algebraFeesDeducted = pluginFeeForAmount1 + communityFeeForAmount1;

    newPool = {
      ...newPool,
      totalValueLockedToken1: newPool.totalValueLockedToken1.minus(
        formatFromTokenAmount(algebraFeesDeducted, params.token1)
      ),
    };
  }

  return newPool;
}
