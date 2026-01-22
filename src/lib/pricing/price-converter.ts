import { BigDecimal, type Pool as PoolEntity, type SingleChainToken as SingleChainTokenEntity } from "generated";
import { MAX_TVL_IMBALANCE_PERCENTAGE } from "../../core/constants";
import { isPoolTokenTrusted } from "../../core/pool";
import { isPercentageDifferenceWithinThreshold } from "../math";

export const PriceConverter = {
  convertTokenAmountToTrackedUsd: _convertTokenAmountToTrackedUsd,
};

function _convertTokenAmountToTrackedUsd(params: {
  amount: BigDecimal;
  token: SingleChainTokenEntity;
  comparisonToken: SingleChainTokenEntity;
  poolEntity: PoolEntity;
  fallbackUsdValue: BigDecimal;
}): BigDecimal {
  const poolToken0 = params.poolEntity.token0_id === params.token.id ? params.token : params.comparisonToken;
  const poolToken1 = params.poolEntity.token0_id === params.token.id ? params.comparisonToken : params.token;
  const tvl0Usd = params.poolEntity.totalValueLockedToken0.times(poolToken0.trackedUsdPrice);
  const tvl1Usd = params.poolEntity.totalValueLockedToken1.times(poolToken1.trackedUsdPrice);

  const isPoolTvlBalanced = isPercentageDifferenceWithinThreshold(tvl0Usd, tvl1Usd, MAX_TVL_IMBALANCE_PERCENTAGE);

  const isToken0Dominant = tvl0Usd.gt(tvl1Usd);
  const isToken1Dominant = tvl1Usd.gt(tvl0Usd);

  const isToken0Trusted = isPoolTokenTrusted(poolToken0, params.poolEntity.chainId);
  const isToken1Trusted = isPoolTokenTrusted(poolToken1, params.poolEntity.chainId);

  if (!isPoolTvlBalanced && ((isToken0Dominant && !isToken0Trusted) || (isToken1Dominant && !isToken1Trusted))) {
    return params.fallbackUsdValue;
  }

  const isToken0PriceDiscoveryCapitalLowerThanTVL = poolToken0.trackedPriceDiscoveryCapitalUsd.lt(tvl0Usd);
  const isToken1PriceDiscoveryCapitalLoverThanTVL = poolToken1.trackedPriceDiscoveryCapitalUsd.lt(tvl1Usd);

  if (
    isToken0PriceDiscoveryCapitalLowerThanTVL &&
    !isToken0Trusted &&
    isToken1PriceDiscoveryCapitalLoverThanTVL &&
    !isToken1Trusted
  ) {
    return params.fallbackUsdValue;
  }

  const tokenTrackedUsdPrice =
    params.token.id === params.poolEntity.token0_id ? poolToken0.trackedUsdPrice : poolToken1.trackedUsdPrice;

  const amountInUsd = params.amount.times(tokenTrackedUsdPrice);
  return amountInUsd;
}
