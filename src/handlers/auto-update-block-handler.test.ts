import { createTestIndexer } from "generated";
import { maxUint256 } from "viem";
import { describe, expect, it } from "vitest";
import { PoolMock } from "../../test/mocks/pool-mock";

describe("AutoUpdateBlockHandler - Comprehensive Test Suite", () => {
  const CHAIN_ID = 9745; // Plasma
  const ONE_DAY = 86400n;
  const SEVEN_DAYS = ONE_DAY * 7n;
  const THIRTY_DAYS = ONE_DAY * 30n;
  const NINETY_DAYS = ONE_DAY * 90n;
  const CONFIG_START_BLOCK = 430127;

  it("should cover all inactivity thresholds (1d, 7d, 30d, 90d) for killing vs updating", async () => {
    const indexer = createTestIndexer();
    const currentBlock = 10000000n;

    // --- CASE 1: 91 days inactive -> KILL ---
    const pool91d = new PoolMock({
      id: "kill-91d",
      chainId: CHAIN_ID,
      createdAtBlock: 100n,
      lastActivityBlock: currentBlock - (NINETY_DAYS + 100n),
    });

    // --- CASE 2: 31 days inactive, but very young (20d old) -> KILL ---
    const pool31dYoung = new PoolMock({
      id: "kill-31d-young",
      chainId: CHAIN_ID,
      createdAtBlock: currentBlock - THIRTY_DAYS - 500n,
      lastActivityBlock: currentBlock - (THIRTY_DAYS + 100n),
    });

    // --- CASE 3: 31 days inactive, but older (100d old) -> UPDATE ---
    const pool31dOld = new PoolMock({
      id: "update-31d-old",
      chainId: CHAIN_ID,
      createdAtBlock: currentBlock - ONE_DAY * 300n, // Very old
      lastActivityBlock: currentBlock - (THIRTY_DAYS + 100n),
    });

    // --- CASE 4: 8 days inactive, but very young (5d old) -> KILL ---
    const pool8dYoung = new PoolMock({
      id: "kill-8d-young",
      chainId: CHAIN_ID,
      createdAtBlock: currentBlock - SEVEN_DAYS - 500n,
      lastActivityBlock: currentBlock - (SEVEN_DAYS + 100n),
    });

    // --- CASE 5: 8 days inactive, but older (20d old) -> UPDATE ---
    const pool8dOld = new PoolMock({
      id: "update-8d-old",
      chainId: CHAIN_ID,
      createdAtBlock: currentBlock - ONE_DAY * 30n,
      lastActivityBlock: currentBlock - (SEVEN_DAYS + 100n),
    });

    // --- CASE 6: 2 days inactive, but extremely young (12h old) -> KILL ---
    const pool2dYoung = new PoolMock({
      id: "kill-2d-young",
      chainId: CHAIN_ID,
      createdAtBlock: currentBlock - ONE_DAY - 1000n,
      lastActivityBlock: currentBlock - ONE_DAY - 500n,
    });

    // --- CASE 7: 2 days inactive, but older (5d old) -> UPDATE ---
    const pool2dOld = new PoolMock({
      id: "update-2d-old",
      chainId: CHAIN_ID,
      createdAtBlock: currentBlock - ONE_DAY * 10n,
      lastActivityBlock: currentBlock - (ONE_DAY + 500n),
    });

    [pool91d, pool31dYoung, pool31dOld, pool8dYoung, pool8dOld, pool2dYoung, pool2dOld].forEach((p) =>
      indexer.Pool.set(p),
    );

    // Just trigger exactly ONE onBlock execution
    await indexer.process({
      chains: {
        [CHAIN_ID]: {
          startBlock: Number(currentBlock),
          endBlock: Number(currentBlock),
        },
      },
    });

    expect((await indexer.Pool.get("kill-91d"))?.lastActivityBlock).toBe(maxUint256);
    expect((await indexer.Pool.get("kill-31d-young"))?.lastActivityBlock).toBe(maxUint256);
    expect((await indexer.Pool.get("update-31d-old"))?.lastActivityBlock).not.toBe(maxUint256);
    expect((await indexer.Pool.get("kill-8d-young"))?.lastActivityBlock).toBe(maxUint256);
    expect((await indexer.Pool.get("update-8d-old"))?.lastActivityBlock).not.toBe(maxUint256);
    expect((await indexer.Pool.get("kill-2d-young"))?.lastActivityBlock).toBe(maxUint256);
    expect((await indexer.Pool.get("update-2d-old"))?.lastActivityBlock).not.toBe(maxUint256);
  });

  it("should ensure deterministic backward scan back to startBlock", async () => {
    const indexer = createTestIndexer();
    const startBlock = BigInt(CONFIG_START_BLOCK);
    const currentBlock = startBlock + ONE_DAY * 10n; // Just 10 days of history

    const veryOldPool = new PoolMock({
      id: "very-old-pool",
      chainId: CHAIN_ID,
      createdAtBlock: startBlock + 100n,
      lastActivityBlock: startBlock + 200n, // At the very beginning
    });
    indexer.Pool.set(veryOldPool);

    await indexer.process({
      chains: {
        [CHAIN_ID]: {
          startBlock: Number(currentBlock),
          endBlock: Number(currentBlock),
        },
      },
    });

    const poolAfter = await indexer.Pool.get(veryOldPool.id);
    expect(poolAfter?.lastActivityBlock).toBe(maxUint256);
  });

  it("should respect multichain isolation and never touch pools in other chains", async () => {
    const indexer = createTestIndexer();
    const currentBlock = 10000000n;

    const ethPool = new PoolMock({
      id: "eth-pool",
      chainId: 1,
      createdAtBlock: currentBlock - NINETY_DAYS * 2n,
      lastActivityBlock: currentBlock - NINETY_DAYS * 2n, // Very inactive
    });
    indexer.Pool.set(ethPool);

    await indexer.process({
      chains: {
        [CHAIN_ID]: {
          startBlock: Number(currentBlock),
          endBlock: Number(currentBlock),
        },
      },
    });

    const ethPoolAfter = await indexer.Pool.get(ethPool.id);
    expect(ethPoolAfter?.lastActivityBlock).not.toBe(maxUint256);
  });

  it("should skip pools that are already killed", async () => {
    const indexer = createTestIndexer();
    const currentBlock = 10000000n;

    const killedPool = new PoolMock({
      id: "already-killed",
      chainId: CHAIN_ID,
      lastActivityBlock: maxUint256, // ALREADY KILLED
    });
    indexer.Pool.set(killedPool);

    await indexer.process({
      chains: {
        [CHAIN_ID]: {
          startBlock: Number(currentBlock),
          endBlock: Number(currentBlock),
        },
      },
    });

    const poolAfter = await indexer.Pool.get(killedPool.id);
    expect(poolAfter?.lastActivityBlock).toBe(maxUint256);
  });
});
