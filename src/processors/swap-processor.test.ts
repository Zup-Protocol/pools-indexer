import { BigDecimal, createTestIndexer, type Pool, type SingleChainToken } from "generated";
import type { HandlerContext } from "generated/src/Types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZERO_BIG_DECIMAL } from "../core/constants";
import { IndexerNetwork } from "../core/network";
import * as MathLib from "../lib/math";
import { PriceDiscover } from "../lib/pricing/price-discover";
import { DatabaseService } from "../services/database-service";
import { processSwap } from "./swap-processor";

// Mock dependencies
vi.mock("../lib/pricing/price-discover", () => ({
  PriceDiscover: {
    discoverTokenUsdPrices: vi.fn(),
    isTokenDiscoveryEligible: vi.fn(),
    calculateDiscoveryAmountFromOtherToken: vi.fn(),
  },
}));

vi.mock("../services/database-service", () => ({
  DatabaseService: {
    getAllPooltimeframedStatsEntities: vi.fn(),
    getOrCreateHistoricalPoolDataEntities: vi.fn(),
    setTokenWithNativeCompatibility: vi.fn().mockImplementation(async (context, token) => {
      context.SingleChainToken.set(token);
    }),
  },
}));

vi.mock("../lib/math", async (importOriginal) => {
  const actual = await importOriginal<typeof MathLib>();
  return {
    ...actual,
    calculateNewLockedAmountsUSD: vi.fn(),
    calculateSwapVolume: vi.fn(),
    calculateSwapFees: vi.fn(),
    calculateSwapYield: vi.fn(),
  };
});

