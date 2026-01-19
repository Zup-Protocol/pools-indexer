import type { BigDecimal, Token as TokenEntity } from "generated";
import { ZERO_BIG_DECIMAL } from "../constants";
import { IndexerNetwork } from "../network";
import { EntityId } from "./entity-id";

export class InitialTokenEntity implements TokenEntity {
  constructor(
    readonly params: {
      tokenAddress: string;
      network: IndexerNetwork;
      decimals: number;
      symbol: string;
      name: string;
    },
  ) {
    this.tokenAddress = params.tokenAddress;
    this.chainId = params.network;
    this.decimals = params.decimals;
    this.symbol = params.symbol;
    this.name = params.name;

    this.id = EntityId.fromAddress(params.network, params.tokenAddress);
  }

  readonly id: string;
  readonly chainId: number;
  readonly decimals: number;
  readonly name: string;
  readonly symbol: string;
  readonly tokenAddress: string;

  readonly trackedPriceDiscoveryCapitalUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly trackedUsdPrice: BigDecimal = ZERO_BIG_DECIMAL;
  readonly trackedTotalValuePooledUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly trackedSwapVolumeUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly trackedLiquidityVolumeUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly trackedFeesUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly liquidityQualityBackedScore: BigDecimal = ZERO_BIG_DECIMAL;
  readonly liquidityQualitySeedScore: BigDecimal = ZERO_BIG_DECIMAL;
  readonly feesUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly tokenFees: BigDecimal = ZERO_BIG_DECIMAL;
  readonly liquidityVolumeUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly swapVolumeUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly tokenLiquidityVolume: BigDecimal = ZERO_BIG_DECIMAL;
  readonly tokenSwapVolume: BigDecimal = ZERO_BIG_DECIMAL;
  readonly totalValuePooledUsd: BigDecimal = ZERO_BIG_DECIMAL;
  readonly usdPrice: BigDecimal = ZERO_BIG_DECIMAL;
  readonly poolsCount: bigint = 0n;
  readonly tokenTotalValuePooled: BigDecimal = ZERO_BIG_DECIMAL;
  readonly swapsCount: bigint = 0n;
  readonly swapsInCount: bigint = 0n;
  readonly swapsOutCount: bigint = 0n;
}
