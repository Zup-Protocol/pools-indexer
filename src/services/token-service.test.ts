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
  });
});
