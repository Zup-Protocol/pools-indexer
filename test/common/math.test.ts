import assert from "assert";
import { BigDecimal } from "generated";
import { ZERO_BIG_DECIMAL } from "../../src/common/constants";
import {
  hexToBigInt,
  isPercentageDifferenceWithinThreshold,
  mulDivRoundingUp,
  percentageDifference,
  safeDiv,
} from "../../src/common/math";

describe("Math", () => {
  it("When passing the `b` param as zero in safeDiv, instead of throwing, it should return zero", () => {
    const a = BigDecimal("1");
    const b = BigDecimal("0");

    const result = safeDiv(a, b);

    assert.equal(result.toString(), ZERO_BIG_DECIMAL.toString());
  });

  it("When passing the `a` and `b` param as non zero in safeDiv, it should simply divide them", () => {
    const a = BigDecimal("10");
    const b = BigDecimal("2");

    const result = safeDiv(a, b);

    assert.equal(result.toString(), BigDecimal("5").toString());
  });

  it("when passing a hex, it should converts hex string to BigInt", () => {
    assert.equal(hexToBigInt("0x10").toString(), BigInt(16).toString());
  });

  it("mulDivRoundingUp rounds up when remainder exists", () => {
    const a = BigInt(10);
    const b = BigInt(10);
    const denominator = BigInt(3);

    assert.equal(mulDivRoundingUp(a, b, denominator), 34);
  });

  it("mulDivRoundingUp does not round up when no remainder", () => {
    const a = BigInt(12);
    const b = BigInt(10);
    const denominator = BigInt(4);

    assert.equal(mulDivRoundingUp(a, b, denominator), 30);
  });

  it(`should return the percentage difference between two numbers
    when base number is lower than comparison number`, () => {
    let result = percentageDifference(BigDecimal(10), BigDecimal(20));

    assert.deepEqual(result, BigDecimal(100));
  });

  it(`should return the positive percentage difference between two numbers
    when base number is greater than comparison number`, () => {
    let result = percentageDifference(BigDecimal(50), BigDecimal(25));

    assert.deepEqual(result, BigDecimal(100));
  });

  it(`should return true if the percentage difference
    between two numbers are within the percentage
    threshold passed`, () => {
    let result = isPercentageDifferenceWithinThreshold(BigDecimal(10), BigDecimal(20), 110);

    assert.equal(result, true);
  });

  it(`should return false if the percentage difference
    between two numbers are not within the percentage
    threshold passed`, () => {
    let result = isPercentageDifferenceWithinThreshold(BigDecimal(50), BigDecimal(5), 100);

    assert.equal(result, false);
  });

  it("should return true if both base and comparison number are zero, regardless of percentage threshold", () => {
    let result = isPercentageDifferenceWithinThreshold(ZERO_BIG_DECIMAL, ZERO_BIG_DECIMAL, 17527615276);

    assert.equal(result, true);
  });

  it(`should return false if the base number is zero,
    regardless of percentage threshold or comparison number`, () => {
    let result = isPercentageDifferenceWithinThreshold(
      ZERO_BIG_DECIMAL,
      BigDecimal("21757182618726187281"),
      17527615276
    );

    assert.equal(result, false);
  });

  it(`should return false if the comparison number is zero,
    regardless of percentage threshold or base number`, () => {
    let result = isPercentageDifferenceWithinThreshold(
      BigDecimal("21757182618726187281"),
      ZERO_BIG_DECIMAL,
      17527615276
    );

    assert.equal(result, false);
  });
});
