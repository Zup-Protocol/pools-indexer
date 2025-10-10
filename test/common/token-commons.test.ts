import assert from "assert";
import { BigDecimal, Pool, Token } from "generated";
import { formatFromTokenAmount, pickMostLiquidPoolForToken, tokenBaseAmount } from "../../src/common/token-commons";
import { PoolMock, TokenMock } from "../mocks";

describe("TokenCommons", () => {
  it(`'tokenBaseAmount' should return the base amount
      for a token based on its decimals
      It is, when a token has 6 decimals, the base amount is 10^6
      `, () => {
    const token: Token = {
      id: "toko-0",
      tokenAddress: "0x0000000000000000000000000000000000000001",
      decimals: 18,
    } as Token;

    assert.equal(tokenBaseAmount(token), BigInt("1000000000000000000"));
  });

  it(`'formatFromTokenAmount' should return the passed token amount
      as normal decimal number(e.g 1.0 instead of 1000000000000000000)
      `, () => {
    const token: Token = {
      id: "toko-0",
      tokenAddress: "0x0000000000000000000000000000000000000001",
      decimals: 18,
    } as Token;

    let formattedAmount = formatFromTokenAmount(BigInt(1.76 * 10 ** 18), token);

    assert.equal(formattedAmount.toString(), BigDecimal("1.76").toString());
  });

  it(`should return the other pool if the current pool is undefined when
    calling 'pickMostLiquidPoolForToken'`, () => {
    const token = new TokenMock();
    const currentPool = undefined;
    const otherPool = new PoolMock("Xabas ID");

    assert.deepEqual(pickMostLiquidPoolForToken(token, otherPool, currentPool), otherPool);
  });

  it(`should return the other pool if the current pool has less tokens
    then the other pool, when calling 'pickMostLiquidPoolForToken'`, () => {
    const token = new TokenMock();
    const currentPool: Pool = {
      ...new PoolMock("Sabax ID"),
      token0_id: token.id,
      totalValueLockedToken0: BigDecimal("10"),
    };

    const otherPool: Pool = {
      ...new PoolMock("Xabas ID"),
      token1_id: token.id,
      totalValueLockedToken1: BigDecimal("12861725172581"),
    };

    assert.deepEqual(pickMostLiquidPoolForToken(token, otherPool, currentPool), otherPool);
  });

  it(`should return the current pool if the other pool has less tokens
    then the current pool, when calling 'pickMostLiquidPoolForToken'`, () => {
    const token = new TokenMock();
    const currentPool: Pool = {
      ...new PoolMock("Sabax ID"),
      token0_id: token.id,
      totalValueLockedToken0: BigDecimal("18261892"),
    };

    const otherPool: Pool = {
      ...new PoolMock("Xabas ID"),
      token1_id: token.id,
      totalValueLockedToken1: BigDecimal("1111"),
    };

    assert.deepEqual(pickMostLiquidPoolForToken(token, otherPool, currentPool), currentPool);
  });

  it(`should return the current pool containing less tokens than the other
    if the token price is zero, and the current pool tvl USD based on the
    other token with a price set is higher`, () => {
    const token: Token = {
      ...new TokenMock(),
      usdPrice: BigDecimal("0"),
    };

    const currentPool: Pool = {
      ...new PoolMock("Sabax ID"),
      token0_id: token.id,
      totalValueLockedToken0: BigDecimal("10"),
      totalValueLockedUSD: BigDecimal("88899988"),
    };

    const otherPool: Pool = {
      ...new PoolMock("Xabas ID"),
      token1_id: token.id,
      totalValueLockedUSD: BigDecimal("12010"),
      totalValueLockedToken1: BigDecimal("12618926178921"),
    };

    assert.deepEqual(pickMostLiquidPoolForToken(token, otherPool, currentPool), currentPool);
  });

  it(`should return the other pool containing less tokens than the current
    if the token price is zero, and the other pool tvl USD based on the
    other token with a price set is higher`, () => {
    const token: Token = {
      ...new TokenMock(),
      usdPrice: BigDecimal("0"),
    };

    const currentPool: Pool = {
      ...new PoolMock("Sabax ID"),
      token0_id: token.id,
      totalValueLockedToken0: BigDecimal("27190261026182618219"),
      totalValueLockedUSD: BigDecimal("121212121"),
    };

    const otherPool: Pool = {
      ...new PoolMock("Xabas ID"),
      token1_id: token.id,
      totalValueLockedUSD: BigDecimal("1261982618962918"),
      totalValueLockedToken1: BigDecimal("126"),
    };

    assert.deepEqual(pickMostLiquidPoolForToken(token, otherPool, currentPool), otherPool);
  });
});
