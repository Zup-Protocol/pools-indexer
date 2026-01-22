import { BigDecimal, type SingleChainToken as SingleChainTokenEntity } from "generated";
import { TEN_BIG_DECIMAL, TEN_BIG_INT } from "../../../core/constants";

const POWERS_OF_10_BIG_DECIMAL = new Map<number, BigDecimal>();
const POWERS_OF_10_BIG_INT = new Map<number, bigint>();

for (let i = 0; i <= 30; i++) {
  POWERS_OF_10_BIG_DECIMAL.set(i, TEN_BIG_DECIMAL.pow(i));
  POWERS_OF_10_BIG_INT.set(i, TEN_BIG_INT ** BigInt(i));
}

export const TokenDecimalMath = {
  rawToDecimal,
  tokenBaseAmount,
  decimalToRaw,
  getDivisorBigDecimal,
  getDivisorBigInt,
};

function rawToDecimal(amount: bigint, token: SingleChainTokenEntity): BigDecimal {
  const tokenAmountInBigDecimal = new BigDecimal(amount.toString());
  const tokensDivisionFactor = getDivisorBigDecimal(token.decimals);

  return tokenAmountInBigDecimal.div(tokensDivisionFactor);
}

function tokenBaseAmount(token: SingleChainTokenEntity): bigint {
  return getDivisorBigInt(token.decimals);
}

function decimalToRaw(amount: BigDecimal, token: SingleChainTokenEntity): bigint {
  const tokensMultiplicationFactor = getDivisorBigDecimal(token.decimals);

  const rawBigDecimal = amount.times(tokensMultiplicationFactor);
  return BigInt(rawBigDecimal.toFixed(0));
}

function getDivisorBigDecimal(decimals: number): BigDecimal {
  return POWERS_OF_10_BIG_DECIMAL.get(decimals) || TEN_BIG_DECIMAL.pow(decimals);
}

function getDivisorBigInt(decimals: number): bigint {
  return POWERS_OF_10_BIG_INT.get(decimals) || TEN_BIG_INT ** BigInt(decimals);
}
