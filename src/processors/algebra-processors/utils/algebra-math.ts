import type { BigDecimal, Pool as PoolEntity, SingleChainToken as SingleChainTokenEntity } from "generated";
import { ZERO_BIG_DECIMAL } from "../../../core/constants";
import { FeeMath } from "../../../lib/math/fee-math";
import { TokenDecimalMath } from "../../../lib/math/token/token-decimal-math";
import { ALGEBRA_COMMUNITY_FEE_DENOMINATOR } from "./constants";

export const AlgebraMath = {
  calculateAlgebraNonLPFeesAmount,
};

function calculateAlgebraNonLPFeesAmount(params: {
  poolEntity: PoolEntity;
  rawPluginFee: number;
  rawCommunityFee: number;
  swapAmount0: bigint;
  swapAmount1: bigint;
  token0: SingleChainTokenEntity;
  token1: SingleChainTokenEntity;
  rawSwapFee: number;
}): { token0FeeAmount: BigDecimal; token1FeeAmount: BigDecimal } {
  if (params.swapAmount0 > 0n) {
    const swapFeeTokenAmount = FeeMath.calculateRawSwapFeeFromTokenAmount(params.swapAmount0, params.rawSwapFee);
    const pluginFeeTokenAmount = FeeMath.calculateRawSwapFeeFromTokenAmount(params.swapAmount0, params.rawPluginFee);
    const communityFeeTokenAmount =
      (swapFeeTokenAmount * BigInt(params.rawCommunityFee)) / BigInt(ALGEBRA_COMMUNITY_FEE_DENOMINATOR);
    const algebraNonLPFees = pluginFeeTokenAmount + communityFeeTokenAmount;

    return {
      token0FeeAmount: TokenDecimalMath.rawToDecimal(algebraNonLPFees, params.token0),
      token1FeeAmount: ZERO_BIG_DECIMAL,
    };
  }

  const swapFeeTokenAmount = FeeMath.calculateRawSwapFeeFromTokenAmount(params.swapAmount1, params.rawSwapFee);
  const pluginFeeTokenAmount = FeeMath.calculateRawSwapFeeFromTokenAmount(params.swapAmount1, params.rawPluginFee);
  const communityFeeTokenAmount =
    (swapFeeTokenAmount * BigInt(params.rawCommunityFee)) / BigInt(ALGEBRA_COMMUNITY_FEE_DENOMINATOR);
  const algebraNonLPFees = pluginFeeTokenAmount + communityFeeTokenAmount;

  return {
    token0FeeAmount: ZERO_BIG_DECIMAL,
    token1FeeAmount: TokenDecimalMath.rawToDecimal(algebraNonLPFees, params.token1),
  };
}
