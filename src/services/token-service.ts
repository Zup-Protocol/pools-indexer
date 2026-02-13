import { hexToString } from "viem";
import { IndexerNetwork } from "../core/network";
import type { TokenMetadata } from "../core/types";
import { ERC20_METADATA_ABI } from "../lib/abis/erc20-metadata-abi";
import { String } from "../lib/string-utils";
import { BlockchainService } from "./blockchain-service";

export const TokenService = {
  async getMultiRemoteMetadata(addresses: string[], network: IndexerNetwork): Promise<TokenMetadata[]> {
    const client = BlockchainService.getClient(network);

    const contracts = addresses.flatMap((address) => {
      const addr = address as `0x${string}`;
      return [
        {
          address: addr,
          abi: ERC20_METADATA_ABI,
          functionName: "name",
        },
        {
          address: addr,
          abi: ERC20_METADATA_ABI,
          functionName: "symbol",
        },
        {
          address: addr,
          abi: [
            {
              inputs: [],
              name: "name",
              outputs: [{ type: "bytes32" }],
              stateMutability: "view",
              type: "function",
            },
          ] as const,
          functionName: "name",
        },
        {
          address: addr,
          abi: [
            {
              inputs: [],
              name: "symbol",
              outputs: [{ type: "bytes32" }],
              stateMutability: "view",
              type: "function",
            },
          ] as const,
          functionName: "symbol",
        },
        {
          address: addr,
          abi: ERC20_METADATA_ABI,
          functionName: "NAME",
        },
        {
          address: addr,
          abi: ERC20_METADATA_ABI,
          functionName: "SYMBOL",
        },
        {
          address: addr,
          abi: ERC20_METADATA_ABI,
          functionName: "decimals",
        },
      ];
    });

    let results: any[];
    try {
      results = await client.multicall({
        contracts,
        allowFailure: true,
        multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
      });
    } catch (error) {
      console.error(`TokenService: Multicall failed for network ${network}`, error);
      // If multicall fails entirely, return empty metadata for all addresses
      return addresses.map(() => ({
        decimals: 18,
        symbol: "",
        name: "",
      }));
    }

    return addresses.map((_address, index) => {
      const offset = index * 7;

      const nameResult = results[offset];
      const symbolResult = results[offset + 1];
      const nameBytes32Result = results[offset + 2];
      const symbolBytes32Result = results[offset + 3];
      const nameCapsResult = results[offset + 4];
      const symbolCapsResult = results[offset + 5];
      const decimalsResult = results[offset + 6];

      const safeHexToString = (hex: any): string => {
        if (!hex || typeof hex !== "string" || !hex.startsWith("0x")) return "";
        try {
          return hexToString(hex as `0x${string}`, { size: 32 })
            .replace(/\u0000/g, "")
            .trim();
        } catch {
          return "";
        }
      };

      let name = "";
      if (nameResult?.status === "success" && typeof nameResult.result === "string" && nameResult.result.length > 0) {
        name = nameResult.result;
      }

      if (!name || name.length === 0) {
        if (nameBytes32Result?.status === "success") {
          name = safeHexToString(nameBytes32Result.result);
        } else if (nameCapsResult?.status === "success") {
          name = safeHexToString(nameCapsResult.result);
        }
      }

      let symbol = "";
      if (
        symbolResult?.status === "success" &&
        typeof symbolResult.result === "string" &&
        symbolResult.result.length > 0
      ) {
        symbol = symbolResult.result;
      }

      if (!symbol || symbol.length === 0) {
        if (symbolBytes32Result?.status === "success") {
          symbol = safeHexToString(symbolBytes32Result.result);
        } else if (symbolCapsResult?.status === "success") {
          symbol = safeHexToString(symbolCapsResult.result);
        }
      }

      let decimals = 18;

      if (decimalsResult?.status === "success") {
        try {
          decimals = Number(decimalsResult.result);
        } catch {
          decimals = 18;
        }
      }

      if (isNaN(decimals) || decimals > 255 || decimals < 0) decimals = 18;

      return {
        decimals: decimals,
        symbol: String.truncateToBytes(String.sanitize(symbol), 256),
        name: String.truncateToBytes(String.sanitize(name), 2048),
      };
    });
  },
};
