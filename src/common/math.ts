import { BigDecimal } from "generated";
import { bytesToBigInt, hexToBytes } from "viem";
import { ONE_BIG_INT, ZERO_BIG_DECIMAL } from "./constants";

export function safeDiv(a: BigDecimal, b: BigDecimal): BigDecimal {
  if (b.eq(ZERO_BIG_DECIMAL)) return ZERO_BIG_DECIMAL;

  return a.div(b);
}

export function hexToBigInt(hex: `0x${string}`): bigint {
  return bytesToBigInt(hexToBytes(hex));
}

export function mulDivRoundingUp(a: bigint, b: bigint, denominator: bigint): bigint {
  const product = a * b;
  let result = product / denominator;

  if (!(product % denominator == BigInt(0))) result = result + ONE_BIG_INT;
  return result;
}

export function percentageDifference(baseNumber: BigDecimal, comparisonNumber: BigDecimal): BigDecimal {
  const diff = comparisonNumber.lt(baseNumber)
    ? baseNumber.minus(comparisonNumber)
    : comparisonNumber.minus(baseNumber);

  return safeDiv(diff, comparisonNumber.lt(baseNumber) ? comparisonNumber : baseNumber).times(BigDecimal(100));
}

export function isPercentageDifferenceWithinThreshold(
  baseNumber: BigDecimal,
  comparisonNumber: BigDecimal,
  maxPercentThreshold: number
): boolean {
  if (comparisonNumber.eq(ZERO_BIG_DECIMAL) && baseNumber.eq(ZERO_BIG_DECIMAL)) return true;
  if (comparisonNumber.eq(ZERO_BIG_DECIMAL) || baseNumber.eq(ZERO_BIG_DECIMAL)) return false;

  return percentageDifference(baseNumber, comparisonNumber).lte(BigDecimal(maxPercentThreshold));
}
