import { BigDecimal, createTestIndexer, type SingleChainToken } from "generated";
import type { HandlerContext } from "generated/src/Types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZERO_BIG_DECIMAL } from "../core/constants";
import { Id } from "../core/entity";
import { IndexerNetwork } from "../core/network";
import { PriceDiscover } from "../lib/pricing/price-discover";
import { processLiquidityChange } from "./liquidity-change-processor";

// Mock dependencies
vi.mock("../lib/pricing/price-discover", () => ({
  PriceDiscover: {
    isTokenDiscoveryEligible: vi.fn(),
    calculateDiscoveryAmountFromOtherToken: vi.fn(),
  },
}));

vi.mock("../services/database-service", () => ({
  DatabaseService: {
    getOrCreateHistoricalPoolDataEntities: vi.fn().mockResolvedValue([]),
    getAllPooltimeframedStatsEntities: vi.fn().mockResolvedValue([]),
    setTokenWithNativeCompatibility: vi.fn().mockImplementation(async (context, token) => {
      context.SingleChainToken.set(token);
    }),
  },
}));

vi.mock("./liquidity-metrics-processor", () => ({
  processLiquidityMetrics: vi.fn(),
}));

vi.mock("./pool-timeframed-stats-update-processor", () => ({
  processPoolTimeframedStatsUpdate: vi.fn(),
}));

vi.mock("../lib/math", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/math")>();
  return {
    ...actual,
    calculateNewLockedAmountsUSD: vi.fn().mockReturnValue({
      newPoolTotalValueLockedToken0USD: ZERO_BIG_DECIMAL,
      newTrackedPoolTotalValueLockedToken0USD: ZERO_BIG_DECIMAL,
      newPoolTotalValueLockedToken1USD: ZERO_BIG_DECIMAL,
      newTrackedPoolTotalValueLockedToken1USD: ZERO_BIG_DECIMAL,
      newPoolTotalValueLockedUSD: ZERO_BIG_DECIMAL,
      newTrackedPoolTotalValueLockedUSD: ZERO_BIG_DECIMAL,
      newToken0TotalPooledAmountUSD: ZERO_BIG_DECIMAL,
      newTrackedToken0TotalPooledAmountUSD: ZERO_BIG_DECIMAL,
      newToken1TotalPooledAmountUSD: ZERO_BIG_DECIMAL,
      newTrackedToken1TotalPooledAmountUSD: ZERO_BIG_DECIMAL,
    }),
  };
});

describe("processLiquidityChange", () => {
  const NETWORK = IndexerNetwork.ETHEREUM;
  const POOL_ADDRESS = "0xpool";
  const TOKEN0_ID = `1-${"0x0".padEnd(42, "0")}`;
  const TOKEN1_ID = `1-${"0x1".padEnd(42, "0")}`;

  let indexer: any;
  let context: HandlerContext;

  beforeEach(() => {
    indexer = createTestIndexer();
    // Patch missing getOrThrow in mock context
    indexer.Pool.getOrThrow = indexer.Pool.get;
    indexer.SingleChainToken.getOrThrow = indexer.SingleChainToken.get;

    context = indexer as unknown as HandlerContext;
    vi.clearAllMocks();
  });

  it("should update priceDiscoveryTokenAmount on liquidity addition", async () => {
    const poolEntity = {
      id: Id.fromAddress(NETWORK, POOL_ADDRESS),
      token0_id: TOKEN0_ID,
      token1_id: TOKEN1_ID,
      totalValueLockedToken0: new BigDecimal("100"),
      totalValueLockedToken1: new BigDecimal("100"),
      tokens0PerToken1: new BigDecimal("0.5"),
      tokens1PerToken0: new BigDecimal("2"),
      chainId: 1,
    } as any;

    const token0Entity = {
      id: TOKEN0_ID,
      priceDiscoveryTokenAmount: new BigDecimal("1000"),
      tokenTotalValuePooled: new BigDecimal("100"),
      decimals: 18,
    } as unknown as SingleChainToken;

    const token1Entity = {
      id: TOKEN1_ID,
      priceDiscoveryTokenAmount: new BigDecimal("2000"),
      tokenTotalValuePooled: new BigDecimal("100"),
      decimals: 18,
    } as unknown as SingleChainToken;

    indexer.Pool.set(poolEntity);
    indexer.SingleChainToken.set(token0Entity);
    indexer.SingleChainToken.set(token1Entity);

    vi.mocked(PriceDiscover.isTokenDiscoveryEligible).mockReturnValue(true);
    vi.mocked(PriceDiscover.calculateDiscoveryAmountFromOtherToken).mockImplementation((amt, ratio) =>
      amt.times(ratio),
    );

    await processLiquidityChange({
      context,
      poolAddress: POOL_ADDRESS,
      network: NETWORK,
      amount0AddedOrRemoved: BigInt(10) * 10n ** 18n, // 10 Token 0 added
      amount1AddedOrRemoved: BigInt(20) * 10n ** 18n, // 20 Token 1 added
      eventBlock: { number: 100, timestamp: 1000 } as any,
      updateMetrics: false,
    });

    const updatedToken0 = await indexer.SingleChainToken.get(TOKEN0_ID);
    const updatedToken1 = await indexer.SingleChainToken.get(TOKEN1_ID);

    expect(updatedToken0?.priceDiscoveryTokenAmount.toString()).toBe("1010");
    expect(updatedToken1?.priceDiscoveryTokenAmount.toString()).toBe("2020");
  });

  it("should NOT decrease priceDiscoveryTokenAmount on liquidity removal", async () => {
    const poolEntity = {
      id: Id.fromAddress(NETWORK, POOL_ADDRESS),
      token0_id: TOKEN0_ID,
      token1_id: TOKEN1_ID,
      totalValueLockedToken0: new BigDecimal("100"),
      totalValueLockedToken1: new BigDecimal("100"),
      tokens0PerToken1: new BigDecimal("0.5"),
      tokens1PerToken0: new BigDecimal("2"),
      chainId: 1,
    } as any;

    const token0Entity = {
      id: TOKEN0_ID,
      priceDiscoveryTokenAmount: new BigDecimal("1000"),
      tokenTotalValuePooled: new BigDecimal("100"),
      decimals: 18,
    } as unknown as SingleChainToken;

    indexer.Pool.set(poolEntity);
    indexer.SingleChainToken.set(token0Entity);
    indexer.SingleChainToken.set({
      id: TOKEN1_ID,
      decimals: 18,
      priceDiscoveryTokenAmount: ZERO_BIG_DECIMAL,
      tokenTotalValuePooled: ZERO_BIG_DECIMAL,
    } as any);

    await processLiquidityChange({
      context,
      poolAddress: POOL_ADDRESS,
      network: NETWORK,
      amount0AddedOrRemoved: -BigInt(10) * 10n ** 18n, // 10 Token 0 removed
      amount1AddedOrRemoved: -BigInt(20) * 10n ** 18n, // 20 Token 1 removed
      eventBlock: { number: 100, timestamp: 1000 } as any,
      updateMetrics: false,
    });

    const updatedToken0 = await indexer.SingleChainToken.get(TOKEN0_ID);
    expect(updatedToken0?.priceDiscoveryTokenAmount.toString()).toBe("1000");
  });
});
