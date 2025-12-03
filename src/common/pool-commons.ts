import { createHash } from "crypto";
import { BigDecimal, PoolDailyData, Pool as PoolEntity, PoolHourlyData, Token, Token as TokenEntity } from "generated";
import { HandlerContext } from "generated/src/Types";
import "../../src/common/string.extension";
import { ONE_HOUR_IN_SECONDS, ZERO_ADDRESS, ZERO_BIG_DECIMAL } from "./constants";
import { subtractDaysFromSecondsTimestamp, subtractHoursFromSecondsTimestamp } from "./date-commons";
import { IndexerNetwork } from "./enums/indexer-network";
import { formatFromTokenAmount } from "./token-commons";

export function isPoolSwapVolumeValid(pool: PoolEntity) {
  return pool.swapVolumeUSD.gt(ZERO_BIG_DECIMAL);
}

export function getLiquidityInflowAndOutflowFromRawAmounts(
  amount0: bigint,
  amount1: bigint,
  token0: TokenEntity,
  token1: TokenEntity
): {
  inflowToken0: BigDecimal;
  inflowToken1: BigDecimal;
  outflowToken0: BigDecimal;
  outflowToken1: BigDecimal;
  inflowUSD: BigDecimal;
  outflowUSD: BigDecimal;
  netInflowToken0: BigDecimal;
  netInflowToken1: BigDecimal;
  netInflowUSD: BigDecimal;
} {
  const amount0Formatted = formatFromTokenAmount(amount0, token0);
  const amount1Formatted = formatFromTokenAmount(amount1, token1);
  const isAmount0Positive = amount0 > 0;
  const isAmount1Positive = amount1 > 0;

  const inflowToken0 = isAmount0Positive ? amount0Formatted : ZERO_BIG_DECIMAL;
  const inflowToken1 = isAmount1Positive ? amount1Formatted : ZERO_BIG_DECIMAL;
  const outflowToken0 = isAmount0Positive ? ZERO_BIG_DECIMAL : amount0Formatted.abs();
  const outflowToken1 = isAmount1Positive ? ZERO_BIG_DECIMAL : amount1Formatted.abs();
  const inflowUSD = inflowToken0.times(token0.usdPrice).plus(inflowToken1.times(token1.usdPrice));
  const outflowUSD = outflowToken0.times(token0.usdPrice).plus(outflowToken1.times(token1.usdPrice));
  const netInflowToken0 = amount0Formatted;
  const netInflowToken1 = amount1Formatted;
  const netInflowUSD = inflowUSD.minus(outflowUSD);

  return {
    inflowToken0: inflowToken0,
    inflowToken1: inflowToken1,
    outflowToken0: outflowToken0,
    outflowToken1: outflowToken1,
    inflowUSD: inflowUSD,
    outflowUSD: outflowUSD,
    netInflowToken0: netInflowToken0,
    netInflowToken1: netInflowToken1,
    netInflowUSD: netInflowUSD,
  };
}

export function getSwapVolumeFromAmounts(
  amount0: BigDecimal,
  amount1: BigDecimal,
  token0: TokenEntity,
  token1: TokenEntity
): {
  volumeToken0: BigDecimal;
  volumeToken1: BigDecimal;
  volumeUSD: BigDecimal;
  volumeToken0USD: BigDecimal;
  volumeToken1USD: BigDecimal;
} {
  if (amount0.lt(ZERO_BIG_DECIMAL)) {
    return {
      volumeUSD: amount1.times(token1.usdPrice),
      volumeToken1USD: amount1.times(token1.usdPrice),
      volumeToken1: amount1,
      volumeToken0: ZERO_BIG_DECIMAL,
      volumeToken0USD: ZERO_BIG_DECIMAL,
    };
  }

  return {
    volumeUSD: amount0.times(token0.usdPrice),
    volumeToken0USD: amount0.times(token0.usdPrice),
    volumeToken0: amount0,
    volumeToken1: ZERO_BIG_DECIMAL,
    volumeToken1USD: ZERO_BIG_DECIMAL,
  };
}

