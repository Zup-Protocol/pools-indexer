import { HandlerContext, Token as TokenEntity } from "generated";
import { getContract } from "viem";
import { ERC20_ABI } from "../abis";
import { ZERO_ADDRESS, ZERO_BIG_DECIMAL } from "../constants";
import { IndexerNetwork } from "../enums/indexer-network";
import { EffectService } from "./effect-service";
import { ViemService } from "./viem-service";

export class TokenService {
  constructor(viemService: ViemService) {
    this.viemService = viemService;
  }

  private static _instance: TokenService;

  public static get shared() {
    if (!this._instance) {
      this._instance = new TokenService(ViemService.shared);
    }

    return this._instance;
  }

  private readonly viemService;

  async getOrCreateTokenEntity(
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

  async getRemoteTokenMetadata(
    tokenAddress: string,
    network: IndexerNetwork
  ): Promise<{
    decimals: number;
    symbol: string;
    name: string;
  }> {
    const client = this.viemService.getClient(network);

    const contract = getContract({
      abi: ERC20_ABI,
      client,
      address: tokenAddress as `0x${string}`,
    });

    let [name, symbol, decimals] = await Promise.all([
      contract.read.name().catch(() => ""),
      contract.read.symbol().catch(() => ""),
      contract.read.decimals().catch(() => 18),
    ]);

    if (decimals > 255) decimals = 0;

    return {
      decimals: decimals,
      symbol: symbol.sanitize(),
      name: name.sanitize(),
    };
  }
}
