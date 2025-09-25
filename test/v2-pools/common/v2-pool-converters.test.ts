import assert from "assert";
import { BigDecimal } from "generated";
import { poolReservesToPrice } from "../../../src/v2-pools/common/v2-pool-converters";

describe("V2PoolConverters", () => {
  it("should return the correct token 0 per token 1 when calling 'poolReservesToPrice'", () => {
    const token0ReserveFormatted = BigDecimal("100");
    const token1ReserveFormatted = BigDecimal("10");
    const result = poolReservesToPrice(token0ReserveFormatted, token1ReserveFormatted);

    assert.deepEqual(result.token0PerToken1, BigDecimal("10"));
  });

  it("should return the correct token 1 per token 0 when calling 'poolReservesToPrice'", () => {
    const token0ReserveFormatted = BigDecimal("100");
    const token1ReserveFormatted = BigDecimal("10");
    const result = poolReservesToPrice(token0ReserveFormatted, token1ReserveFormatted);

    assert.deepEqual(result.token1PerToken0, BigDecimal("0.1"));
  });
});
