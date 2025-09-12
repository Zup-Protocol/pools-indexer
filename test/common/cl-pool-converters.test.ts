import assert from "assert";
import { BigDecimal } from "generated";
import { sqrtPriceX96toPrice } from "../../src/common/cl-pool-converters";
import { TokenMock } from "../mocks";

describe("CLPoolConverters", () => {
  it(`When passing a SqrtPriceX96 to 'sqrtPriceX96toPrice'
    it should return the pool token prices based on each other
    `, () => {
    let token0 = new TokenMock("0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"); // UNI
    let token1 = new TokenMock("0xdAC17F958D2ee523a2206206994597C13D831ec7"); // USDT

    token0 = {
      ...token0,
      decimals: 18,
    };

    token1 = {
      ...token1,
      decimals: 6,
    };

    let sqrtPriceX96 = BigInt("294761047928095129673970");
    let expectedToken0PerToken1 = BigDecimal("0.0722468612074804166");
    let expectedToken1PerToken0 = BigDecimal("13.84143177");

    let prices = sqrtPriceX96toPrice(sqrtPriceX96, token0, token1);

    assert.deepEqual(
      prices.token0PerToken1,
      expectedToken0PerToken1,
      `token0PerToken1 is not correct, expected: ${expectedToken0PerToken1.toString()}, actual: ${prices.token0PerToken1.toString()}`
    );

    assert.deepEqual(
      prices.token1PerToken0,
      expectedToken1PerToken0,
      `token1PerToken0 is not correct, expected: ${expectedToken1PerToken0.toString()}, actual: ${prices.token1PerToken0.toString()}`
    );
  });
});
