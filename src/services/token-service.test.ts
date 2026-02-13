import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IndexerNetwork } from "../core/network";
import { BlockchainService } from "./blockchain-service";
import { TokenService } from "./token-service";

describe("TokenService", () => {
  const network = IndexerNetwork.ETHEREUM;
  const tokenAddress = "0x1234567890123456789012345678901234567890";

  beforeEach(() => {
    // Mock BlockchainService.getClient
    vi.spyOn(BlockchainService, "getClient").mockReturnValue({
      multicall: vi.fn(),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getMultiRemoteMetadata", () => {
    it("should sanitize token name and symbol", async () => {
      const dirtyName = "Token\u0000Name";
      const dirtySymbol = "SYM\u0000BOL";

      const mockMulticallResult = [
        { status: "success", result: dirtyName }, // name
        { status: "success", result: dirtySymbol }, // symbol
        { status: "failure" }, // nameBytes32
        { status: "failure" }, // symbolBytes32
        { status: "failure" }, // nameCaps
        { status: "failure" }, // symbolCaps
        { status: "success", result: 18 }, // decimals
      ];

      const client = BlockchainService.getClient(network);
      vi.mocked(client.multicall).mockResolvedValue(mockMulticallResult);

      const result = await TokenService.getMultiRemoteMetadata([tokenAddress], network);

      expect(result).toHaveLength(1);
      const metadata = result[0];

      expect(metadata!.name).toBe("TokenName");
      expect(metadata!.symbol).toBe("SYMBOL");
      expect(metadata!.decimals).toBe(18);
    });

    it("should handle mixed dirty and clean characters", async () => {
      const dirtyName = "  My \u0000 Token  ";
      const dirtySymbol = "  M\u001FT  "; // \u001F is also in the sanitized range

      const mockMulticallResult = [
        { status: "success", result: dirtyName },
        { status: "success", result: dirtySymbol },
        { status: "failure" },
        { status: "failure" },
        { status: "failure" },
        { status: "failure" },
        { status: "success", result: 6 },
      ];

      const client = BlockchainService.getClient(network);
      vi.mocked(client.multicall).mockResolvedValue(mockMulticallResult);

      const result = await TokenService.getMultiRemoteMetadata([tokenAddress], network);

      expect(result[0]!.name).toBe("My  Token");
      expect(result[0]!.symbol).toBe("MT");
      expect(result[0]!.decimals).toBe(6);
    });

    it("should safely truncate mixed content that would break with naive slicing", async () => {
      // 255 'A's (1 byte each) + 1 '💩' (4 bytes).
      // Total bytes: 255 + 4 = 259.
      // Limit: 256 bytes.
      // Correct truncation: Keeps 255 'A's, drops 💩 entirely (start byte 0xF0 is at index 255).
      const symbolPrefix = "A".repeat(255);
      const toughSymbol = symbolPrefix + "💩";

      // 2047 'B's + 1 '💩'.
      // Total bytes: 2047 + 4 = 2051.
      // Limit: 2048 bytes.
      // Correct truncation: Keeps 2047 'B's, drops 💩 entirely.
      const namePrefix = "B".repeat(2047);
      const toughName = namePrefix + "💩";

      const mockMulticallResult = [
        { status: "success", result: toughName },
        { status: "success", result: toughSymbol },
        { status: "failure" },
        { status: "failure" },
        { status: "failure" },
        { status: "failure" },
        { status: "success", result: 18 },
      ];

      const client = BlockchainService.getClient(network);
      // Cast to ensure we can mock the return value on the spy object
      (client.multicall as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockMulticallResult);

      const result = await TokenService.getMultiRemoteMetadata([tokenAddress], network);
      const metadata = result[0]!;

      // Verify Symbol Truncation
      // Expect 255 chars. The emoji should be completely removed.
      expect(metadata.symbol).toBe(symbolPrefix);
      expect(Buffer.byteLength(metadata.symbol)).toBe(255);

      // Verify Name Truncation
      // Expect 2047 chars.
      expect(metadata.name).toBe(namePrefix);
      expect(Buffer.byteLength(metadata.name)).toBe(2047);

      // --- Demonstration of why this is necessary (User Request) ---
      // A naive slice at 256 characters would include the High Surrogate of the emoji
      // JS String length of toughSymbol is 255 + 2 = 257.
      // slice(0, 256) keeps index 255, which is \uD83D (High Surrogate).
      const naiveSlice = toughSymbol.slice(0, 256);
      const lastChar = naiveSlice.charCodeAt(255);
      // 0xD800 - 0xDBFF are High Surrogates
      const isLoneSurrogate = lastChar >= 0xd800 && lastChar <= 0xdbff;

      expect(naiveSlice.length).toBe(256);
      expect(isLoneSurrogate).toBe(true); // Proves naive slice creates invalid string
      expect(metadata.symbol).not.toBe(naiveSlice); // Proves our solution is different/better
    });
  });
});