describe("processSwap", () => {
  const CHAIN_ID = 1;
  const POOL_ADDRESS = "0xpool";
  const TOKEN0_ID = "1-0xtoken0";
  const TOKEN1_ID = "1-0xtoken1";
  const NETWORK = IndexerNetwork.ETHEREUM;

  let indexer: any;
  let context: HandlerContext;

  beforeEach(() => {
    indexer = createTestIndexer();
    // Patch missing getOrThrow in mock
    indexer.Pool.getOrThrow = indexer.Pool.get;
    indexer.SingleChainToken.getOrThrow = indexer.SingleChainToken.get;

    context = indexer as unknown as HandlerContext;
    vi.clearAllMocks();

    // Default mocks
    vi.mocked(DatabaseService.getAllPooltimeframedStatsEntities).mockResolvedValue([]);
    vi.mocked(DatabaseService.getOrCreateHistoricalPoolDataEntities).mockResolvedValue([]);

    // Math mocks default returns
    vi.mocked(MathLib.calculateNewLockedAmountsUSD).mockReturnValue({
      newPoolTotalValueLockedUSD: BigDecimal("100"),
      newPoolTotalValueLockedToken0USD: BigDecimal("50"),
      newPoolTotalValueLockedToken1USD: BigDecimal("50"),
      newToken0TotalPooledAmountUSD: BigDecimal("100"),
      newToken1TotalPooledAmountUSD: BigDecimal("100"),
      newTrackedPoolTotalValueLockedUSD: BigDecimal("100"),
      newTrackedPoolTotalValueLockedToken0USD: BigDecimal("50"),
      newTrackedPoolTotalValueLockedToken1USD: BigDecimal("50"),
      newTrackedToken0TotalPooledAmountUSD: BigDecimal("100"),
      newTrackedToken1TotalPooledAmountUSD: BigDecimal("100"),
    });

    vi.mocked(MathLib.calculateSwapVolume).mockReturnValue({
      volumeUSD: BigDecimal("10"),
      volumeToken0: BigDecimal("10"),
      volumeToken1: BigDecimal("10"),
      volumeToken0USD: BigDecimal("5"),
      volumeToken1USD: BigDecimal("5"),
      trackedVolumeUSD: BigDecimal("10"),
      trackedVolumeToken0USD: BigDecimal("5"),
      trackedVolumeToken1USD: BigDecimal("5"),
    });

    vi.mocked(MathLib.calculateSwapFees).mockReturnValue({
      feesUSD: BigDecimal("1"),
      feesToken0: BigDecimal("0.1"),
      feesToken1: BigDecimal("0.1"),
      feesToken0USD: BigDecimal("0.5"),
      feesToken1USD: BigDecimal("0.5"),
      trackedFeesUSD: BigDecimal("1"),
      trackedFeesToken0USD: BigDecimal("0.5"),
      trackedFeesToken1USD: BigDecimal("0.5"),
    });

    vi.mocked(MathLib.calculateSwapYield).mockReturnValue(BigDecimal("0.1"));
  });

  it("should update pool price when PriceDiscover returns a NEW price", async () => {
    // Setup:
    // Pool has OLD price (100).
    // PriceDiscover returns NEW price (200).
    // Expect: Pool Entity to be updated to 200.

    const OLD_PRICE = BigDecimal("100");
    const NEW_PRICE = BigDecimal("200");

    const poolEntity = {
      id: `${CHAIN_ID}-${POOL_ADDRESS}`,
      chainId: CHAIN_ID,
      poolAddress: POOL_ADDRESS,
      token0_id: TOKEN0_ID,
      token1_id: TOKEN1_ID,
      token0UsdPrice: OLD_PRICE,
      token1UsdPrice: OLD_PRICE,
      trackedToken0UsdPrice: OLD_PRICE,
      trackedToken1UsdPrice: OLD_PRICE,
      totalValueLockedToken0: BigDecimal("10"),
      totalValueLockedToken1: BigDecimal("10"),
      swapsCount: 0n,
      accumulatedYield: ZERO_BIG_DECIMAL,
      swapVolumeUsd: ZERO_BIG_DECIMAL,
      feesUsd: ZERO_BIG_DECIMAL,
      trackedSwapVolumeUsd: ZERO_BIG_DECIMAL,
      swapVolumeToken0: ZERO_BIG_DECIMAL,
      swapVolumeToken0Usd: ZERO_BIG_DECIMAL,
      trackedSwapVolumeToken0Usd: ZERO_BIG_DECIMAL,
      swapVolumeToken1: ZERO_BIG_DECIMAL,
      swapVolumeToken1Usd: ZERO_BIG_DECIMAL,
      trackedSwapVolumeToken1Usd: ZERO_BIG_DECIMAL,
      trackedFeesUsd: ZERO_BIG_DECIMAL,
      feesToken0: ZERO_BIG_DECIMAL,
      feesToken1: ZERO_BIG_DECIMAL,
      totalValueLockedUsd: ZERO_BIG_DECIMAL,
      trackedTotalValueLockedUsd: ZERO_BIG_DECIMAL,
      totalValueLockedToken0Usd: ZERO_BIG_DECIMAL,
      trackedTotalValueLockedToken0Usd: ZERO_BIG_DECIMAL,
      totalValueLockedToken1Usd: ZERO_BIG_DECIMAL,
      trackedTotalValueLockedToken1Usd: ZERO_BIG_DECIMAL,
    } as unknown as Pool;

    indexer.Pool.set(poolEntity);

    // Token Entities (mocked to match old price or whatever, PriceDiscover output matters)
    const tokenEntity = {
      id: TOKEN0_ID,
      usdPrice: OLD_PRICE,
      trackedUsdPrice: OLD_PRICE,
      swapsInCount: 0n,
      swapsOutCount: 0n,
      swapsCount: 0n,
      tokenTotalValuePooled: ZERO_BIG_DECIMAL,
      priceDiscoveryTokenAmount: ZERO_BIG_DECIMAL,
      tokenSwapVolume: ZERO_BIG_DECIMAL,
      swapVolumeUsd: ZERO_BIG_DECIMAL,
      trackedSwapVolumeUsd: ZERO_BIG_DECIMAL,
      totalValuePooledUsd: ZERO_BIG_DECIMAL,
      trackedTotalValuePooledUsd: ZERO_BIG_DECIMAL,
      tokenFees: ZERO_BIG_DECIMAL,
      feesUsd: ZERO_BIG_DECIMAL,
      trackedFeesUsd: ZERO_BIG_DECIMAL,
    } as unknown as SingleChainToken;

    indexer.SingleChainToken.set(tokenEntity);
    indexer.SingleChainToken.set({ ...tokenEntity, id: TOKEN1_ID });

    // Mock PriceDiscover to return NEW_PRICE
    vi.mocked(PriceDiscover.discoverTokenUsdPrices).mockReturnValue({
      token0UsdPrice: NEW_PRICE,
      token1UsdPrice: NEW_PRICE,
      trackedToken0UsdPrice: NEW_PRICE,
      trackedToken1UsdPrice: NEW_PRICE,
    });

    await processSwap({
      context,
      poolAddress: POOL_ADDRESS,
      network: NETWORK,
      amount0: 100n,
      amount1: 100n,
      eventBlock: { number: 123, timestamp: 2000 } as any,
      newPoolPrices: { tokens0PerToken1: BigDecimal("1"), tokens1PerToken0: BigDecimal("1") },
      rawSwapFee: 500,
    });

    const updatedPool = await indexer.Pool.get(`${CHAIN_ID}-${POOL_ADDRESS}`);

    expect(updatedPool?.token0UsdPrice.toString()).toBe(NEW_PRICE.toString());
    expect(updatedPool?.token1UsdPrice.toString()).toBe(NEW_PRICE.toString());
  });

  it("should NOT update pool price when PriceDiscover returns SAME price", async () => {
    // Setup: Pool has OLD_PRICE. PriceDiscover returns OLD_PRICE.
    // Logic: didTokenPriceUpdate = !new.eq(old). False.
    // Pool update: existing pool price.

    const OLD_PRICE = BigDecimal("100");

    const poolEntity = {
      id: `${CHAIN_ID}-${POOL_ADDRESS}`,
      chainId: CHAIN_ID,
      poolAddress: POOL_ADDRESS,
      token0_id: TOKEN0_ID,
      token1_id: TOKEN1_ID,
      token0UsdPrice: OLD_PRICE,
      token1UsdPrice: OLD_PRICE,
      trackedToken0UsdPrice: OLD_PRICE,
      trackedToken1UsdPrice: OLD_PRICE,
      // ... required fields
      totalValueLockedToken0: BigDecimal("10"),
      totalValueLockedToken1: BigDecimal("10"),
      swapsCount: 0n,
      accumulatedYield: ZERO_BIG_DECIMAL,
      swapVolumeUsd: ZERO_BIG_DECIMAL,
      feesUsd: ZERO_BIG_DECIMAL,
      trackedSwapVolumeUsd: ZERO_BIG_DECIMAL,
      swapVolumeToken0: ZERO_BIG_DECIMAL,
      swapVolumeToken0Usd: ZERO_BIG_DECIMAL,
      trackedSwapVolumeToken0Usd: ZERO_BIG_DECIMAL,
      swapVolumeToken1: ZERO_BIG_DECIMAL,
      swapVolumeToken1Usd: ZERO_BIG_DECIMAL,
      trackedSwapVolumeToken1Usd: ZERO_BIG_DECIMAL,
      trackedFeesUsd: ZERO_BIG_DECIMAL,
      feesToken0: ZERO_BIG_DECIMAL,
      feesToken1: ZERO_BIG_DECIMAL,
      totalValueLockedUsd: ZERO_BIG_DECIMAL,
      trackedTotalValueLockedUsd: ZERO_BIG_DECIMAL,
      totalValueLockedToken0Usd: ZERO_BIG_DECIMAL,
      trackedTotalValueLockedToken0Usd: ZERO_BIG_DECIMAL,
      totalValueLockedToken1Usd: ZERO_BIG_DECIMAL,
      trackedTotalValueLockedToken1Usd: ZERO_BIG_DECIMAL,
    } as unknown as Pool;

    indexer.Pool.set(poolEntity);

    const tokenEntity = {
      id: TOKEN0_ID,
      usdPrice: OLD_PRICE,
      trackedUsdPrice: OLD_PRICE,
      swapsInCount: 0n,
      swapsOutCount: 0n,
      swapsCount: 0n,
      tokenTotalValuePooled: ZERO_BIG_DECIMAL,
      priceDiscoveryTokenAmount: ZERO_BIG_DECIMAL,
      tokenSwapVolume: ZERO_BIG_DECIMAL,
      swapVolumeUsd: ZERO_BIG_DECIMAL,
      trackedSwapVolumeUsd: ZERO_BIG_DECIMAL,
      totalValuePooledUsd: ZERO_BIG_DECIMAL,
      trackedTotalValuePooledUsd: ZERO_BIG_DECIMAL,
      tokenFees: ZERO_BIG_DECIMAL,
      feesUsd: ZERO_BIG_DECIMAL,
      trackedFeesUsd: ZERO_BIG_DECIMAL,
    } as unknown as SingleChainToken;

    indexer.SingleChainToken.set(tokenEntity);
    indexer.SingleChainToken.set({ ...tokenEntity, id: TOKEN1_ID });

    vi.mocked(PriceDiscover.discoverTokenUsdPrices).mockReturnValue({
      token0UsdPrice: OLD_PRICE,
      token1UsdPrice: OLD_PRICE,
      trackedToken0UsdPrice: OLD_PRICE,
      trackedToken1UsdPrice: OLD_PRICE,
    });

    await processSwap({
      context,
      poolAddress: POOL_ADDRESS,
      network: NETWORK,
      amount0: 100n,
      amount1: 100n,
      eventBlock: { number: 124, timestamp: 2001 } as any,
      newPoolPrices: { tokens0PerToken1: BigDecimal("1"), tokens1PerToken0: BigDecimal("1") },
      rawSwapFee: 500,
    });

    const updatedPool = await indexer.Pool.get(`${CHAIN_ID}-${POOL_ADDRESS}`);
    expect(updatedPool?.token0UsdPrice.toString()).toBe(OLD_PRICE.toString());
  });

  it("should update priceDiscoveryTokenAmount when tracked price updates", async () => {
    // Setup:
    // Token0 Tracked Price updates (different from entity).
    // Pool has TVL1 = 10.
    // Pool has tokens0PerToken1 = 0.5 (1 T1 = 0.5 T0).
    // Expect: priceDiscoveryTokenAmount to increase by TVL1 * 0.5 = 10 * 0.5 = 5.

    const OLD_PRICE = BigDecimal("100");
    const NEW_PRICE = BigDecimal("101"); // Trigger update

    const TVL1 = BigDecimal("10");
    const RATE_0_PER_1 = BigDecimal("0.5");
    const RATE_1_PER_0 = BigDecimal("2.0");

    const poolEntity = {
      id: `${CHAIN_ID}-${POOL_ADDRESS}`,
      chainId: CHAIN_ID,
      poolAddress: POOL_ADDRESS,
      token0_id: TOKEN0_ID,
      token1_id: TOKEN1_ID,
      token0UsdPrice: NEW_PRICE, // The processor updates this
      token1UsdPrice: OLD_PRICE,
      trackedToken0UsdPrice: OLD_PRICE, // Stale in pool initially
      trackedToken1UsdPrice: OLD_PRICE,

      // Updated TVLs (Processor adds swap amount to these, but we mock the final state effectively via the input to discovery?)
      // Wait, processor *calculates* the new pool entity properties like totalValueLockedToken1 BEFORE updating discovery amount.
      // poolEntity = { ... prev, totalValueLocked: prev + amount ... }
      // So we need to set the PREVIOUS state such that + swap amount = Desired TVL.
      // Or just assume amount=0 for simplicity if allowed?
      // Let's set PREV TVL and Amount=0.

      totalValueLockedToken0: BigDecimal("20"),
      totalValueLockedToken1: TVL1,

      tokens0PerToken1: RATE_0_PER_1,
      tokens1PerToken0: RATE_1_PER_0,

      swapsCount: 0n,
      accumulatedYield: ZERO_BIG_DECIMAL,
      swapVolumeUsd: ZERO_BIG_DECIMAL,
      feesUsd: ZERO_BIG_DECIMAL,
      trackedSwapVolumeUsd: ZERO_BIG_DECIMAL,
      swapVolumeToken0: ZERO_BIG_DECIMAL,
      swapVolumeToken0Usd: ZERO_BIG_DECIMAL,
      trackedSwapVolumeToken0Usd: ZERO_BIG_DECIMAL,
      swapVolumeToken1: ZERO_BIG_DECIMAL,
      swapVolumeToken1Usd: ZERO_BIG_DECIMAL,
      trackedSwapVolumeToken1Usd: ZERO_BIG_DECIMAL,
      trackedFeesUsd: ZERO_BIG_DECIMAL,
      feesToken0: ZERO_BIG_DECIMAL,
      feesToken1: ZERO_BIG_DECIMAL,
      totalValueLockedUsd: ZERO_BIG_DECIMAL,
      trackedTotalValueLockedUsd: ZERO_BIG_DECIMAL,
      totalValueLockedToken0Usd: ZERO_BIG_DECIMAL,
      trackedTotalValueLockedToken0Usd: ZERO_BIG_DECIMAL,
      totalValueLockedToken1Usd: ZERO_BIG_DECIMAL,
      trackedTotalValueLockedToken1Usd: ZERO_BIG_DECIMAL,
    } as unknown as Pool;

    indexer.Pool.set(poolEntity);

    const INITIAL_DISCOVERY_AMOUNT = BigDecimal("1000");

    const tokenEntity = {
      id: TOKEN0_ID,
      decimals: 18,
      usdPrice: OLD_PRICE,
      trackedUsdPrice: OLD_PRICE, // Differs from NEW_PRICE returned by Discover
      priceDiscoveryTokenAmount: INITIAL_DISCOVERY_AMOUNT,

      swapsInCount: 0n,
      swapsOutCount: 0n,
      swapsCount: 0n,
      tokenTotalValuePooled: ZERO_BIG_DECIMAL,
      tokenSwapVolume: ZERO_BIG_DECIMAL,
      swapVolumeUsd: ZERO_BIG_DECIMAL,
      trackedSwapVolumeUsd: ZERO_BIG_DECIMAL,
      totalValuePooledUsd: ZERO_BIG_DECIMAL,
      trackedTotalValuePooledUsd: ZERO_BIG_DECIMAL,
      tokenFees: ZERO_BIG_DECIMAL,
      feesUsd: ZERO_BIG_DECIMAL,
      trackedFeesUsd: ZERO_BIG_DECIMAL,
    } as unknown as SingleChainToken;

    indexer.SingleChainToken.set(tokenEntity);
    indexer.SingleChainToken.set({ ...tokenEntity, id: TOKEN1_ID, trackedUsdPrice: OLD_PRICE }); // Token1 no update

    // Mock PriceDiscover to return NEW_PRICE for Token0
    vi.mocked(PriceDiscover.discoverTokenUsdPrices).mockReturnValue({
      token0UsdPrice: NEW_PRICE,
      token1UsdPrice: OLD_PRICE,
      trackedToken0UsdPrice: NEW_PRICE, // Triggers update (NEW != OLD)
      trackedToken1UsdPrice: OLD_PRICE,
    });

    // Mock helpers
    vi.mocked(PriceDiscover.isTokenDiscoveryEligible).mockReturnValue(true);
    vi.mocked(PriceDiscover.calculateDiscoveryAmountFromOtherToken).mockImplementation((amt, ratio) =>
      amt.times(ratio),
    );

    await processSwap({
      context,
      poolAddress: POOL_ADDRESS,
      network: NETWORK,
      amount0: 0n,
      amount1: 10n * 10n ** 18n, // 10 Token1 IN
      eventBlock: { number: 125, timestamp: 2002 } as any,
      newPoolPrices: { tokens0PerToken1: RATE_0_PER_1, tokens1PerToken0: RATE_1_PER_0 },
      rawSwapFee: 0,
    });

    const updatedToken0 = await indexer.SingleChainToken.get(TOKEN0_ID);

    // Expected Increase: TVL1 * tokens0PerToken1
    // 10 * 0.5 = 5.
    // New Amount = 1000 + 5 = 1005.

    expect(updatedToken0?.priceDiscoveryTokenAmount.toString()).toBe("1005");
  });
});
