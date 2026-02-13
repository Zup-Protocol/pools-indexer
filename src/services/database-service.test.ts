import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockContext } from "../../test/mocks/mock-context";
import { ZERO_ADDRESS } from "../core/constants";
import { InitialTokenEntity } from "../core/entity/initial-token-entity";
import { IndexerNetwork } from "../core/network";

describe("DatabaseService", () => {
  let context: ReturnType<typeof createMockContext>;
  const network = IndexerNetwork.ETHEREUM;

  beforeEach(async () => {
    vi.resetModules();
    context = createMockContext();
  });

  const mockToken = (address: string) =>
    new InitialTokenEntity({
      tokenAddress: address,
      network: network,
      decimals: 18,
      symbol: "MOCK",
      name: "Mock Token",
    });

  describe("getOrCreatePoolTokenEntities", () => {
    const token0Address = "0x123";
    const token1Address = "0x456";

    it("should fetch token metadata only once for the same token when called concurrently", async () => {
      const { DatabaseService } = await import("./database-service");
      const { getMultiTokenMetadataEffect } = await import("../core/effects/token-metadata-effect");

      // Setup the mock effect to return metadata
      vi.mocked(context.effect).mockImplementation((effect: any, args: any) => {
        if (effect === getMultiTokenMetadataEffect || effect.name === "multi-token-metadata") {
          return Promise.resolve(
            args.tokenAddresses.map((addr: string) => ({
              decimals: 18,
              name: `Token ${addr}`,
              symbol: `TKN${addr}`,
            })),
          );
        }
        return Promise.reject(new Error("Unknown effect"));
      });
      // Ensure SingleChainToken.get returns undefined (missing)
      vi.mocked(context.SingleChainToken.get).mockResolvedValue(undefined);

      // Call getOrCreatePoolTokenEntities twice concurrently for strict token pairs
      const p1 = DatabaseService.getOrCreatePoolTokenEntities({
        context,
        network,
        token0Address,
        token1Address,
      });

      const p2 = DatabaseService.getOrCreatePoolTokenEntities({
        context,
        network,
        token0Address,
        token1Address,
      });

      const [res1, res2] = await Promise.all([p1, p2]);

      expect(res1[0].tokenAddress).toBe(token0Address);
      expect(res1[1].tokenAddress).toBe(token1Address);
      expect(res2[0].tokenAddress).toBe(token0Address);
      expect(res2[1].tokenAddress).toBe(token1Address);

      // Verify effect called only ONCE due to caching
      expect(context.effect).toHaveBeenCalledTimes(1);
    });

    it("should not perform any external call to context.effect if token0 and token1 are present in database", async () => {
      const { DatabaseService } = await import("./database-service");
      const token0 = mockToken(token0Address);
      const token1 = mockToken(token1Address);

      vi.mocked(context.SingleChainToken.get).mockResolvedValueOnce(token0).mockResolvedValueOnce(token1);

      const result = await DatabaseService.getOrCreatePoolTokenEntities({
        context,
        network,
        token0Address,
        token1Address,
      });

      expect(result).toEqual([token0, token1]);
      expect(context.effect).not.toHaveBeenCalled();
      expect(context.SingleChainToken.get).toHaveBeenCalledTimes(2);
    });

    it("should only get token1 metadata when both tokens are missing, and token0address is zero address", async () => {
      const { DatabaseService } = await import("./database-service");
      const { getMultiTokenMetadataEffect } = await import("../core/effects/token-metadata-effect");

      vi.mocked(context.SingleChainToken.get).mockResolvedValue(undefined); // Both missing

      // Mock effect to return metadata for token1
      vi.mocked(context.effect).mockResolvedValueOnce([{ decimals: 18, name: "Token 1", symbol: "TK1" }]);

      const result = await DatabaseService.getOrCreatePoolTokenEntities({
        context,
        network,
        token0Address: ZERO_ADDRESS,
        token1Address,
      });

      expect(result[0].tokenAddress).toBe(ZERO_ADDRESS);
      expect(result[1].tokenAddress).toBe(token1Address);
      expect(result[1].symbol).toBe("TK1");

      // Verify effect called with ONLY token1 address
      expect(context.effect).toHaveBeenCalledWith(getMultiTokenMetadataEffect, {
        chainId: network,
        tokenAddresses: [token1Address],
      });
    });

    it("should only get token0 metadata when both tokens are missing, and token1address is zero address", async () => {
      const { DatabaseService } = await import("./database-service");
      const { getMultiTokenMetadataEffect } = await import("../core/effects/token-metadata-effect");

      vi.mocked(context.SingleChainToken.get).mockResolvedValue(undefined); // Both missing

      // Mock effect to return metadata for token0
      vi.mocked(context.effect).mockResolvedValueOnce([{ decimals: 18, name: "Token 0", symbol: "TK0" }]);

      const result = await DatabaseService.getOrCreatePoolTokenEntities({
        context,
        network,
        token0Address,
        token1Address: ZERO_ADDRESS,
      });

      expect(result[0].tokenAddress).toBe(token0Address);
      expect(result[0].symbol).toBe("TK0");
      expect(result[1].tokenAddress).toBe(ZERO_ADDRESS);

      // Verify effect called with ONLY token0 address
      expect(context.effect).toHaveBeenCalledWith(getMultiTokenMetadataEffect, {
        chainId: network,
        tokenAddresses: [token0Address],
      });
    });

    it("should get both tokens metadata when both tokens are missing, and none of the tokens are zero address", async () => {
      const { DatabaseService } = await import("./database-service");
      const { getMultiTokenMetadataEffect } = await import("../core/effects/token-metadata-effect");

      vi.mocked(context.SingleChainToken.get).mockResolvedValue(undefined);

      vi.mocked(context.effect).mockResolvedValueOnce([
        { decimals: 18, name: "Token 0", symbol: "TK0" },
        { decimals: 6, name: "Token 1", symbol: "TK1" },
      ]);

      const result = await DatabaseService.getOrCreatePoolTokenEntities({
        context,
        network,
        token0Address,
        token1Address,
      });

      expect(result[0].tokenAddress).toBe(token0Address);
      expect(result[1].tokenAddress).toBe(token1Address);
      expect(result[0].symbol).toBe("TK0");
      expect(result[1].symbol).toBe("TK1");

      // Verify effect called with BOTH addresses
      expect(context.effect).toHaveBeenCalledWith(getMultiTokenMetadataEffect, {
        chainId: network,
        tokenAddresses: [token0Address, token1Address],
      });
    });

    it("should only get token 1 metadata when token1 is missing and token0 has in the database", async () => {
      const { DatabaseService } = await import("./database-service");
      const { getMultiTokenMetadataEffect } = await import("../core/effects/token-metadata-effect");

      const token0 = mockToken(token0Address);

      // Mock db responses: token0 found, token1 missing
      vi.mocked(context.SingleChainToken.get).mockResolvedValueOnce(token0).mockResolvedValueOnce(undefined);

      vi.mocked(context.effect).mockResolvedValueOnce([{ decimals: 6, name: "Token 1", symbol: "TK1" }]);

      const result = await DatabaseService.getOrCreatePoolTokenEntities({
        context,
        network,
        token0Address,
        token1Address,
      });

      expect(result[0]).toEqual(token0);
      expect(result[1].tokenAddress).toBe(token1Address);
      expect(result[1].symbol).toBe("TK1");

      expect(context.effect).toHaveBeenCalledWith(getMultiTokenMetadataEffect, {
        chainId: network,
        tokenAddresses: [token1Address],
      });
    });

    it("should only get token 0 metadata when token0 is missing and token1 has in the database", async () => {
      const { DatabaseService } = await import("./database-service");
      const { getMultiTokenMetadataEffect } = await import("../core/effects/token-metadata-effect");

      const token1 = mockToken(token1Address);

      // Mock db responses: token0 missing, token1 found
      vi.mocked(context.SingleChainToken.get).mockResolvedValueOnce(undefined).mockResolvedValueOnce(token1);

      vi.mocked(context.effect).mockResolvedValueOnce([{ decimals: 18, name: "Token 0", symbol: "TK0" }]);

      const result = await DatabaseService.getOrCreatePoolTokenEntities({
        context,
        network,
        token0Address,
        token1Address,
      });

      expect(result[0].tokenAddress).toBe(token0Address);
      expect(result[0].symbol).toBe("TK0");
      expect(result[1]).toEqual(token1);

      expect(context.effect).toHaveBeenCalledWith(getMultiTokenMetadataEffect, {
        chainId: network,
        tokenAddresses: [token0Address],
      });
    });
  });

  describe("setTokenWithNativeCompatibility", () => {
    it("should save token and not look for companion if neither native nor wrapped", async () => {
      const { DatabaseService } = await import("./database-service");
      const token = mockToken("0x123");

      await DatabaseService.setTokenWithNativeCompatibility(context, token);

      expect(context.SingleChainToken.set).toHaveBeenCalledTimes(1);
      expect(context.SingleChainToken.set).toHaveBeenCalledWith(token);
      expect(context.SingleChainToken.get).not.toHaveBeenCalled();
    });

    it("should save native token and update existing wrapped companion", async () => {
      const { DatabaseService } = await import("./database-service");
      const nativeToken = mockToken(ZERO_ADDRESS);
      // Native token normally has ETH metadata
      (nativeToken as any).name = "Ether";
      (nativeToken as any).symbol = "ETH";

      const wrappedAddress = IndexerNetwork.wrappedNativeAddress[network];
      const wrappedToken = mockToken(wrappedAddress);
      // Wrapped token has WETH metadata
      (wrappedToken as any).name = "Wrapped Ether";
      (wrappedToken as any).symbol = "WETH";
      (wrappedToken as any).normalizedSymbol = "WETH";
      (wrappedToken as any).normalizedName = "WRAPPEDETHER";

      vi.mocked(context.SingleChainToken.get).mockResolvedValue(wrappedToken);

      await DatabaseService.setTokenWithNativeCompatibility(context, nativeToken);

      expect(context.SingleChainToken.set).toHaveBeenCalledTimes(2);
      expect(context.SingleChainToken.set).toHaveBeenCalledWith(nativeToken);

      // Verify second call updates wrapped token with native stats but keeps wrapped metadata
      const expectedWrappedUpdate = {
        ...nativeToken,
        id: wrappedToken.id,
        tokenAddress: wrappedToken.tokenAddress,
        symbol: wrappedToken.symbol,
        name: wrappedToken.name,
        decimals: wrappedToken.decimals,
        normalizedSymbol: wrappedToken.normalizedSymbol,
        normalizedName: wrappedToken.normalizedName,
      };

      expect(context.SingleChainToken.set).toHaveBeenCalledWith(expectedWrappedUpdate);
    });

    it("should save wrapped token and update existing native companion", async () => {
      const { DatabaseService } = await import("./database-service");
      const wrappedAddress = IndexerNetwork.wrappedNativeAddress[network];
      const wrappedToken = mockToken(wrappedAddress);
      (wrappedToken as any).name = "Wrapped Ether";
      (wrappedToken as any).symbol = "WETH";

      const nativeToken = mockToken(ZERO_ADDRESS);
      (nativeToken as any).name = "Ether";
      (nativeToken as any).symbol = "ETH";
      (nativeToken as any).normalizedSymbol = "ETH";
      (nativeToken as any).normalizedName = "ETHER";

      vi.mocked(context.SingleChainToken.get).mockResolvedValue(nativeToken);

      await DatabaseService.setTokenWithNativeCompatibility(context, wrappedToken);

      expect(context.SingleChainToken.set).toHaveBeenCalledTimes(2);
      expect(context.SingleChainToken.set).toHaveBeenCalledWith(wrappedToken);

      const expectedNativeUpdate = {
        ...wrappedToken,
        id: nativeToken.id,
        tokenAddress: nativeToken.tokenAddress,
        symbol: nativeToken.symbol,
        name: nativeToken.name,
        decimals: nativeToken.decimals,
        normalizedSymbol: nativeToken.normalizedSymbol,
        normalizedName: nativeToken.normalizedName,
      };

      expect(context.SingleChainToken.set).toHaveBeenCalledWith(expectedNativeUpdate);
    });

    it("should create native companion if it does not exist when saving wrapped token", async () => {
      const { DatabaseService } = await import("./database-service");
      const wrappedAddress = IndexerNetwork.wrappedNativeAddress[network];
      const wrappedToken = mockToken(wrappedAddress);

      vi.mocked(context.SingleChainToken.get).mockResolvedValue(undefined);

      await DatabaseService.setTokenWithNativeCompatibility(context, wrappedToken);

      expect(context.SingleChainToken.set).toHaveBeenCalledTimes(2);
      expect(context.SingleChainToken.set).toHaveBeenCalledWith(wrappedToken);

      // Native companion should be created using static metadata from IndexerNetwork.nativeToken
      const nativeMetadata = IndexerNetwork.nativeToken[network];
      const calls = vi.mocked(context.SingleChainToken.set).mock.calls;
      if (!calls[1]) throw new Error("Expected second call to SingleChainToken.set");
      const companionCall = calls[1][0];

      expect(companionCall.tokenAddress).toBe(ZERO_ADDRESS);
      expect(companionCall.symbol).toBe(nativeMetadata.symbol);
      expect(companionCall.name).toBe(nativeMetadata.name);
      // And it should have the stats from wrappedToken
      expect(companionCall.totalValuePooledUsd).toBe(wrappedToken.totalValuePooledUsd);
    });

    it("should NOT create wrapped companion if it does not exist when saving native token", async () => {
      const { DatabaseService } = await import("./database-service");
      const nativeToken = mockToken(ZERO_ADDRESS);

      vi.mocked(context.SingleChainToken.get).mockResolvedValue(undefined);

      await DatabaseService.setTokenWithNativeCompatibility(context, nativeToken);

      expect(context.SingleChainToken.set).toHaveBeenCalledTimes(1);
      expect(context.SingleChainToken.set).toHaveBeenCalledWith(nativeToken);
    });
  });
});
