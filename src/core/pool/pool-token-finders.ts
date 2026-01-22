import type { SingleChainToken as SingleChainTokenEntity } from "generated";
import { String } from "../../lib/string-utils";
import { ZERO_ADDRESS } from "../constants";
import { IndexerNetwork } from "../network";

export function findStableToken(
  token0: SingleChainTokenEntity,
  token1: SingleChainTokenEntity,
  network: IndexerNetwork,
): SingleChainTokenEntity {
  const stablecoinsAddressesLowercased = IndexerNetwork.stablecoinsAddresses[network].map<string>((address) =>
    address.toLowerCase(),
  );

  const isToken0Stable = stablecoinsAddressesLowercased.includes(token0.tokenAddress.toLowerCase());
  const isToken1Stable = stablecoinsAddressesLowercased.includes(token1!.tokenAddress.toLowerCase());

  if (isToken0Stable) return token0;
  if (isToken1Stable) return token1;

  throw new Error("Pool does not have a stable asset, no stable token can be found");
}

export function findWrappedNative(
  token0: SingleChainTokenEntity,
  token1: SingleChainTokenEntity,
  network: IndexerNetwork,
): SingleChainTokenEntity {
  const isToken0WrappedNative = String.lowercasedEquals(
    token0.tokenAddress,
    IndexerNetwork.wrappedNativeAddress[network],
  );

  const isToken1WrappedNative = String.lowercasedEquals(
    token1.tokenAddress,
    IndexerNetwork.wrappedNativeAddress[network],
  );

  if (isToken0WrappedNative) return token0;
  if (isToken1WrappedNative) return token1;

  throw new Error("Pool does not have a wrapped native asset, no wrapped native token can be found");
}

export function findNativeToken(
  token0: SingleChainTokenEntity,
  token1: SingleChainTokenEntity,
): SingleChainTokenEntity {
  const isToken0Native = String.lowercasedEquals(token0.tokenAddress, ZERO_ADDRESS);
  const isToken1Native = String.lowercasedEquals(token1.tokenAddress, ZERO_ADDRESS);

  if (isToken0Native) return token0;
  if (isToken1Native) return token1;

  throw new Error("Pool does not have a native asset, no native token can be found");
}
