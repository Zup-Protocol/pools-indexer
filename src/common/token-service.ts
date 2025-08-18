import { HandlerContext, Token as TokenEntity } from "generated";
import { ZERO_ADDRESS, ZERO_BIG_DECIMAL } from "./constants";
import { getTokenMetadataEffect } from "./effects";
import { IndexerNetwork } from "./enums/indexer-network";

export class TokenService {
  constructor(readonly context: HandlerContext, readonly network: IndexerNetwork) {}

  async getOrCreateTokenEntity(tokenAddress: string): Promise<TokenEntity> {
    const tokenId = IndexerNetwork.getEntityIdFromAddress(this.network, tokenAddress);

    let tokenEntity = await this.context.Token.get(tokenId);
    const isNativeToken: boolean = tokenAddress == ZERO_ADDRESS;

    if (!tokenEntity) {
      if (isNativeToken) {
        let nativeToken = IndexerNetwork.nativeToken(this.network);

        tokenEntity = {
          id: tokenId,
          tokenAddress: tokenAddress.toLowerCase(),
          decimals: nativeToken.decimals,
          symbol: nativeToken.symbol,
          name: nativeToken.name,
          totalTokenPooledAmount: ZERO_BIG_DECIMAL,
          totalValuePooledUsd: ZERO_BIG_DECIMAL,
          usdPrice: ZERO_BIG_DECIMAL,
        };

        return tokenEntity;
      }

      let remoteTokenMetadata = await this.context.effect(getTokenMetadataEffect, {
        chainId: this.network,
        tokenAddress: tokenAddress,
      });

      tokenEntity = {
        id: tokenId,
        tokenAddress: tokenAddress.toLowerCase(),
        decimals: remoteTokenMetadata.decimals,
        symbol: remoteTokenMetadata.symbol,
        name: remoteTokenMetadata.name,
        totalTokenPooledAmount: ZERO_BIG_DECIMAL,
        totalValuePooledUsd: ZERO_BIG_DECIMAL,
        usdPrice: ZERO_BIG_DECIMAL,
      };
    }

    return tokenEntity!;
  }
}
