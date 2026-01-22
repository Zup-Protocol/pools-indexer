import { ONE_BIG_INT, ZERO_BIG_INT } from "../../core/constants";

export function mulDivRoundingUp(a: bigint, b: bigint, denominator: bigint): bigint {
  const product = a * b;
  let result = product / denominator;

  if (!(product % denominator == ZERO_BIG_INT)) result = result + ONE_BIG_INT;
  return result;
}

const SHIFT_128 = 128n;

export function mulShift128(val: bigint, mulBy: bigint): bigint {
  return (val * mulBy) >> SHIFT_128;
}
