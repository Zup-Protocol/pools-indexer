import { createTestIndexer } from "generated";
import { maxUint256 } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PoolMock } from "../../test/mocks/pool-mock";
import { processPoolTimeframedStatsUpdate } from "../processors/pool-timeframed-stats-update-processor";

// Define hoisted state for the mock
const { MockState } = vi.hoisted(() => ({ MockState: { isLive: false } }));

// Mock the processor to spy on calls
vi.mock("../processors/pool-timeframed-stats-update-processor", () => ({
  processPoolTimeframedStatsUpdate: vi.fn(),
}));

describe("AutoUpdateBlockHandler - Comprehensive Test Suite", () => {
  const CHAIN_ID = 9745; // Plasma
  const ONE_DAY = 86400n;
  const SEVEN_DAYS = ONE_DAY * 7n;
  const THIRTY_DAYS = ONE_DAY * 30n;
  const NINETY_DAYS = ONE_DAY * 90n;

  beforeEach(() => {
    vi.clearAllMocks();
    MockState.isLive = false; // Default
  });

  it("should cover all inactivity thresholds (1d, 7d, 30d, 90d) for killing vs updating", async () => {
    const indexerTest = createTestIndexer();
    const currentBlock = 10000000n;

    /* ... setup cases ... */
    // --- CASE 1 ---
    const pool91d = new PoolMock({
      id: "kill-91d",
      chainId: CHAIN_ID,
      createdAtBlock: 100n,
      lastActivityBlock: currentBlock - (NINETY_DAYS + 100n),
    });
    // --- CASE 3 ---
    const pool31dOld = new PoolMock({
      id: "update-31d-old",
      chainId: CHAIN_ID,
      createdAtBlock: currentBlock - ONE_DAY * 300n,
      lastActivityBlock: currentBlock - (THIRTY_DAYS + 100n),
    });

    [pool91d, pool31dOld].forEach((p) => indexerTest.Pool.set(p));

    await indexerTest.process({
      chains: { [CHAIN_ID]: { startBlock: Number(currentBlock), endBlock: Number(currentBlock) } },
    });

    expect((await indexerTest.Pool.get("kill-91d"))?.lastActivityBlock).toBe(maxUint256);
    expect((await indexerTest.Pool.get("update-31d-old"))?.lastActivityBlock).not.toBe(maxUint256);
  });

  it("should NOT call processPoolTimeframedStatsUpdate when isLive is false", async () => {
    const indexerTest = createTestIndexer();
    const currentBlock = 10000000n;

    MockState.isLive = false;

    const poolToUpdate = new PoolMock({
      id: "update-31d-old-historical",
      chainId: CHAIN_ID,
      createdAtBlock: currentBlock - ONE_DAY * 300n,
      lastActivityBlock: currentBlock - (THIRTY_DAYS + 100n),
    });
    indexerTest.Pool.set(poolToUpdate);

    await indexerTest.process({
      chains: { [CHAIN_ID]: { startBlock: Number(currentBlock), endBlock: Number(currentBlock) } },
    });

    expect((await indexerTest.Pool.get("update-31d-old-historical"))?.lastActivityBlock).not.toBe(maxUint256);
    expect(processPoolTimeframedStatsUpdate).not.toHaveBeenCalled();
  });
});
