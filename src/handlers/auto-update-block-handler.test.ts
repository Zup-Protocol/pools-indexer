import { createTestIndexer } from "generated";
import { maxUint256 } from "viem";
import { describe, expect, it } from "vitest";
import { PoolMock } from "../../test/mocks/pool-mock";

describe("AutoUpdateBlockHandler", () => {
  it("should not try to update pools older than 24h in networks other than the one running the block handler", async () => {
    const indexer = createTestIndexer();

    const ethPool = new PoolMock({
      chainId: 1,
      poolAddress: "0x1",
      createdAtBlock: 24145194n,
      lastActivityBlock: 24145194n,
    });
    indexer.Pool.set(ethPool);

    const basePool = new PoolMock({
      chainId: 8453,
      poolAddress: "0x2",
      createdAtBlock: 24145194n,
      lastActivityBlock: 24145194n,
    });
    indexer.Pool.set(basePool);

    await indexer.process({
      chains: {
        "1": {
          startBlock: 24345194,
          endBlock: 24345194,
        },
      },
    });

    const ethPoolAfter = await indexer.Pool.get(ethPool.id);
    const basePoolAfter = await indexer.Pool.get(basePool.id);

    expect(ethPoolAfter?.lastActivityBlock).toBe(maxUint256);
    expect(basePoolAfter?.lastActivityBlock).toBe(24145194n);
  });
});
