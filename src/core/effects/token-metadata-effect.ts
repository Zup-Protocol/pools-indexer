import { createEffect, S } from "envio";
import { TokenService } from "../../services/token-service";

export const getMultiTokenMetadataEffect = createEffect(
  {
    name: "multi-token-metadata",
    input: {
      tokenAddresses: S.array(S.string),
      chainId: S.number,
    },
    output: S.array(
      S.schema({
        decimals: S.number,
        name: S.string,
        symbol: S.string,
      }),
    ),
    rateLimit: false,
    cache: true,
  },
  async ({ context, input }) => {
    const metadata = await TokenService.getMultiRemoteMetadata(input.tokenAddresses, input.chainId);

    return metadata;
  },
);
