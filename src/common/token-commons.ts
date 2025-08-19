import { BigDecimal, HandlerContext, Token, Token as TokenEntity } from "generated";
import { ZERO_ADDRESS, ZERO_BIG_DECIMAL } from "./constants";
import { IndexerNetwork } from "./enums/indexer-network";
import { EffectService } from "./services/effect-service";

export function formatFromTokenAmount(amount: bigint, token: TokenEntity): BigDecimal {
  const tokenAmountInBigDecimal = new BigDecimal(amount.toString());
  const tokensDivisionFactor = new BigDecimal("10").pow(token.decimals);

  return tokenAmountInBigDecimal.div(tokensDivisionFactor);
}

export function tokenBaseAmount(token: Token): BigInt {
  return BigInt(10) ** BigInt(token.decimals);
}

export async function getOrCreateTokenEntity(
  context: HandlerContext,
  network: IndexerNetwork,
  tokenAddress: string
): Promise<TokenEntity> {
  const tokenId = IndexerNetwork.getEntityIdFromAddress(network, tokenAddress);

  let tokenEntity = await context.Token.get(tokenId);
  const isNativeToken: boolean = tokenAddress == ZERO_ADDRESS;

  if (!tokenEntity) {
    if (isNativeToken) {
      let nativeToken = IndexerNetwork.nativeToken(network);

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

    let remoteTokenMetadata = await context.effect(EffectService.shared.getTokenMetadataEffect, {
      chainId: network,
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
