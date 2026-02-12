import { BigDecimal } from "generated";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZERO_BIG_DECIMAL } from "../../core/constants";
import { IndexerNetwork } from "../../core/network";
import {
  findNativeToken,
  findStableToken,
  findWrappedNative,
  isNativePool,
  isStableOnlyPool,
  isVariableWithStablePool,
  isWrappedNativePool,
} from "../../core/pool";
import { PriceDiscover } from "./price-discover";

// Mock the module
vi.mock("../../core/pool");

describe("PriceDiscover.discoverUsdPricesFromPoolPrices", () => {
  const NETWORK = IndexerNetwork.ETHEREUM;
  const POOL_PRICES = {
    tokens0PerToken1: BigDecimal("0.5"), // 1 Token1 = 0.5 Token0
    tokens1PerToken0: BigDecimal("2.0"), // 1 Token0 = 2.0 Token1
  };

  const TOKEN0 = { id: "0x0", usdPrice: ZERO_BIG_DECIMAL, trackedUsdPrice: ZERO_BIG_DECIMAL } as any;
  const TOKEN1 = { id: "0x1", usdPrice: ZERO_BIG_DECIMAL, trackedUsdPrice: ZERO_BIG_DECIMAL } as any;

  beforeEach(() => {
    vi.resetAllMocks();
    // Default: Not any special pool type
    vi.mocked(isVariableWithStablePool).mockReturnValue(false);
    vi.mocked(isNativePool).mockReturnValue(false);
    vi.mocked(isWrappedNativePool).mockReturnValue(false);
    vi.mocked(isStableOnlyPool).mockReturnValue(false);
  });

  it("should return prices from pool ratios if one token has price (BUG FIX CASE)", () => {
    const token1Priced = { ...TOKEN1, usdPrice: BigDecimal("100") };
    const token0Unpriced = { ...TOKEN0, usdPrice: ZERO_BIG_DECIMAL }; // Price 0

    const [p0, p1] = PriceDiscover.discoverUsdPricesFromPoolPrices({
      network: NETWORK,
      poolPrices: POOL_PRICES,
      poolToken0Entity: token0Unpriced,
      poolToken1Entity: token1Priced,
      useTrackedPrices: false,
    });

    // 1 T1 = 0.5 T0. 1 T1 = $100.
    // 0.5 T0 = $100 -> 1 T0 = $200.
    expect(p0.toString()).toBe("200");
    expect(p1.toString()).toBe("100");
  });

  it("should derive price even if token ALREADY has a price (The Fix)", () => {
    const token1Priced = { ...TOKEN1, usdPrice: BigDecimal("100") };
    const token0WrongPrice = { ...TOKEN0, usdPrice: BigDecimal("500") };

    const [p0, p1] = PriceDiscover.discoverUsdPricesFromPoolPrices({
      network: NETWORK,
      poolPrices: POOL_PRICES,
      poolToken0Entity: token0WrongPrice,
      poolToken1Entity: token1Priced,
      useTrackedPrices: false,
    });

    // p0 derived from p1 (100) -> 200.
    // p1 derived from p0 (500) -> 250?
    // In logic:
    // 1. isToken1Priced -> p0 = p1 * ratio = 100 * 2.0 = 200.
    // 2. isToken0Priced -> p1 = p0 * ratio = 500 * 0.5 = 250.
    // Note: Logic uses params.poolTokenXEntity for 'isPriced' check and source price.

    expect(p0.toString()).toBe("200");
    expect(p1.toString()).toBe("250");
  });

  it("should handle VariableWithStablePool (Stable is Token0)", () => {
    vi.mocked(isVariableWithStablePool).mockReturnValue(true);
    vi.mocked(findStableToken).mockReturnValue({ ...TOKEN0, id: TOKEN0.id } as any);

    const [p0, p1] = PriceDiscover.discoverUsdPricesFromPoolPrices({
      network: NETWORK,
      poolPrices: POOL_PRICES,
      poolToken0Entity: TOKEN0,
      poolToken1Entity: TOKEN1,
    });

    // Stable T0 = $1.
    // T1 price in T0 = tokens0PerToken1 = 0.5.
    // So p1 = 0.5.
    // p0 derived from p1? No, special logic:
    // if stable is T0:
    // p1 = tokens0PerToken1 (0.5)
    // p0 = tokens1PerToken0 * p1 = 2.0 * 0.5 = 1.0.

    expect(p0.toString()).toBe("1");
    expect(p1.toString()).toBe("0.5");
  });

  it("should handle NativePool (Native is Token0)", () => {
    vi.mocked(isNativePool).mockReturnValue(true);
    vi.mocked(findNativeToken).mockReturnValue({ ...TOKEN0, id: TOKEN0.id } as any);

    const token0Native = { ...TOKEN0, usdPrice: BigDecimal("2000") };

    const [p0, p1] = PriceDiscover.discoverUsdPricesFromPoolPrices({
      network: NETWORK,
      poolPrices: POOL_PRICES,
      poolToken0Entity: token0Native,
      poolToken1Entity: TOKEN1,
    });

    // Using usdPrice since useTrackedPrices is undefined (defaults to ?)
    // Function signature: useTrackedPrices?: boolean
    // Implementation:
    // const token0Price = params.useTrackedPrices ? ... : ...
    // So undefined -> false.

    expect(p0.toString()).toBe("2000");
    expect(p1.toString()).toBe("1000"); // 0.5 * 2000
  });

  it("should handle WrappedNativePool (Wrapped is Token1)", () => {
    vi.mocked(isWrappedNativePool).mockReturnValue(true);
    vi.mocked(findWrappedNative).mockReturnValue({ ...TOKEN1, id: TOKEN1.id } as any);

    const token1Wrapped = { ...TOKEN1, usdPrice: BigDecimal("3000") };

    const [p0, p1] = PriceDiscover.discoverUsdPricesFromPoolPrices({
      network: NETWORK,
      poolPrices: POOL_PRICES,
      poolToken0Entity: TOKEN0,
      poolToken1Entity: token1Wrapped,
    });

    expect(p0.toString()).toBe("6000"); // 2.0 * 3000
    expect(p1.toString()).toBe("3000");
  });

  it("should return raw ratios for StableOnlyPool", () => {
    vi.mocked(isStableOnlyPool).mockReturnValue(true);

    const [p0, p1] = PriceDiscover.discoverUsdPricesFromPoolPrices({
      network: NETWORK,
      poolPrices: POOL_PRICES,
      poolToken0Entity: TOKEN0,
      poolToken1Entity: TOKEN1,
    });

    expect(p0.toString()).toBe("2");
    expect(p1.toString()).toBe("0.5");
  });
});
