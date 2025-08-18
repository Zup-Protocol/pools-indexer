import { experimental_createEffect, S } from "envio";
import { getContract } from "viem";

import { ERC20_ABI } from "./abis";
import { IndexerNetwork } from "./enums/indexer-network";
import "./string.extension";
import { ViemService } from "./viem-service";

enum Effects {
  GET_TOKEN_METADATA = "getTokenMetadata",
}

const TokenMetadataSchemaOutput = S.schema({
  decimals: S.number,
  name: S.string,
  symbol: S.string,
});

const TokenMetadataSchemaInput = S.tuple((t) => ({
  tokenAddress: t.item(0, S.string),
  chainId: t.item(1, S.number),
}));

export const getTokenMetadataEffect = experimental_createEffect(
  {
    name: Effects.GET_TOKEN_METADATA,
    input: TokenMetadataSchemaInput,
    output: TokenMetadataSchemaOutput,
    cache: true,
  },
  async ({ context, input }) => {
    try {
      return await _getRemoteTokenMetadata(input.tokenAddress, input.chainId);
    } catch (error) {
      context.log.error(`Error fetching metadata for ${input.tokenAddress} on chain ${input.chainId}:`, error as Error);

      throw error;
    }
  }
);

type TokenMetadataSchemaOutput = S.Output<typeof TokenMetadataSchemaOutput>;
type TokenMetadataSchemaInput = S.Input<typeof TokenMetadataSchemaInput>;

async function _getRemoteTokenMetadata(
  tokenAddress: string,
  network: IndexerNetwork
): Promise<TokenMetadataSchemaOutput> {
  const client = ViemService.shared.getClient(network);

  const contract = getContract({
    abi: ERC20_ABI,
    client,
    address: tokenAddress as `0x${string}`,
  });

  let [name, symbol, decimals] = await Promise.all([
    contract.read.name().catch(() => "ERROR_GET_NAME"),
    contract.read.symbol().catch(() => "ERROR_GET_SYMBOL"),
    contract.read.decimals().catch(() => 0),
  ]);

  if (decimals > 255) decimals = 0;

  return {
    decimals: decimals,
    symbol: symbol.sanitize(),
    name: name.sanitize(),
  };
}
