import type { HandlerContext } from "generated/src/Types";
import { vi } from "vitest";

export const createMockContext = () => {
  return {
    SingleChainToken: {
      get: vi.fn(),
      set: vi.fn(),
    },
    PoolHistoricalData: {
      get: vi.fn(),
      getOrCreate: vi.fn(),
    },
    PoolTimeframedStats: {
      get: vi.fn(),
      getOrThrow: vi.fn(),
      set: vi.fn(),
    },
    effect: vi.fn(),
  } as unknown as HandlerContext;
};
