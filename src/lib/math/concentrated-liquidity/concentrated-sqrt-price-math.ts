import { BigDecimal, type Token as TokenEntity } from "generated";
import { ONE_BIG_DECIMAL, ONE_BIG_INT, Q96 } from "../../../core/constants";
import type { PoolPrices } from "../../../core/types";
import { mulDivRoundingUp } from "../math-extended";
import { SafeMath } from "../safe-math";
import { TokenDecimalMath } from "../token/token-decimal-math";

const Q192_BIG_INT = 0x1000000000000000000000000000000000000000000000000n;
const Q192_BIG_DECIMAL = new BigDecimal(Q192_BIG_INT.toString());

export const ConcentratedSqrtPriceMath = {
  convertSqrtPriceX96ToPoolPrices: _convertSqrtPriceX96ToPoolPrices,
  getAmount0Delta: _getAmount0Delta,
  getAmount1Delta: _getAmount1Delta,
};

function _convertSqrtPriceX96ToPoolPrices(params: {
  sqrtPriceX96: bigint;
  poolToken0: TokenEntity;
  poolToken1: TokenEntity;
}): PoolPrices {
  const priceX96Sq = new BigDecimal((params.sqrtPriceX96 * params.sqrtPriceX96).toString());
  const priceRaw = priceX96Sq.div(Q192_BIG_DECIMAL);

  const decimalDelta = params.poolToken0.decimals - params.poolToken1.decimals;

  let tokens1PerToken0: BigDecimal;

  if (decimalDelta === 0) {
    tokens1PerToken0 = priceRaw;
  } else if (decimalDelta > 0) {
    const adjuster = TokenDecimalMath.getDivisorBigDecimal(decimalDelta);
    tokens1PerToken0 = priceRaw.times(adjuster);
  } else {
    const adjuster = TokenDecimalMath.getDivisorBigDecimal(-decimalDelta);
    tokens1PerToken0 = priceRaw.div(adjuster);
  }

  const tokens0PerToken1 = SafeMath.div(ONE_BIG_DECIMAL, tokens1PerToken0);

  return { tokens0PerToken1, tokens1PerToken0 };
}

function _getAmount0Delta(sqrtRatioAX96: bigint, sqrtRatioBX96: bigint, liquidity: bigint, roundUp: boolean): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
  }

  const numerator1 = liquidity << 96n;
  const numerator2 = sqrtRatioBX96 - sqrtRatioAX96;

  return roundUp
    ? mulDivRoundingUp(mulDivRoundingUp(numerator1, numerator2, sqrtRatioBX96), ONE_BIG_INT, sqrtRatioAX96)
    : (numerator1 * numerator2) / sqrtRatioBX96 / sqrtRatioAX96;
}

function _getAmount1Delta(sqrtRatioAX96: bigint, sqrtRatioBX96: bigint, liquidity: bigint, roundUp: boolean): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
  }

  const difference = sqrtRatioBX96 - sqrtRatioAX96;

  return roundUp ? mulDivRoundingUp(liquidity, difference, Q96) : (liquidity * difference) / Q96;
}
