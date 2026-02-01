import { createTestIndexer } from "generated";
import type { HandlerContext } from "generated/src/Types";
import { describe, expect, it, vi } from "vitest";
import { InitialPoolTimeframedStatsEntity } from "../../src/core/entity/initial-pool-timeframed-stats-entity";
import { DatabaseService } from "../../src/services/database-service";
import { PoolMock } from "../../test/mocks/pool-mock";
import { processPoolTimeframedStatsUpdate } from "./pool-timeframed-stats-update-processor";

vi.mock("../../src/services/database-service", () => ({
  DatabaseService: {
    getAllPooltimeframedStatsEntities: vi.fn(),
    getPoolHourlyDataAgo: vi.fn(),
    getOldestPoolDailyDataAgo: vi.fn(),
    getOldestPoolHourlyDataAgo: vi.fn(),
    resetAllPoolTimeframedStats: vi.fn(),
  },
}));

describe("processPoolTimeframedStatsUpdate", () => {
  const CHAIN_ID = 1;
  const POOL_ADDRESS = "0x123";
  // ID is less relevant now as we mock the retrieval
  const POOL_ID = "pool-1";
  const ONE_DAY = 86400n;

  it("should NOT update pool.lastStatsRefreshTimestamp when isAutoUpdate is true", async () => {
    const indexer = createTestIndexer();
    const eventTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const oldRefreshTimestamp = eventTimestamp - ONE_DAY;

    const pool = new PoolMock({
      id: POOL_ID,
      chainId: CHAIN_ID,
      poolAddress: POOL_ADDRESS,
      lastStatsRefreshTimestamp: oldRefreshTimestamp,
    });
    indexer.Pool.set(pool);

    // Mock return value: one stat entity
    const stat24h = new InitialPoolTimeframedStatsEntity({
      id: "stat-1",
      poolId: POOL_ID,
      timeframe: "DAY",
      dataPointTimestamp: oldRefreshTimestamp,
    });

    vi.mocked(DatabaseService.getAllPooltimeframedStatsEntities).mockResolvedValue([stat24h]);
    // Return null for historical data so it just returns a fresh entity (simple path)
    vi.mocked(DatabaseService.getPoolHourlyDataAgo).mockResolvedValue(null as any);
    vi.mocked(DatabaseService.getOldestPoolDailyDataAgo).mockResolvedValue(null as any);
    vi.mocked(DatabaseService.getOldestPoolHourlyDataAgo).mockResolvedValue(null as any);

    await processPoolTimeframedStatsUpdate({
      context: indexer as unknown as HandlerContext,
      eventTimestamp,
      poolEntity: pool,
      isAutoUpdate: true, // TRIGGER THE LOGIC BRANCH
    });

    const updatedPool = await indexer.Pool.get(POOL_ID);
    // Should REMAIN the old timestamp, NOT update to eventTimestamp
    expect(updatedPool?.lastStatsRefreshTimestamp).toBe(oldRefreshTimestamp);
  });

  it("should update pool.lastStatsRefreshTimestamp when isAutoUpdate is false (default)", async () => {
    const indexer = createTestIndexer();
    const eventTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const oldRefreshTimestamp = eventTimestamp - ONE_DAY;

    const pool = new PoolMock({
      id: POOL_ID,
      chainId: CHAIN_ID,
      poolAddress: POOL_ADDRESS,
      lastStatsRefreshTimestamp: oldRefreshTimestamp,
    });
    indexer.Pool.set(pool);

    const stat24h = new InitialPoolTimeframedStatsEntity({
      id: "stat-1",
      poolId: POOL_ID,
      timeframe: "DAY",
      dataPointTimestamp: oldRefreshTimestamp,
    });

    vi.mocked(DatabaseService.getAllPooltimeframedStatsEntities).mockResolvedValue([stat24h]);
    vi.mocked(DatabaseService.getPoolHourlyDataAgo).mockResolvedValue(null as any);
    vi.mocked(DatabaseService.getOldestPoolDailyDataAgo).mockResolvedValue(null as any);
    vi.mocked(DatabaseService.getOldestPoolHourlyDataAgo).mockResolvedValue(null as any);

    await processPoolTimeframedStatsUpdate({
      context: indexer as unknown as HandlerContext,
      eventTimestamp,
      poolEntity: pool,
      // isAutoUpdate undefined or false
    });

    const updatedPool = await indexer.Pool.get(POOL_ID);
    // Should UPDATE to eventTimestamp
    expect(updatedPool?.lastStatsRefreshTimestamp).toBe(eventTimestamp);
  });
});
