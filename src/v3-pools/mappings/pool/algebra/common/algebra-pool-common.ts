import { Pool as PoolEntity, Token as TokenEntity } from "generated";
import { getRawFeeFromTokenAmount } from "../../../../../common/pool-commons";
import { formatFromTokenAmount } from "../../../../../common/token-commons";
import { ALGEBRA_COMMUNITY_FEE_DENOMINATOR } from "./constants";

export function getPoolDeductingAlgebraNonLPFees(params: {
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
  let swapFee = params.overrideSwapFee ?? params.currentPoolEntity.currentFeeTier;

  if (params.amount0SwapAmount > 0n) {
    const swapFeeForAmount0 = getRawFeeFromTokenAmount(params.amount0SwapAmount, swapFee);
    const pluginFeeForAmount0 = getRawFeeFromTokenAmount(params.amount0SwapAmount, params.pluginFee);
    const communityFeeForAmount0 =
      (swapFeeForAmount0 * BigInt(params.communityFee)) / ALGEBRA_COMMUNITY_FEE_DENOMINATOR;
    const algebraNonLPFees = pluginFeeForAmount0 + communityFeeForAmount0;

    newPool = {
      ...newPool,
      totalValueLockedToken0: newPool.totalValueLockedToken0.minus(
        formatFromTokenAmount(algebraNonLPFees, params.token0)
      ),
    };
  } else {
    const swapFeeForAmount1 = getRawFeeFromTokenAmount(params.amount1SwapAmount, swapFee);
    const pluginFeeForAmount1 = getRawFeeFromTokenAmount(params.amount1SwapAmount, params.pluginFee);
    const communityFeeForAmount1 =
      (swapFeeForAmount1 * BigInt(params.communityFee)) / ALGEBRA_COMMUNITY_FEE_DENOMINATOR;
    const algebraNonLPFees = pluginFeeForAmount1 + communityFeeForAmount1;

    newPool = {
      ...newPool,
      totalValueLockedToken1: newPool.totalValueLockedToken1.minus(
        formatFromTokenAmount(algebraNonLPFees, params.token1)
      ),
    };
  }

  return newPool;
}
