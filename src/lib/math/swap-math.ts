import type { BigDecimal, Pool as PoolEntity, SingleChainToken as SingleChainTokenEntity } from "generated";
import { HUNDRED_BIG_DECIMAL, ZERO_BIG_DECIMAL } from "../../core/constants";
import { IndexerNetwork } from "../../core/network";
import { PriceConverter } from "../pricing/price-converter";
import { FeeMath } from "./fee-math";
import { SafeMath } from "./safe-math";
import { TokenDecimalMath } from "./token/token-decimal-math";

export function calculateSwapVolume(params: {
  swapAmount0: BigDecimal;
  swapAmount1: BigDecimal;
  token0: SingleChainTokenEntity;
  token1: SingleChainTokenEntity;
  poolEntity: PoolEntity;
}): {
  readonly volumeToken0: BigDecimal;
  readonly volumeToken1: BigDecimal;
  readonly volumeUSD: BigDecimal;
  readonly volumeToken0USD: BigDecimal;
  readonly volumeToken1USD: BigDecimal;
  readonly trackedVolumeUSD: BigDecimal;
  readonly trackedVolumeToken0USD: BigDecimal;
  readonly trackedVolumeToken1USD: BigDecimal;
} {
  const isToken0Output = params.swapAmount0.lt(ZERO_BIG_DECIMAL);

  const inputAmount = isToken0Output ? params.swapAmount1 : params.swapAmount0;
  const inputToken = isToken0Output ? params.token1 : params.token0;
  const compareToken = isToken0Output ? params.token0 : params.token1;
  const trackedTvlCap = isToken0Output
    ? params.poolEntity.trackedTotalValueLockedToken1Usd
    : params.poolEntity.trackedTotalValueLockedToken0Usd;

  const volumeUSD = inputAmount.times(inputToken.usdPrice);
  let trackedVolumeUSD = PriceConverter.convertTokenAmountToTrackedUsd({
    amount: inputAmount,
    token: inputToken,
    comparisonToken: compareToken,
    fallbackUsdValue: ZERO_BIG_DECIMAL,
    poolEntity: params.poolEntity,
  });

  if (trackedVolumeUSD.gt(trackedTvlCap)) trackedVolumeUSD = ZERO_BIG_DECIMAL;

  if (isToken0Output) {
    return {
      volumeUSD: volumeUSD,
      volumeToken1USD: volumeUSD,
      volumeToken1: params.swapAmount1,
      trackedVolumeUSD: trackedVolumeUSD,
      trackedVolumeToken1USD: trackedVolumeUSD,
      trackedVolumeToken0USD: ZERO_BIG_DECIMAL,
      volumeToken0: ZERO_BIG_DECIMAL,
      volumeToken0USD: ZERO_BIG_DECIMAL,
    };
  }

  return {
    volumeUSD: volumeUSD,
    volumeToken0USD: volumeUSD,
    volumeToken0: params.swapAmount0,
    trackedVolumeUSD: trackedVolumeUSD,
    trackedVolumeToken0USD: trackedVolumeUSD,
    trackedVolumeToken1USD: ZERO_BIG_DECIMAL,
    volumeToken1: ZERO_BIG_DECIMAL,
    volumeToken1USD: ZERO_BIG_DECIMAL,
  };
}

export function calculateSwapFees(params: {
  rawSwapAmount0: bigint;
  rawSwapAmount1: bigint;
  rawSwapFee: number;
  token0: SingleChainTokenEntity;
  token1: SingleChainTokenEntity;
  poolEntity: PoolEntity;
}): {
  readonly feesToken0: BigDecimal;
  readonly feesToken1: BigDecimal;
  readonly feesUSD: BigDecimal;
  readonly feesToken0USD: BigDecimal;
  readonly feesToken1USD: BigDecimal;
  readonly trackedFeesUSD: BigDecimal;
  readonly trackedFeesToken0USD: BigDecimal;
  readonly trackedFeesToken1USD: BigDecimal;
} {
  const isToken0Output = params.rawSwapAmount0 < 0n;

  if (isToken0Output) {
    const rawFee = FeeMath.calculateRawSwapFeeFromTokenAmount(params.rawSwapAmount1, params.rawSwapFee);
    const tokenFees = TokenDecimalMath.rawToDecimal(rawFee, params.token1);

    const tokenFeesUsd = tokenFees.times(params.token1.usdPrice);
    const trackedTokenFeesUsd = PriceConverter.convertTokenAmountToTrackedUsd({
      amount: tokenFees,
      token: params.token1,
      comparisonToken: params.token0,
      poolEntity: params.poolEntity,
      fallbackUsdValue: ZERO_BIG_DECIMAL,
    });

    return {
      feesToken1: tokenFees,
      feesUSD: tokenFeesUsd,
      feesToken1USD: tokenFeesUsd,
      trackedFeesUSD: trackedTokenFeesUsd,
      trackedFeesToken1USD: trackedTokenFeesUsd,
      trackedFeesToken0USD: ZERO_BIG_DECIMAL,
      feesToken0: ZERO_BIG_DECIMAL,
      feesToken0USD: ZERO_BIG_DECIMAL,
    };
  }

  const rawFee = FeeMath.calculateRawSwapFeeFromTokenAmount(params.rawSwapAmount0, params.rawSwapFee);
  const tokenFees = TokenDecimalMath.rawToDecimal(rawFee, params.token0);

  const tokenFeesUsd = tokenFees.times(params.token0.usdPrice);
  const trackedTokenFeesUsd = PriceConverter.convertTokenAmountToTrackedUsd({
    amount: tokenFees,
    token: params.token0,
    comparisonToken: params.token1,
    poolEntity: params.poolEntity,
    fallbackUsdValue: ZERO_BIG_DECIMAL,
  });

  return {
    feesToken0: tokenFees,
    feesUSD: tokenFeesUsd,
    feesToken0USD: tokenFeesUsd,
    trackedFeesUSD: trackedTokenFeesUsd,
    trackedFeesToken0USD: trackedTokenFeesUsd,
    trackedFeesToken1USD: ZERO_BIG_DECIMAL,
    feesToken1: ZERO_BIG_DECIMAL,
    feesToken1USD: ZERO_BIG_DECIMAL,
  };
}

export function calculateSwapYield(params: { swapFeesUsd: BigDecimal; poolTotalValueLockedUsd: BigDecimal }) {
  if (params.poolTotalValueLockedUsd.eq(ZERO_BIG_DECIMAL)) return ZERO_BIG_DECIMAL;

  return params.swapFeesUsd.div(params.poolTotalValueLockedUsd).times(HUNDRED_BIG_DECIMAL);
}

export function calculateSwapTokenPrices(params: {
  swapAmount0: BigDecimal;
  swapAmount1: BigDecimal;
  network: IndexerNetwork;
  currentToken0Price: BigDecimal;
  currentToken1Price: BigDecimal;
}): [token0Price: BigDecimal, token1Price: BigDecimal] {
  const abs0 = params.swapAmount0.abs();
  const abs1 = params.swapAmount1.abs();

  const valueToken0 = abs0.times(params.currentToken0Price);
  const valueToken1 = abs1.times(params.currentToken1Price);

  if (abs0.eq(ZERO_BIG_DECIMAL) || abs1.eq(ZERO_BIG_DECIMAL)) {
    return [params.currentToken0Price, params.currentToken1Price];
  }

  const paidForToken0 = SafeMath.div(valueToken1, abs0);
  const paidForToken1 = SafeMath.div(valueToken0, abs1);

  return [paidForToken0, paidForToken1];
}
