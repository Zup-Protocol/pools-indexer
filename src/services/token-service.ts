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

    const results = await client.multicall({
      contracts,
      allowFailure: true,
      multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
    });

    return addresses.map((_, index) => {
      const offset = index * 7;

      const nameResult = results[offset];
      const symbolResult = results[offset + 1];
      const nameBytes32Result = results[offset + 2];
      const symbolBytes32Result = results[offset + 3];
      const nameCapsResult = results[offset + 4];
      const symbolCapsResult = results[offset + 5];
      const decimalsResult = results[offset + 6];

      let name = nameResult?.status === "success" ? (nameResult.result as string) : "";

      if (!name) {
        if (nameBytes32Result?.status === "success") {
          name = hexToString(nameBytes32Result.result as `0x${string}`, { size: 32 }).replace(/\0/g, "");
        } else if (nameCapsResult?.status === "success") {
          name = hexToString(nameCapsResult.result as `0x${string}`, { size: 32 }).replace(/\0/g, "");
        }
      }

      let symbol = symbolResult?.status === "success" ? (symbolResult.result as string) : "";
      if (!symbol) {
        if (symbolBytes32Result?.status === "success") {
          symbol = hexToString(symbolBytes32Result.result as `0x${string}`, { size: 32 }).replace(/\0/g, "");
        } else if (symbolCapsResult?.status === "success") {
          symbol = hexToString(symbolCapsResult.result as `0x${string}`, { size: 32 }).replace(/\0/g, "");
        }
      }

      let decimals = decimalsResult?.status === "success" ? (decimalsResult.result as number) : 18;

      if (decimals > 255) decimals = 18;

      return {
        decimals: decimals,
        symbol: String.truncateWithEllipsis(String.sanitize(symbol), 255),
        name: String.truncateWithEllipsis(String.sanitize(name), 255),
      };
    });
  },
};
