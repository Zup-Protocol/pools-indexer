import { BigDecimal } from "generated";
import { FIFTY_BIG_DECIMAL, HUNDRED_BIG_DECIMAL, TEN_BIG_DECIMAL, ZERO_BIG_DECIMAL } from "../../core/constants";
import { SafeMath } from "./safe-math";

export function percentageDifference(a: BigDecimal, b: BigDecimal): BigDecimal {
  let diff: BigDecimal;
  let denominator: BigDecimal;

  if (b.lt(a)) {
    diff = a.minus(b);
    denominator = b;
  } else {
    diff = b.minus(a);
    denominator = a;
  }

  if (denominator.eq(ZERO_BIG_DECIMAL)) return ZERO_BIG_DECIMAL;

  return SafeMath.div(diff, denominator).times(HUNDRED_BIG_DECIMAL);
}

export function isPercentageDifferenceWithinThreshold(a: BigDecimal, b: BigDecimal, threshold: number): boolean {
  if (a.eq(ZERO_BIG_DECIMAL)) return b.eq(ZERO_BIG_DECIMAL);
  if (b.eq(ZERO_BIG_DECIMAL)) return false;

  let diff: BigDecimal;
  let minVal: BigDecimal;

  if (b.lt(a)) {
    diff = a.minus(b);
    minVal = b;
  } else {
    diff = b.minus(a);
    minVal = a;
  }

  const leftSide = diff.times(HUNDRED_BIG_DECIMAL);

  let rightSide: BigDecimal;

  if (threshold === 10) rightSide = minVal.times(TEN_BIG_DECIMAL);
  else if (threshold === 50) rightSide = minVal.times(FIFTY_BIG_DECIMAL);
  else rightSide = minVal.times(threshold); // Fallback for custom

  return leftSide.lte(rightSide);
}