export function getSwapFeesFromRawAmounts(
  rawAmount0: bigint,
  rawAmount1: bigint,
  rawSwapFee: number,
  token0: TokenEntity,
  token1: TokenEntity
): { feeToken0: BigDecimal; feeToken1: BigDecimal; feesUSD: BigDecimal } {
  if (rawAmount0 < 0) {
    const tokenFees = formatFromTokenAmount(getRawFeeFromTokenAmount(rawAmount1, rawSwapFee), token1);

    return {
      feesUSD: tokenFees.times(token1.usdPrice),
      feeToken1: tokenFees,
      feeToken0: ZERO_BIG_DECIMAL,
    };
  }

  const tokenFees = formatFromTokenAmount(getRawFeeFromTokenAmount(rawAmount0, rawSwapFee), token0);

  return {
    feesUSD: tokenFees.times(token0.usdPrice),
    feeToken0: tokenFees,
    feeToken1: ZERO_BIG_DECIMAL,
  };
}

export function getRawFeeFromTokenAmount(rawTokenAmount: bigint, rawFee: number): bigint {
  return (rawTokenAmount * BigInt(rawFee)) / BigInt(1000000);
}

export function isVariableWithStablePool(token0: TokenEntity, token1: TokenEntity, network: IndexerNetwork): boolean {
  const stablecoinsAddressesLowercased = IndexerNetwork.stablecoinsAddresses(network).map<string>((address) =>
    address.toLowerCase()
  );

  const isToken0Stable = stablecoinsAddressesLowercased.includes(token0.tokenAddress.toLowerCase());
  const isToken1Stable = stablecoinsAddressesLowercased.includes(token1.tokenAddress.toLowerCase());

  if ((isToken0Stable && !isToken1Stable) || (!isToken0Stable && isToken1Stable)) return true;

  return false;
}

export function isStablePool(token0: Token, token1: TokenEntity, network: IndexerNetwork): boolean {
  const stablecoinsAddressesLowercased = IndexerNetwork.stablecoinsAddresses(network).map<string>((address) =>
    address.toLowerCase()
  );

  const isToken0Stable = stablecoinsAddressesLowercased.includes(token0.tokenAddress.toLowerCase());
  const isToken1Stable = stablecoinsAddressesLowercased.includes(token1.tokenAddress.toLowerCase());

  if (isToken0Stable && isToken1Stable) return true;

  return false;
}

export function isWrappedNativePool(token0: TokenEntity, token1: TokenEntity, network: IndexerNetwork): boolean {
  const isToken0WrappedNative = token0.tokenAddress.lowercasedEquals(IndexerNetwork.wrappedNativeAddress(network));
  const isToken1WrappedNative = token1.tokenAddress.lowercasedEquals(IndexerNetwork.wrappedNativeAddress(network));

  if (isToken0WrappedNative || isToken1WrappedNative) return true;

  return false;
}

export function isNativePool(token0: TokenEntity, token1: TokenEntity): boolean {
  const isToken0Native = token0.tokenAddress.lowercasedEquals(ZERO_ADDRESS);
  const isToken1Native = token1.tokenAddress.lowercasedEquals(ZERO_ADDRESS);

  if (isToken0Native || isToken1Native) return true;

  return false;
}

export function findStableToken(token0: TokenEntity, token1: TokenEntity, network: IndexerNetwork): TokenEntity {
  const stablecoinsAddressesLowercased = IndexerNetwork.stablecoinsAddresses(network).map<string>((address) =>
    address.toLowerCase()
  );

  const isToken0Stable = stablecoinsAddressesLowercased.includes(token0.tokenAddress.toLowerCase());
  const isToken1Stable = stablecoinsAddressesLowercased.includes(token1!.tokenAddress.toLowerCase());

  if (isToken0Stable) return token0;
  if (isToken1Stable) return token1;

  throw new Error("Pool does not have a stable asset, no stable token can be found");
}

