import { createEffect, S } from "envio";

import "../string.extension";
import { TokenService } from "./token-service";

const TokenMetadataSchemaOutput = S.schema({
  decimals: S.number,
  name: S.string,
  symbol: S.string,
});

const TokenMetadataSchemaInput = S.tuple((t) => ({
  tokenAddress: t.item(0, S.string),
  chainId: t.item(1, S.number),
}));

type TokenMetadataSchemaOutput = S.Output<typeof TokenMetadataSchemaOutput>;
type TokenMetadataSchemaInput = S.Input<typeof TokenMetadataSchemaInput>;

export class EffectService {
  constructor(tokenService: TokenService) {
    this.tokenService = tokenService;
  }

  private static _instance: EffectService;

  static get shared() {
    if (!this._instance) this._instance = new EffectService(TokenService.shared);

    return this._instance;
  }

  private readonly GET_TOKEN_METADATA_EFFECT_NAME = "getTokenMetadata";
  private readonly tokenService = TokenService.shared;

  readonly getTokenMetadataEffect = createEffect(
    {
      name: this.GET_TOKEN_METADATA_EFFECT_NAME,
      input: TokenMetadataSchemaInput,
      output: TokenMetadataSchemaOutput,
      rateLimit: false,
      cache: true,
    },
    async ({ context, input }) => {
      try {
        return await this.tokenService.getRemoteTokenMetadata(input.tokenAddress, input.chainId);
      } catch (error) {
        context.log.error(
          `Error fetching metadata for ${input.tokenAddress} on chain ${input.chainId}:`,
          error as Error
        );

        throw error;
      }
    }
  );
}
