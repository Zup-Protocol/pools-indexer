import { createHash } from "crypto";
import { Pool as PoolEntity, Token, Token as TokenEntity } from "generated";
import "../../src/common/string.extension";
import { ONE_HOUR_IN_SECONDS, ZERO_ADDRESS } from "./constants";
import { IndexerNetwork } from "./enums/indexer-network";

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
  let secondsPerHour = BigInt(ONE_HOUR_IN_SECONDS);
  let hourId = (blockTimestampInSeconds - pool.createdAtTimestamp) / secondsPerHour;

  let hourIdAddress = createHash("sha256").update(hourId.toString()).digest("hex");
  let id = pool.poolAddress + hourIdAddress;

  return IndexerNetwork.getEntityIdFromAddress(pool.chainId, id);
}

export function getPoolDailyDataId(blockTimestamp: bigint, pool: PoolEntity): string {
  let secondsPerDay = 86_400;
  let dayId = (blockTimestamp - pool.createdAtTimestamp) / BigInt(secondsPerDay);

  let dayIdAddress = createHash("sha256").update(dayId.toString()).digest("hex");
  let id = pool.poolAddress + dayIdAddress;

  return IndexerNetwork.getEntityIdFromAddress(pool.chainId, id);
}