export function findWrappedNative(token0: TokenEntity, token1: TokenEntity, network: IndexerNetwork): TokenEntity {
  const isToken0WrappedNative = token0.tokenAddress.lowercasedEquals(IndexerNetwork.wrappedNativeAddress(network));
  const isToken1WrappedNative = token1.tokenAddress.lowercasedEquals(IndexerNetwork.wrappedNativeAddress(network));

  if (isToken0WrappedNative) return token0;
  if (isToken1WrappedNative) return token1;

  throw new Error("Pool does not have a wrapped native asset, no wrapped native token can be found");
}

export function findNativeToken(token0: TokenEntity, token1: TokenEntity): TokenEntity {
  const isToken0Native = token0.tokenAddress.lowercasedEquals(ZERO_ADDRESS);
  const isToken1Native = token1.tokenAddress.lowercasedEquals(ZERO_ADDRESS);

  if (isToken0Native) return token0;
  if (isToken1Native) return token1;

  throw new Error("Pool does not have a native asset, no native token can be found");
}

export function getPoolHourlyDataId(blockTimestampInSeconds: bigint, pool: PoolEntity): string {
  const secondsPerHour = BigInt(ONE_HOUR_IN_SECONDS);
  const hourId = (blockTimestampInSeconds - pool.createdAtTimestamp) / secondsPerHour;

  const hourIdAddress = createHash("sha256").update(hourId.toString()).digest("hex");
  const id = pool.poolAddress + hourIdAddress;

  return IndexerNetwork.getEntityIdFromAddress(pool.chainId, id);
}

export function getPoolDailyDataId(blockTimestamp: bigint, pool: PoolEntity): string {
  const secondsPerDay = 86_400;
  const dayId = (blockTimestamp - pool.createdAtTimestamp) / BigInt(secondsPerDay);

  const dayIdAddress = createHash("sha256").update(dayId.toString()).digest("hex");
  const id = pool.poolAddress + dayIdAddress;

  return IndexerNetwork.getEntityIdFromAddress(pool.chainId, id);
}

export function getTokenAmountInPool(pool: PoolEntity, token: TokenEntity): BigDecimal {
  if (pool.token0_id.lowercasedEquals(token.id)) return pool.totalValueLockedToken0;
  if (pool.token1_id.lowercasedEquals(token.id)) return pool.totalValueLockedToken1;

  throw new Error("The passed token doesn't match any token in the passed pool");
}

export function calculateDayYearlyYield(totalValueLockedUSD: BigDecimal, dayFeesUSD: BigDecimal) {
  return dayFeesUSD.div(totalValueLockedUSD).times(100).times(365);
}

export function calculateHourYearlyYield(totalValueLockedUSD: BigDecimal, feesUSD: BigDecimal) {
  return feesUSD
    .div(totalValueLockedUSD)
    .times(100)
    .times(24 * 365);
}

export async function getPoolHourlyDataAgo(
  hoursAgo: number,
  eventTimestamp: bigint,
  context: HandlerContext,
  pool: PoolEntity
): Promise<PoolHourlyData | null | undefined> {
  const timestampAgo = subtractHoursFromSecondsTimestamp(eventTimestamp, hoursAgo);
  if (timestampAgo < pool.createdAtTimestamp) return null;

  return await context.PoolHourlyData.get(getPoolHourlyDataId(timestampAgo, pool));
}

export async function getPoolDailyDataAgo(
  daysAgo: number,
  eventTimestamp: bigint,
  context: HandlerContext,
  pool: PoolEntity
): Promise<PoolDailyData | undefined | null> {
  const timestampAgo = subtractDaysFromSecondsTimestamp(eventTimestamp, daysAgo);
  if (timestampAgo < pool.createdAtTimestamp) return null;

  return await context.PoolDailyData.get(getPoolDailyDataId(timestampAgo, pool));
}
