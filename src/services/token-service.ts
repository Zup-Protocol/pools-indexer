import { IndexerNetwork } from "../core/network";
import type { TokenMetadata } from "../core/types";
import { ERC20_METADATA_ABI } from "../lib/abis/erc20-metadata-abi";
import { String } from "../lib/string-utils";
import { BlockchainService } from "./blockchain-service";

export const TokenService = {
  async getMultiRemoteMetadata(addresses: string[], network: IndexerNetwork): Promise<TokenMetadata[]> {
    const client = BlockchainService.getClient(network);

    const contracts = addresses.flatMap((address) => [
      {
        address: address as `0x${string}`,
        abi: ERC20_METADATA_ABI,
        functionName: "name",
      },
      {
        address: address as `0x${string}`,
        abi: ERC20_METADATA_ABI,
        functionName: "symbol",
      },
      {
        address: address as `0x${string}`,
        abi: ERC20_METADATA_ABI,
        functionName: "decimals",
      },
    ]);

    const results = await client.multicall({
      contracts,
      allowFailure: true,
      multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
    });

    return addresses.map((_, index) => {
      const tokenOffset = index * 3;

      const nameResult = results[tokenOffset];
      const symbolResult = results[tokenOffset + 1];
      const decimalsResult = results[tokenOffset + 2];

      const name = nameResult?.status === "success" ? (nameResult.result as string) : "";
      const symbol = symbolResult?.status === "success" ? (symbolResult.result as string) : "";
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
