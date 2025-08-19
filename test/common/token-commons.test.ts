import assert from "assert";
import { BigDecimal, Token } from "generated";
import { formatFromTokenAmount, tokenBaseAmount } from "../../src/common/token-commons";

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
